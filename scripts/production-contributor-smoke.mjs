import { chromium } from "playwright";
import assert from "node:assert/strict";
import crypto from "node:crypto";

if (process.env.RUN_PRODUCTION_LIVE_TESTS !== "I_UNDERSTAND") {
  throw new Error("Set RUN_PRODUCTION_LIVE_TESTS=I_UNDERSTAND to run controlled production tests.");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const turnstileTestToken = process.env.TURNSTILE_TEST_TOKEN;
const siteUrl = "https://salarysabi.com";
assert(supabaseUrl && serviceKey && anonKey, "Supabase test environment is incomplete.");

const createdUsers = [];
const createdReports = [];
const createdSuggestions = [];
const reviewedClaims = [];
const testStartedAt = new Date().toISOString();
let adminUser = null;
let adminSession = null;

async function request(url, { method = "GET", token = serviceKey, body, headers = {} } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      apikey: token === serviceKey ? serviceKey : anonKey,
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

async function rest(path, options = {}) {
  return request(`${supabaseUrl}/rest/v1/${path}`, options);
}

async function createUser(kind) {
  const marker = crypto.randomUUID();
  const email = `salarysabi-${kind}-${marker}@example.com`;
  const password = `Ss!${crypto.randomBytes(24).toString("base64url")}`;
  const created = await request(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    body: { email, password, email_confirm: true, user_metadata: { operational_test: true } },
  });
  assert.equal(created.response.status, 200, `Could not create ${kind} test user: ${JSON.stringify(created.data)}`);
  createdUsers.push(created.data.id);
  const signedIn = await request(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    token: anonKey,
    body: { email, password },
  });
  assert.equal(signedIn.response.status, 200, `Could not sign in ${kind} test user.`);
  return { id: created.data.id, session: { ...signedIn.data, expires_at: Math.floor(Date.now() / 1000) + signedIn.data.expires_in } };
}

async function authenticatedContext(browser, session) {
  const context = await browser.newContext();
  await context.addInitScript(({ storageKey, storedSession }) => {
    localStorage.setItem(storageKey, JSON.stringify(storedSession));
  }, { storageKey: "sb-npiujcemzypvuuvnxfem-auth-token", storedSession: session });
  return context;
}

async function claimFor(userId, type) {
  const result = await rest(`contribution_claims?select=id,source_record_id,status,reward_kobo&contributor_id=eq.${userId}&contribution_type=eq.${type}`);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.length, 1, `Expected one ${type} claim.`);
  return result.data[0];
}

async function submitReward(session, type, campaignId, payload, device) {
  assert(turnstileTestToken, "A controlled Turnstile test token is required.");
  const result = await request(`${supabaseUrl}/functions/v1/submit-rewarded-contribution`, {
    method: "POST",
    token: session.access_token,
    headers: { Origin: siteUrl, "x-salarysabi-device": device },
    body: { type, campaignId, turnstileToken: turnstileTestToken, payload },
  });
  assert.equal(result.response.status, 201, `Reward submission failed: ${JSON.stringify(result.data)}`);
  return result.data;
}

async function rejectClaim(claimId, type) {
  const functionName = type === "salary_report" ? "admin_review_salary_report_claim" : "admin_review_job_source_claim";
  const body = type === "salary_report"
    ? { p_claim_id: claimId, p_decision: "rejected", p_note: "Controlled production verification; no real reward is due.", p_plausibility_confirmed: false, p_privacy_confirmed: false, p_risk_reviewed: false }
    : { p_claim_id: claimId, p_decision: "rejected", p_note: "Controlled production verification; no real reward is due.", p_application_confirmed: false, p_salary_confirmed: false, p_nigeria_confirmed: false, p_duplicate_checked: false, p_risk_reviewed: false };
  const result = await rest(`rpc/${functionName}`, { method: "POST", token: adminSession.access_token, body });
  assert(result.response.ok, `Could not reject controlled ${type} claim: ${JSON.stringify(result.data)}`);
  reviewedClaims.push(claimId);
}

