export const analyticsEvents = [
  "page_view",
  "paye_input_started",
  "paye_calculated",
  "paye_to_payslip_clicked",
  "payslip_check_started",
  "payslip_checked",
  "deduction_tracker_interest_yes",
  "deduction_tracker_interest_no",
  "pdf_exported",
  "excel_exported",
  "print_opened",
  "verify_interest",
  "payroll_interest",
  "payslip_signup_viewed",
  "payslip_signup_submitted",
  "payslip_signup_succeeded",
  "payroll_signup_viewed",
  "payroll_signup_submitted",
  "payroll_signup_succeeded",
  "payroll_workspace_created",
  "payroll_first_employee_added",
  "payroll_import_completed",
  "payroll_run_finalised",
  "payroll_second_month_finalised",
  "payroll_register_downloaded",
  "payroll_payslip_downloaded",
  "job_apply_clicked",
  "job_submission_started",
  "job_submission_succeeded",
  "job_alert_created",
  "account_signup_started",
  "account_signup_succeeded",
  "account_signin_succeeded",
  "contributor_interest_viewed",
  "contributor_interest_submitted",
  "contributor_interest_succeeded",
  "tax_update_signup_viewed",
  "tax_update_signup_submitted",
  "tax_update_signup_succeeded",
  "paye_result_shared",
  "reward_offer_viewed",
  "reward_offer_clicked",
  "reward_offer_shared",
  "reward_submission_started",
  "reward_submission_succeeded",
  "reward_claim_approved",
  "reward_claim_rejected",
  "reward_payout_requested",
  "reward_payout_completed",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (
    email.length < 5 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return null;
  }
  return email;
}

export function normalizePath(value: unknown) {
  if (typeof value !== "string") return "/";
  const path = value.trim();
  return path.startsWith("/") && path.length <= 160 ? path : "/";
}

const internalAnalyticsPathPrefixes = ["/admin", "/e2e-fixtures"];

export function isPublicAnalyticsPath(value: unknown) {
  const path = normalizePath(value);
  return !internalAnalyticsPathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function normalizeReferrerHost(value: unknown) {
  if (typeof value !== "string" || !value) return "direct";
  const candidate = value.trim().toLowerCase();
  if (candidate === "direct") return "direct";
  try {
    const hostname = candidate.includes("://")
      ? new URL(candidate).hostname
      : candidate;
    return /^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)*(?<!-)$/.test(hostname)
      ? hostname.slice(0, 120)
      : "direct";
  } catch {
    return "direct";
  }
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return (
    typeof value === "string" &&
    (analyticsEvents as readonly string[]).includes(value)
  );
}
