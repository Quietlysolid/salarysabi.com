"use client";

import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { track } from "@/components/analytics";
import { buildPayrollCsv, calculatePayrollLine, downloadPayrollPayslip, parsePayrollCsv, payrollCsvTemplate, payrollTotals, type PayrollEmployeeInput, type PayrollImportRow } from "@/lib/payroll";
import { amendmentDraft, amendmentLine, amendmentChanged, type AmendmentDraft, type SavedPayrollItem } from "@/lib/payroll-amendment";
import { rulesetVersion } from "@/lib/site";

type Organisation = { id: string; name: string; contact_email: string | null };
type EmployeeRow = {
  id: string; employee_number: string; full_name: string; email: string | null;
  monthly_gross: number; monthly_pension: number; monthly_nhf: number; monthly_nhis: number;
  monthly_mortgage_interest: number; monthly_life_insurance: number; monthly_rent: number;
  annual_mortgage_interest_relief?: number; preceding_year_life_insurance_relief?: number;
  monthly_other_deductions: number; active: boolean;
};
type RunRow = { id: string; pay_period: string; status: "draft" | "finalised" | "superseded"; revision_number: number; supersedes_run_id: string | null; correction_note: string | null; total_gross: number; total_paye: number; total_net: number; ruleset_version: string };

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number = (value: FormDataEntryValue | null) => Math.max(0, Number(value) || 0);
const monthValue = () => new Date().toISOString().slice(0, 7);