async function removeRows(table, column, values) {
  for (const value of values) {
    const result = await rest(`${table}?${column}=eq.${value}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    assert(result.response.ok, `Could not clean ${table} test row.`);
  }
}

const browser = await chromium.launch({ headless: true });
let salaryContributor;
let jobContributor;

try {
  const campaignsResult = await rest("contribution_campaigns?select=id,slug,contribution_type,status&status=eq.active");
  assert.equal(campaignsResult.response.status, 200);
  const salaryCampaign = campaignsResult.data.find((item) => item.contribution_type === "salary_report");
  const jobCampaign = campaignsResult.data.find((item) => item.contribution_type === "job_source");
  assert(salaryCampaign && jobCampaign, "Both production campaigns must be active.");

  adminUser = await createUser("admin-smoke");
  adminSession = adminUser.session;
  const adminInsert = await rest("admin_users", { method: "POST", body: { user_id: adminUser.id }, headers: { Prefer: "return=minimal" } });
  assert(adminInsert.response.ok, "Could not grant temporary test administrator access.");

  salaryContributor = await createUser("salary-smoke");
  const salaryContext = await authenticatedContext(browser, salaryContributor.session);
  const salaryPage = await salaryContext.newPage();
  await salaryPage.goto(`${siteUrl}/salaries?campaign=${salaryCampaign.slug}`, { waitUntil: "networkidle" });
  await salaryPage.getByLabel("Job title").fill("Operational Test Analyst");
  await salaryPage.getByLabel("Industry").fill("Software Testing");
  await salaryPage.getByLabel("Work location").fill("Lagos");
  await salaryPage.getByRole("button", { name: "Continue" }).click();
  await salaryPage.getByLabel("Monthly salary before tax and deductions").fill("543210");
  await salaryPage.locator('[name="cf-turnstile-response"]').first().waitFor({ state: "attached", timeout: 30_000 });
  assert(await salaryPage.getByRole("button", { name: "Submit anonymous report" }).isDisabled(), "The real form must wait for a Turnstile token.");
  await submitReward(salaryContributor.session, "salary_report", salaryCampaign.id, {
    role: "Operational Test Analyst", industry: "Software Testing", location: "Lagos",
    experienceBand: "3-5", companySize: "11-50", monthlyGross: 543210, payReliability: "on-time",
  }, `salary-smoke-${crypto.randomUUID()}`);
  const salaryClaim = await claimFor(salaryContributor.id, "salary_report");
  createdReports.push(salaryClaim.source_record_id);

  const wallet = await rest("rpc/contributor_wallet", { method: "POST", token: salaryContributor.session.access_token, body: {} });
  assert.equal(wallet.response.status, 200);
  assert.equal(Number(wallet.data.pending_kobo), 100000, "Pending salary reward should be NGN 1,000.");
  const payoutAttempt = await rest("rpc/request_contributor_payout", {
    method: "POST",
    token: salaryContributor.session.access_token,
    body: { p_amount_kobo: 50000, p_payout_method: "airtime", p_payout_destination: "08012345678" },
  });
  assert.equal(payoutAttempt.response.status, 400, "Unapproved rewards must not be payable.");
  assert.match(JSON.stringify(payoutAttempt.data), /Payout exceeds available balance/i);

  const dashboardPage = await salaryContext.newPage();
  await dashboardPage.goto(`${siteUrl}/contributions`, { waitUntil: "networkidle" });
  await dashboardPage.getByRole("heading", { name: "Rewards and review status" }).waitFor();
  await dashboardPage.getByText("Anonymous salary report").waitFor();
  await dashboardPage.getByText("In review").waitFor();
  await rejectClaim(salaryClaim.id, "salary_report");
  await salaryContext.close();

  const jobsResponse = await fetch(`${siteUrl}/api/jobs`);
  const jobsResult = await jobsResponse.json();
  assert.equal(jobsResponse.status, 200);
  assert.equal(jobsResult.data.length > 0, true, "A currently public job is required for controlled evidence verification.");
  const sourceJob = jobsResult.data[0];
  jobContributor = await createUser("job-smoke");
  const jobContext = await authenticatedContext(browser, jobContributor.session);
  const jobPage = await jobContext.newPage();
  await jobPage.goto(`${siteUrl}/suggest-a-job?campaign=${jobCampaign.slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await jobPage.getByLabel("Company name").waitFor({ state: "visible", timeout: 30_000 });
  await jobPage.getByLabel("Company name").fill("SalarySabi Operational Test");
  await jobPage.getByLabel("Salary exactly as shown").fill(`NGN ${sourceJob.salary_min} - NGN ${sourceJob.salary_max} per ${sourceJob.salary_period}`);
  await jobPage.getByLabel("Official vacancy URL").fill(`${siteUrl}/jobs/${sourceJob.slug}`);
  await jobPage.getByLabel("Anything we should check?").fill("Controlled end-to-end verification; reject and remove after testing.");
  await jobPage.getByLabel(/I opened the original vacancy/).check();
  await jobPage.locator('[name="cf-turnstile-response"]').first().waitFor({ state: "attached", timeout: 30_000 });
  assert(await jobPage.getByRole("button", { name: "Verify source and submit" }).isDisabled(), "The real job form must wait for a Turnstile token.");
  await submitReward(jobContributor.session, "job_source", jobCampaign.id, {
    officialUrl: `${siteUrl}/jobs/${sourceJob.slug}`,
    companyName: "SalarySabi Operational Test",
    advertisedSalary: `NGN ${sourceJob.salary_min} - NGN ${sourceJob.salary_max} per ${sourceJob.salary_period}`,
    notes: "Controlled end-to-end verification; reject and remove after testing.",
  }, `job-smoke-${crypto.randomUUID()}`);
  const jobClaim = await claimFor(jobContributor.id, "job_source");
  createdSuggestions.push(jobClaim.source_record_id);
  const evidence = await rest(`contribution_evidence_snapshots?select=fetch_status,source_domain&claim_id=eq.${jobClaim.id}`);
  assert.equal(evidence.response.status, 200);
  assert.equal(evidence.data[0]?.fetch_status, "verified");
  assert.equal(evidence.data[0]?.source_domain, "salarysabi.com");
  await rejectClaim(jobClaim.id, "job_source");
  await jobContext.close();

  console.log("Production contributor smoke passed: salary submission, Turnstile, pending wallet, payout guard, dashboard, job evidence, and admin rejection.");
} finally {
  await browser.close();
  if (adminSession) {
    for (const userId of createdUsers.filter((id) => id !== adminUser?.id)) {
      const claims = await rest(`contribution_claims?select=id,contribution_type,status&contributor_id=eq.${userId}`).catch(() => ({ data: [] }));
      for (const claim of claims.data ?? []) {
        if (claim.status === "pending" && !reviewedClaims.includes(claim.id)) {
          await rejectClaim(claim.id, claim.contribution_type).catch(() => {});
        }
      }
    }
  }
  if (adminUser) {
    await removeRows("contributor_admin_audit_log", "actor_id", [adminUser.id]).catch(() => {});
  }
  await removeRows("salary_reports", "id", createdReports).catch(() => {});
  await removeRows("job_suggestions", "id", createdSuggestions).catch(() => {});
  for (const userId of createdUsers.filter((id) => id !== adminUser?.id)) {
    await request(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { method: "DELETE" }).catch(() => {});
  }
  if (adminUser) {
    await removeRows("admin_users", "user_id", [adminUser.id]).catch(() => {});
    await request(`${supabaseUrl}/auth/v1/admin/users/${adminUser.id}`, { method: "DELETE" }).catch(() => {});
  }
  await rest(`contribution_rate_limits?updated_at=gte.${encodeURIComponent(testStartedAt)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  }).catch(() => {});
}
