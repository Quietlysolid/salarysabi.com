export const analyticsEvents = [
  "page_view",
  "paye_calculated",
  "payslip_checked",
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
  "job_apply_clicked",
  "job_submission_started",
  "job_submission_succeeded",
  "job_alert_created",
  "account_signup_started",
  "account_signup_succeeded",
  "account_signin_succeeded",
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

export function normalizeReferrerHost(value: unknown) {
  if (typeof value !== "string" || !value) return "direct";
  try {
    return new URL(value).hostname.slice(0, 120) || "direct";
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