function toInput(row: EmployeeRow): PayrollEmployeeInput {
  return {
    id: row.id, employeeNumber: row.employee_number, fullName: row.full_name, email: row.email ?? undefined,
    annualMortgageInterestRelief: Number(row.annual_mortgage_interest_relief ?? 0), precedingYearLifeInsuranceRelief: Number(row.preceding_year_life_insurance_relief ?? 0),
    monthlyGross: Number(row.monthly_gross), monthlyPension: Number(row.monthly_pension), monthlyNhf: Number(row.monthly_nhf),
    monthlyNhis: Number(row.monthly_nhis), monthlyMortgageInterest: Number(row.monthly_mortgage_interest),
    monthlyLifeInsurance: Number(row.monthly_life_insurance), monthlyRent: Number(row.monthly_rent),
    monthlyOtherDeductions: Number(row.monthly_other_deductions),
  };
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

function EmployeeFields({ employee }: { employee?: EmployeeRow | null }) {
  return <><p className="payroll-field-help">Enter amounts in naira. Pay and cash deductions are monthly; tax reliefs below are annual.</p><div className="payroll-form-grid">
    <label>Employee number<input name="employee_number" defaultValue={employee?.employee_number} required /></label>
    <label>Full name<input name="full_name" defaultValue={employee?.full_name} required /></label>
    <label>Email, optional<input name="email" type="email" defaultValue={employee?.email ?? ""} /></label>
    <label>Monthly gross pay<input name="monthly_gross" type="number" min="0" step="0.01" defaultValue={employee?.monthly_gross} required /></label>
  </div><details className="payroll-optional-fields"><summary>Deductions and reliefs <span>Optional</span></summary><div className="payroll-form-grid">
    <label>Monthly pension<input name="monthly_pension" type="number" min="0" step="0.01" defaultValue={employee?.monthly_pension ?? 0} /></label>
    <label>Monthly NHF<input name="monthly_nhf" type="number" min="0" step="0.01" defaultValue={employee?.monthly_nhf ?? 0} /></label>
    <label>Monthly NHIS<input name="monthly_nhis" type="number" min="0" step="0.01" defaultValue={employee?.monthly_nhis ?? 0} /></label>
    <label>Monthly mortgage payment withheld<input name="monthly_mortgage_interest" type="number" min="0" step="0.01" defaultValue={employee?.monthly_mortgage_interest ?? 0} /></label>
    <label>Monthly insurance payment withheld<input name="monthly_life_insurance" type="number" min="0" step="0.01" defaultValue={employee?.monthly_life_insurance ?? 0} /></label>
    <label>Monthly residential rent<input name="monthly_rent" type="number" min="0" step="0.01" defaultValue={employee?.monthly_rent ?? 0} /></label>
    <label>Other payroll deductions<input name="monthly_other_deductions" type="number" min="0" step="0.01" defaultValue={employee?.monthly_other_deductions ?? 0} /></label>
  </div><p>These amounts reduce cash pay. Enter mortgage or insurance payments only when deducted through this payroll.</p>
  <h3>Annual tax reliefs</h3><p>Confirm these amounts for the selected payroll year. Existing monthly payments are not evidence of eligibility. Reliefs reduce taxable income, not cash pay.</p>
  <div className="payroll-form-grid">
    <label>Eligible annual mortgage interest<input name="annual_mortgage_interest_relief" type="number" min="0" step="0.01" defaultValue={employee?.annual_mortgage_interest_relief ?? 0} /><small>Interest on your principal residence only; exclude loan principal.</small></label>
    <label>Life insurance paid in the preceding year<input name="preceding_year_life_insurance_relief" type="number" min="0" step="0.01" defaultValue={employee?.preceding_year_life_insurance_relief ?? 0} /><small>Eligible premiums or annuity for the employee or spouse. For 2026 payroll, use qualifying amounts actually paid in 2025.</small></label>
  </div></details></>;
}

function PayrollScopeNotice({ compact = false }: { compact?: boolean }) {
  if (compact) return <aside className="payroll-scope-notice payroll-scope-notice--compact">
    <div><strong>Regular monthly salaries only</strong></div>
    <Link href="/calculation-notes">View limits</Link>
  </aside>;

  return <section className="payroll-scope-notice" aria-labelledby="payroll-scope-title">
    <div className="payroll-scope-intro">
      <span className="eyebrow">Supported payroll scope</span>
      <h2 id="payroll-scope-title">Built for straightforward monthly payroll.</h2>
      <p>Use SalarySabi for up to 20 Nigerian employees who receive a regular monthly salary.</p>
    </div>
    <div className="payroll-scope-columns">
      <div><strong>Supported</strong><ul><li>Regular monthly gross salary</li><li>PAYE and entered deductions</li><li>Monthly payroll records and payslips</li></ul></div>
      <div><strong>Not yet supported</strong><ul><li>Bonuses, commissions, arrears or irregular pay</li><li>Joiners, leavers or part-year employment</li><li>Benefits in kind, expatriate or cross-border cases</li><li>Tax filing, payments or statutory remittance</li></ul></div>
    </div>
    <Link href="/calculation-notes">See every assumption and limitation</Link>
  </section>;
}

export function PayrollWorkspace({ initialView = "run" }: { initialView?: "team" | "run" }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const savingRun = useRef(false);
  const activeUser = useRef<string | null>(null);
  const [savedExport, setSavedExport] = useState<{run: RunRow; lines: ReturnType<typeof calculatePayrollLine>[]} | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [period, setPeriod] = useState(monthValue());
  const [view, setView] = useState<"team" | "run" | "history">(initialView);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [importRows, setImportRows] = useState<PayrollImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [amendingRun, setAmendingRun] = useState<RunRow | null>(null);
  const [amendmentDrafts, setAmendmentDrafts] = useState<AmendmentDraft[]>([]);
  const [correctionNote, setCorrectionNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("recovery") === "1");

  const currentLines = useMemo(() => employees.filter((employee) => employee.active).map(toInput).map(calculatePayrollLine), [employees]);
  const revisedLines = amendmentDrafts.map(draft => amendmentLine(draft, amendingRun?.ruleset_version ?? rulesetVersion));
  const amendmentInvalid = revisedLines.some(line => !line);
  const amendmentHasChanges = amendmentDrafts.some(amendmentChanged);
  const lines = amendingRun ? revisedLines.filter((line): line is NonNullable<typeof line> => line !== null) : currentLines;
  const totals = payrollTotals(lines);
  const alreadySaved = !amendingRun && runs.some(run => run.pay_period.slice(0,7) === period && run.status === "finalised");
  const invalidDraft = !/^\d{4}-\d{2}$/.test(period) || lines.some(line => line.monthlyPaye + line.monthlyStatutoryDeductions + line.monthlyOtherDeductions > line.monthlyGross);


  const load = useCallback(async (userId: string) => {
    const organisationResult = await supabase.from("payroll_organisations").select("id,name,contact_email").eq("owner_user_id", userId).maybeSingle();
    if (organisationResult.error) {
      setMessage(organisationResult.error.code === "42P01" ? "Payroll setup is not active yet. Apply the payroll database migration first." : organisationResult.error.message);
      return;
    }
    if (activeUser.current !== userId) return;
    const nextOrganisation = organisationResult.data as Organisation | null;
    setOrganisation(nextOrganisation);
    if (!nextOrganisation) return;
    const [employeeResult, runResult] = await Promise.all([
      supabase.from("payroll_employees").select("*").eq("organisation_id", nextOrganisation.id).order("created_at"),
      supabase.from("payroll_runs").select("id,pay_period,status,revision_number,supersedes_run_id,correction_note,total_gross,total_paye,total_net,ruleset_version").eq("organisation_id", nextOrganisation.id).order("pay_period", { ascending: false }).order("revision_number", { ascending: false }),
    ]);
    if (activeUser.current !== userId) return;
    setEmployees((employeeResult.data ?? []) as EmployeeRow[]);
    setRuns((runResult.data ?? []) as RunRow[]);
  }, [supabase]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      clearTimeout(timer);
      const userId = next?.user.id ?? null;
      if (activeUser.current !== userId) {
        activeUser.current = userId;
        setOrganisation(null); setEmployees([]); setRuns([]); setSavedExport(null); setAmendingRun(null); setAmendmentDrafts([]); reviewDialog.current?.close();
      }
      setSession(next); setChecked(true);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      // Database requests must run outside the auth callback's session lock.
      if (userId) timer = setTimeout(() => void load(userId), 0);
    });
    return () => { clearTimeout(timer); activeUser.current = null; data.subscription.unsubscribe(); };
  }, [load, supabase]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const credentials = { email: String(data.get("email") || "").trim(), password: String(data.get("password") || "") };
    if (authMode === "signup") track("payroll_signup_submitted");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/payroll` } })
      : await supabase.auth.signInWithPassword(credentials);
    if (!result.error && authMode === "signup") track("payroll_signup_succeeded");
    setMessage(result.error ? result.error.message : authMode === "signup" ? "Check your email to confirm your account." : "Signed in."); setBusy(false);
  }

  async function requestPasswordReset(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const email = form ? String(new FormData(form).get("email") || "").trim() : "";
    if (!email) { setMessage("Enter your email first, then choose Forgot password."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/payroll?recovery=1` });
    setMessage(error ? "We could not send the reset email. Try again shortly." : "If an account exists for that email, a password reset link is on its way.");
    setBusy(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("password_confirmation") || "");
    if (password !== confirmation) { setMessage("The passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage("We could not update your password. Request a new reset link and try again.");
    else {
      setPasswordRecovery(false);
      window.history.replaceState({}, "", "/payroll");
      setMessage("Password updated. Your payroll workspace is ready.");
    }
    setBusy(false);
  }

  async function createOrganisation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session) return; setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const result = await supabase.from("payroll_organisations").insert({ owner_user_id: session.user.id, name: String(data.get("name") || "").trim(), contact_email: session.user.email }).select("id,name,contact_email").single();
    if (result.error) setMessage(result.error.message); else { setOrganisation(result.data as Organisation); setMessage("Payroll workspace created."); }
    setBusy(false);
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!organisation) return; setBusy(true); setMessage("");
    const form = event.currentTarget; const data = new FormData(form);
    const payload = {
      organisation_id: organisation.id, employee_number: String(data.get("employee_number") || "").trim(), full_name: String(data.get("full_name") || "").trim(),
      email: String(data.get("email") || "").trim() || null, monthly_gross: number(data.get("monthly_gross")), monthly_pension: number(data.get("monthly_pension")),
      monthly_nhf: number(data.get("monthly_nhf")), monthly_nhis: number(data.get("monthly_nhis")), monthly_mortgage_interest: number(data.get("monthly_mortgage_interest")),
      monthly_life_insurance: number(data.get("monthly_life_insurance")), monthly_rent: number(data.get("monthly_rent")), annual_mortgage_interest_relief: number(data.get("annual_mortgage_interest_relief")), preceding_year_life_insurance_relief: number(data.get("preceding_year_life_insurance_relief")), monthly_other_deductions: number(data.get("monthly_other_deductions")),
    };
    const result = await supabase.from("payroll_employees").insert(payload).select("*").single();
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => [...current, result.data as EmployeeRow]); form.reset(); setMessage("Employee added."); setView("run"); }
    setBusy(false);
  }

  async function updateEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingEmployee) return; setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const changes = { employee_number: String(data.get("employee_number") || "").trim(), full_name: String(data.get("full_name") || "").trim(), email: String(data.get("email") || "").trim() || null, monthly_gross: number(data.get("monthly_gross")), monthly_pension: number(data.get("monthly_pension")), monthly_nhf: number(data.get("monthly_nhf")), monthly_nhis: number(data.get("monthly_nhis")), monthly_mortgage_interest: number(data.get("monthly_mortgage_interest")), monthly_life_insurance: number(data.get("monthly_life_insurance")), monthly_rent: number(data.get("monthly_rent")), annual_mortgage_interest_relief: number(data.get("annual_mortgage_interest_relief")), preceding_year_life_insurance_relief: number(data.get("preceding_year_life_insurance_relief")), monthly_other_deductions: number(data.get("monthly_other_deductions")), updated_at: new Date().toISOString() };
    const result = await supabase.from("payroll_employees").update(changes).eq("id", editingEmployee.id).select("*").single();
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => current.map((employee) => employee.id === editingEmployee.id ? result.data as EmployeeRow : employee)); setEditingEmployee(null); setMessage("Employee updated."); }
    setBusy(false);
  }

  async function setEmployeeActive(employee: EmployeeRow, active: boolean) {
    const result = await supabase.from("payroll_employees").update({ active, updated_at: new Date().toISOString() }).eq("id", employee.id).select("*").single();
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => current.map((item) => item.id === employee.id ? result.data as EmployeeRow : item)); setMessage(active ? "Employee restored to payroll." : "Employee removed from future payroll runs."); }
  }

  async function readImport(file: File | undefined) {
    if (!file) return;
    const result = parsePayrollCsv(await file.text());
    const existing = new Set(employees.map((employee) => employee.employee_number));
    const duplicateErrors = result.rows.filter((row) => existing.has(row.employeeNumber)).map((row) => `Row ${row.rowNumber}: employee number ${row.employeeNumber} already exists.`);
    setImportRows(result.rows); setImportErrors([...result.errors, ...duplicateErrors]);
  }

  function downloadImportTemplate() {
    download("salarysabi-employee-import-template.csv", payrollCsvTemplate(), "text/csv;charset=utf-8");
  }

  async function importEmployees() {
    if (!organisation || !importRows.length || importErrors.length) return; setBusy(true); setMessage("");
    const payload = importRows.map((row) => ({ organisation_id: organisation.id, employee_number: row.employeeNumber, full_name: row.fullName, email: row.email ?? null, monthly_gross: row.monthlyGross, monthly_pension: row.monthlyPension, monthly_nhf: row.monthlyNhf, monthly_nhis: row.monthlyNhis, monthly_mortgage_interest: row.monthlyMortgageInterest, monthly_life_insurance: row.monthlyLifeInsurance, monthly_rent: row.monthlyRent, annual_mortgage_interest_relief: row.annualMortgageInterestRelief ?? 0, preceding_year_life_insurance_relief: row.precedingYearLifeInsuranceRelief ?? 0, monthly_other_deductions: row.monthlyOtherDeductions }));
    const result = await supabase.from("payroll_employees").insert(payload).select("*");
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => [...current, ...result.data as EmployeeRow[]]); setImportRows([]); setImportErrors([]); setMessage(`${result.data.length} employees imported.`); track("payroll_import_completed"); setView("run"); }
    setBusy(false);
  }

  async function finaliseRun() {
    if (!organisation || !lines.length || savingRun.current || alreadySaved || invalidDraft) return;
    savingRun.current = true; setBusy(true); setMessage("");
    try {
    const payPeriod = `${period}-01`;
    if (amendingRun && correctionNote.trim().length < 3) { setMessage("Add a correction note before finalising an amended run."); setBusy(false); return; }
    if (amendingRun && (amendmentInvalid || !amendmentHasChanges)) { setMessage("Enter valid corrected amounts before saving."); setBusy(false); return; }
    const items = lines.map((line) => ({ employee_id: line.id, monthly_gross: line.monthlyGross, monthly_paye: line.monthlyPaye, monthly_statutory_deductions: line.monthlyStatutoryDeductions, monthly_other_deductions: line.monthlyOtherDeductions, monthly_net_pay: line.monthlyNetPay }));
    const runResult = amendingRun
      ? await supabase.rpc("amend_payroll_run", { p_run_id: amendingRun.id, p_correction_note: correctionNote.trim(), p_items: items.map(item => ({ ...item, original_item_id: item.employee_id })) })
      : await supabase.rpc("finalise_payroll_run", { p_organisation_id: organisation.id, p_pay_period: payPeriod, p_ruleset_version: rulesetVersion, p_items: items, p_supersedes_run_id: null, p_correction_note: null });
    if (runResult.error) { setMessage(runResult.error.code === "PGRST202" && amendingRun ? "Amendment saving is not configured yet. Apply the saved-payroll amendment database migration." : runResult.error.code === "23505" ? "A payroll run already exists for this month." : runResult.error.message); setBusy(false); return; }
    setRuns((current) => [runResult.data as RunRow, ...current.map((run) => run.id === amendingRun?.id ? { ...run, status: "superseded" as const } : run)]);
    setMessage(amendingRun ? "Amended payroll finalised. The original remains in history." : "Payroll finalised and saved."); setAmendingRun(null); setCorrectionNote(""); setView("history");
    } catch { setMessage("We could not confirm the save. Check History before retrying; your draft is still here."); }
    finally { savingRun.current = false; setBusy(false); reviewDialog.current?.close(); }
  }

  async function openSavedExports(run: RunRow) {
    setBusy(true); setMessage(""); setSavedExport(null);
    const userId = activeUser.current;
    try {
      const {data,error} = await supabase.from("payroll_run_items").select("id,employee_id,employee_number,full_name,email,monthly_gross,monthly_paye,monthly_statutory_deductions,monthly_other_deductions,monthly_net_pay").eq("run_id", run.id).order("employee_number");
      if(error || !data?.length) throw new Error("Saved records unavailable");
      const saved = (data as SavedPayrollItem[]).map(item => amendmentLine(amendmentDraft(item), run.ruleset_version));
      if(saved.some(line => !line)) throw new Error("Invalid saved record");
      if (activeUser.current !== userId) return;
      setSavedExport({run, lines: saved.filter((line): line is NonNullable<typeof line> => line !== null)});
    } catch { setMessage("Could not load saved exports. Please try again."); } finally { setBusy(false); }
  }

  function exportSchedule() {
    if (!organisation) return;
    track("payroll_register_downloaded");
    download(`salarysabi-payroll-${period}-draft.csv`, buildPayrollCsv(period, organisation.name, lines, amendingRun?.ruleset_version ?? rulesetVersion), "text/csv;charset=utf-8");
  }

  async function beginAmendment(run: RunRow) {
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.from("payroll_run_items").select("id,employee_id,employee_number,full_name,email,monthly_gross,monthly_paye,monthly_statutory_deductions,monthly_other_deductions,monthly_net_pay").eq("run_id", run.id).order("employee_number");
      if (error || !data?.length) { setMessage("Could not load the saved payroll figures. Please try again."); return; }
      setAmendmentDrafts((data as SavedPayrollItem[]).map(amendmentDraft));
      setPeriod(run.pay_period.slice(0, 7)); setAmendingRun(run); setCorrectionNote(""); setView("run");
    } catch { setMessage("Could not load the saved payroll figures. Please try again."); } finally { setBusy(false); }
  }

  async function savePayslip(line: ReturnType<typeof calculatePayrollLine>) {
    if (!organisation) return;
    track("payroll_payslip_downloaded");
    await downloadPayrollPayslip(organisation.name, period, line);
  }

  if (!checked) return <section className="payroll-shell"><p>Checking your account…</p></section>;
  if (!session) return <section className="payroll-shell payroll-access payroll-entry">
    <div className="payroll-entry-intro"><span className="eyebrow">For employers</span><h1>Small-team payroll</h1>
      <p>Calculate monthly pay, generate payslips, and keep records for up to 20 Nigerian employees.</p>
      <ol className="payroll-entry-steps" aria-label="How payroll works">
        <li><span>01</span>Add employees</li>
        <li><span>02</span>Review payroll</li>
        <li><span>03</span>Export records</li>
      </ol>
      <aside className="payroll-boundary"><strong>For regular monthly salaries.</strong> SalarySabi does not make payments or remit taxes.</aside>
      <details className="payroll-entry-limits">
        <summary>Supported payroll and limitations</summary>
        <PayrollScopeNotice />
      </details>
    </div>
    <div className="payroll-auth-panel">
      <div className="payroll-auth-toggle" role="group" aria-label="Account access">
        <button aria-pressed={authMode === "signin"} className={authMode === "signin" ? "active" : ""} onClick={() => { setAuthMode("signin"); setShowPassword(false); setMessage(""); }} type="button">Sign in</button>
        <button aria-pressed={authMode === "signup"} className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setShowPassword(false); setMessage(""); track("payroll_signup_viewed"); }} type="button">Create account</button>
      </div>
      <h2>{authMode === "signup" ? "Create your payroll account" : "Sign in to your workspace"}</h2>
      <form onSubmit={authenticate}>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <div className="payroll-password-field">
          <label htmlFor="payroll-access-password">Password</label>
          <div className="payroll-password-input">
            <input id="payroll-access-password" name="password" type={showPassword ? "text" : "password"} autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={8} aria-describedby={authMode === "signup" ? "payroll-password-hint" : undefined} required />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-controls="payroll-access-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          {authMode === "signup" && <small id="payroll-password-hint">Use at least 8 characters.</small>}
        </div>
        {authMode === "signin" && <div className="payroll-password-actions"><button disabled={busy} onClick={requestPasswordReset} type="button">Forgot password?</button></div>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? "Please wait..." : authMode === "signup" ? "Create account" : "Sign in"}</button>
        <small>Your payroll records are private.</small>
      </form>
      <p className="payroll-message" role="status">{message}</p>
    </div>
  </section>;
  if (passwordRecovery && session) return <section className="payroll-shell payroll-access payroll-recovery"><span className="eyebrow">Secure account recovery</span><h1>Choose a new password.</h1><p>Use at least eight characters. Your payroll records will stay connected to the same private account.</p><form onSubmit={updatePassword}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label><label>Confirm new password<input name="password_confirmation" type="password" autoComplete="new-password" minLength={8} required /></label><button className="primary-button" disabled={busy} type="submit">Update password</button></form><p className="payroll-message" role="status">{message}</p></section>;
  if (!organisation) return <section className="payroll-shell payroll-access payroll-onboarding"><span className="eyebrow">Set up payroll</span><h1>Create your employer workspace.</h1><ol className="payroll-onboarding-steps" aria-label="Payroll setup steps"><li className="active"><span>01</span><strong>Create workspace</strong></li><li><span>02</span><strong>Add employees</strong></li><li><span>03</span><strong>Run payroll</strong></li></ol><PayrollScopeNotice /><form onSubmit={createOrganisation}><label>Business name<input name="name" minLength={2} maxLength={120} required /></label><label className="payroll-scope-confirmation"><input name="supported_scope" type="checkbox" required /><span>My team uses regular monthly salaries, and I understand that the complex cases listed above are not yet supported.</span></label><button className="primary-button" disabled={busy} type="submit">Create workspace</button><p className="payroll-private-note"><strong>Private to your account.</strong> Your business and payroll records are available only inside your employer workspace.</p></form><p className="payroll-message" role="status">{message}</p></section>;

  return <section className="payroll-shell payroll-workspace">
    <dialog ref={reviewDialog} className="payroll-review-dialog" aria-labelledby="payroll-review-title" onCancel={event => { if (busy) event.preventDefault(); }}><h2 id="payroll-review-title">Review before saving</h2><p>{period} &middot; {lines.length} {lines.length === 1 ? "employee" : "employees"}</p><dl><div><dt>Gross payroll</dt><dd>{money.format(totals.gross)}</dd></div><div><dt>PAYE</dt><dd>{money.format(totals.paye)}</dd></div><div><dt>Other deductions</dt><dd>{money.format(totals.deductions)}</dd></div><div><dt>Net payroll</dt><dd>{money.format(totals.net)}</dd></div></dl><p>This saves a payroll record. It does not transfer salaries, file taxes or remit contributions. Corrections are saved as a new revision.</p><div><button disabled={busy} type="button" onClick={() => reviewDialog.current?.close()}>Back to draft</button><button disabled={busy} className="primary-button" type="button" onClick={() => void finaliseRun()}>{busy ? "Saving..." : "Confirm and save"}</button></div></dialog>
    <header className="payroll-header"><div><span className="eyebrow">Small-team payroll · Ruleset {rulesetVersion}</span><h1>{organisation.name}</h1></div><button onClick={() => supabase.auth.signOut()} type="button">Sign out</button></header>
    <nav className="payroll-tabs" aria-label="Payroll sections"><button className={view === "run" ? "active" : ""} onClick={() => setView("run")} type="button">Payroll & payslips</button><button className={view === "team" ? "active" : ""} onClick={() => setView("team")} type="button">Team <span>{employees.length}</span></button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")} type="button">History <span>{runs.length}</span></button></nav>
    <p className="payroll-message" role="status">{message}</p>
    {view === "run" && <div className="payroll-run">
      <div className="payroll-period-heading"><h2>{/^\d{4}-\d{2}$/.test(period) ? new Intl.DateTimeFormat("en-NG",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${period}-01T00:00:00Z`)) : "Choose a pay period"} <span>Draft{amendingRun ? " amendment" : ""}</span></h2><p>Unsaved calculation. Finalising saves a record; it does not pay employees.</p></div>
      <PayrollScopeNotice compact />
      {alreadySaved && <p className="payroll-draft-note">A saved run exists for this month. <button type="button" onClick={() => setView("history")}>Open History</button> to export it or create an amendment.</p>}
      {invalidDraft && <p role="alert">Choose a valid month and check that deductions do not exceed gross pay.</p>}
      {amendingRun && <header className="payroll-amendment-heading"><div><h2>Amend {new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${amendingRun.pay_period.slice(0,10)}T00:00:00Z`))} &middot; Revision {amendingRun.revision_number + 1}</h2><p>The original stays in History. Changes apply only to this run.</p></div><button onClick={() => { setAmendingRun(null); setCorrectionNote(""); }} type="button">Cancel amendment</button></header>}
      {amendingRun && <section className="payroll-amendment-editor" aria-label="Correct saved payroll figures">
        <h2>Correct saved figures</h2><p>All amounts are monthly, in naira. Enter corrected PAYE and deductions explicitly; only net pay is recalculated. Historical relief inputs were not saved.</p>
        {amendmentDrafts.map((draft, index) => <fieldset key={draft.original.id}><legend>{draft.original.full_name} - {draft.original.employee_number}</legend>
          <div className="payroll-form-grid">{([ ["gross", "Gross pay", "monthly_gross"], ["paye", "PAYE", "monthly_paye"], ["deductions", "Payroll deductions excluding PAYE", "monthly_statutory_deductions"], ["other", "Other deductions", "monthly_other_deductions"] ] as const).map(([key, label, originalKey]) => <label key={key}>{label}<small>Original: {money.format(Number(draft.original[originalKey]))}</small><input type="number" min="0" step="0.01" value={draft[key]} onChange={event => setAmendmentDrafts(current => current.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item))} /></label>)}</div>
          <div className="payroll-net-comparison"><p><span>Original net pay</span><strong>{money.format(Number(draft.original.monthly_net_pay))}</strong></p><p><span>Revised net pay</span><strong>{revisedLines[index] ? money.format(revisedLines[index]!.monthlyNetPay) : "Check the amounts"}</strong></p></div>
        </fieldset>)}
        {amendmentInvalid && <p role="alert">Use non-negative amounts with up to two decimal places. Deductions including PAYE cannot exceed gross pay.</p>}
      </section>}
      {amendingRun && <div className="payroll-correction-reason"><label htmlFor="payroll-correction-note">Reason for correction <span>(required)</span></label><p id="payroll-correction-help">Briefly explain what changed and why. This is saved with the revision.</p><textarea id="payroll-correction-note" aria-describedby="payroll-correction-help" value={correctionNote} onChange={(event) => setCorrectionNote(event.target.value)} minLength={3} maxLength={500} rows={3} required /></div>}
      <div className="payroll-run-bar"><label>Pay period<input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} disabled={Boolean(amendingRun)} /></label><div><button disabled={!lines.length || Boolean(amendingRun && amendmentInvalid)} onClick={exportSchedule} type="button">Download draft CSV</button><button className="primary-button" disabled={busy || alreadySaved || invalidDraft || !lines.length || Boolean(amendingRun && (amendmentInvalid || !amendmentHasChanges || correctionNote.trim().length < 3))} onClick={() => reviewDialog.current?.showModal()} type="button">{amendingRun ? "Finalise amendment" : "Finalise payroll"}</button></div></div>
      {lines.length ? <><div className="payroll-totals"><div><span>Gross payroll</span><strong>{money.format(totals.gross)}</strong></div><div><span>PAYE</span><strong>{money.format(totals.paye)}</strong></div><div><span title="All cash deductions other than PAYE">Other deductions</span><strong>{money.format(totals.deductions)}</strong></div><div><span>Net payroll</span><strong>{money.format(totals.net)}</strong></div></div><div className="payroll-table" role="table" aria-label="Payroll preview"><div className="payroll-table-head" role="row"><span>Employee</span><span>Gross</span><span>PAYE</span><span>Deductions</span><span>Net pay</span><span>Payslip</span></div>{lines.map((line) => <div role="row" key={line.id}><span><strong>{line.fullName}</strong><small>{line.employeeNumber}</small></span><span data-label="Gross">{money.format(line.monthlyGross)}</span><span data-label="PAYE">{money.format(line.monthlyPaye)}</span><span data-label="Deductions excluding PAYE">{money.format(line.monthlyStatutoryDeductions + line.monthlyOtherDeductions)}</span><strong data-label="Net pay">{money.format(line.monthlyNetPay)}</strong><button onClick={() => void savePayslip(line)} type="button" className="payroll-payslip-download" aria-label={`Download draft payslip for ${line.fullName}`}>Draft payslip</button></div>)}</div></> : <div className="payroll-empty"><h2>Add your first employee</h2><button className="primary-button" onClick={() => setView("team")} type="button">Add employee</button></div>}
    </div>}
    {view === "team" && <div className="payroll-team-page">
      <div className="payroll-team-overview"><h2>Your team</h2><p>Manage the people included in your monthly payroll.</p></div>
      {employees.length > 0 && <div className="payroll-team-list"><h2>Current team</h2>{employees.map((employee) => <article className={employee.active ? "" : "inactive"} key={employee.id}><div><strong>{employee.full_name}</strong><span>{employee.employee_number} · {employee.active ? "Active" : "Inactive"}</span></div><strong>{money.format(Number(employee.monthly_gross))} monthly</strong><div className="payroll-employee-actions"><button onClick={() => setEditingEmployee(employee)} type="button">Edit</button><button onClick={() => void setEmployeeActive(employee, !employee.active)} type="button">{employee.active ? "Deactivate" : "Restore"}</button></div></article>)}</div>}
      <details className="payroll-add-disclosure" open={Boolean(editingEmployee) || employees.length === 0}>
        <summary>{editingEmployee ? `Edit ${editingEmployee.full_name}` : "Add an employee"}</summary>
        <form key={editingEmployee?.id ?? "new"} className="payroll-employee-form" onSubmit={editingEmployee ? updateEmployee : addEmployee}><div><span className="eyebrow">{editingEmployee ? "Edit employee" : "New employee"}</span><h2>{editingEmployee ? `Update ${editingEmployee.full_name}` : "Add employee"}</h2></div><EmployeeFields employee={editingEmployee} /><div className="payroll-form-actions"><button className="primary-button" disabled={busy} type="submit">{editingEmployee ? "Save changes" : "Add employee"}</button>{editingEmployee && <button onClick={() => setEditingEmployee(null)} type="button">Cancel</button>}</div></form>
      </details>
            <details className="payroll-csv-disclosure"><summary>Import employees from CSV</summary><section className="payroll-import"><div><span className="eyebrow">Bulk onboarding</span><h2>Add several employees at once</h2></div><div className="payroll-import-actions"><button onClick={downloadImportTemplate} type="button">Download template</button><input className="payroll-csv-input" aria-label="Choose employee CSV file" accept=".csv,text/csv" type="file" onChange={(event) => void readImport(event.target.files?.[0])} /></div>{importRows.length > 0 && <div className="payroll-import-preview"><strong>{importRows.length} rows ready to review</strong>{importErrors.map((error) => <p key={error}>{error}</p>)}<button className="primary-button" disabled={busy || importErrors.length > 0} onClick={importEmployees} type="button">Import {importRows.length} employees</button></div>}</section></details>
    </div>}
    {view === "history" && <section className="payroll-history" aria-labelledby="payroll-history-title">
      <h2 id="payroll-history-title">Payroll history</h2>
      {savedExport && <section className="payroll-saved-exports" aria-label="Saved payroll exports"><h3>Saved exports: {savedExport.run.pay_period.slice(0,7)} &middot; Revision {savedExport.run.revision_number}</h3><p>{savedExport.run.status === "superseded" ? "Superseded" : "Finalised"} record. These figures come from the saved run, not your current team.</p><button type="button" onClick={() => download(`salarysabi-payroll-${savedExport.run.pay_period.slice(0,7)}-r${savedExport.run.revision_number}.csv`, buildPayrollCsv(savedExport.run.pay_period.slice(0,7),organisation.name,savedExport.lines,savedExport.run.ruleset_version,savedExport.run.status === "superseded" ? "Superseded" : "Finalised",savedExport.run.revision_number), "text/csv;charset=utf-8")}>Download saved CSV</button>{savedExport.lines.map(line => <div key={line.id}><span>{line.fullName}</span><button type="button" onClick={() => void downloadPayrollPayslip(organisation.name,savedExport.run.pay_period.slice(0,7),line,savedExport.run.status === "superseded" ? "Superseded" : "Finalised",savedExport.run.revision_number)}>Download saved payslip for {line.fullName}</button></div>)}<button type="button" onClick={() => setSavedExport(null)}>Close exports</button></section>}
      <p className="payroll-history-intro">Review saved runs. Amendments create a new revision and keep the original in history.</p>
      {runs.length ? runs.map((run) => <article className={run.status === "superseded" ? "superseded" : ""} key={run.id}>
        <header className="payroll-history-card-header">
          <div><h3><time dateTime={run.pay_period.slice(0, 7)}>{new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${run.pay_period.slice(0, 10)}T00:00:00Z`))}</time></h3><small>Revision {run.revision_number} &middot; Ruleset {run.ruleset_version}</small></div>
          <span className="payroll-history-badge">{run.status === "superseded" ? "Superseded" : run.status === "finalised" ? "Finalised" : "Draft"}</span>
        </header>
        <dl className="payroll-history-amounts">
          <div><dt>Gross payroll</dt><dd>{money.format(Number(run.total_gross))}</dd></div>
          <div><dt>PAYE</dt><dd>{money.format(Number(run.total_paye))}</dd></div>
          <div><dt>Net payroll</dt><dd>{money.format(Number(run.total_net))}</dd></div>
        </dl>
        {run.correction_note && <p className="payroll-history-note"><strong>Correction note:</strong> {run.correction_note}</p>}
        <button disabled={busy} onClick={() => void openSavedExports(run)} type="button">View saved exports</button>
        {run.status === "finalised" && <footer><button disabled={busy} onClick={() => void beginAmendment(run)} type="button">Create amendment</button></footer>}
      </article>) : <div className="payroll-empty"><h3>No finalised runs yet</h3><p>Your payroll runs will appear here after you finalise them.</p><button className="primary-button" onClick={() => setView("run")} type="button">Go to payroll</button></div>}
    </section>}
  </section>;
}
