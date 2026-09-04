import { describe, expect, it } from "vitest";
import {
  isAnalyticsEvent,
  isPublicAnalyticsPath,
  normalizeEmail,
  normalizePath,
  normalizeReferrerHost,
} from "./launch";

describe("launch input validation", () => {
  it("normalizes a valid email", () => {
    expect(normalizeEmail("  Owner@Example.COM ")).toBe("owner@example.com");
  });

  it("rejects invalid emails", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
  });

  it("allows only known analytics events", () => {
    expect(isAnalyticsEvent("paye_input_started")).toBe(true);
    expect(isAnalyticsEvent("paye_calculated")).toBe(true);
    expect(isAnalyticsEvent("paye_to_payslip_clicked")).toBe(true);
    expect(isAnalyticsEvent("payslip_check_started")).toBe(true);
    expect(isAnalyticsEvent("deduction_tracker_interest_yes")).toBe(true);
    expect(isAnalyticsEvent("deduction_tracker_interest_no")).toBe(true);
    expect(isAnalyticsEvent("reward_offer_viewed")).toBe(true);
    expect(isAnalyticsEvent("reward_offer_clicked")).toBe(true);
    expect(isAnalyticsEvent("reward_submission_succeeded")).toBe(true);
    expect(isAnalyticsEvent("reward_payout_completed")).toBe(true);
    expect(isAnalyticsEvent("salary_value")).toBe(false);
  });

  it("limits paths and reduces referrers to hostnames", () => {
    expect(normalizePath("/tax-bands")).toBe("/tax-bands");
    expect(normalizePath("https://bad.example")).toBe("/");
    expect(normalizeReferrerHost("https://www.google.com/search?q=paye")).toBe(
      "www.google.com",
    );
    expect(normalizeReferrerHost("")).toBe("direct");
    expect(normalizeReferrerHost("www.google.com")).toBe("www.google.com");
  });

  it("excludes internal routes from product analytics", () => {
    expect(isPublicAnalyticsPath("/paye-guide")).toBe(true);
    expect(isPublicAnalyticsPath("/admin")).toBe(false);
    expect(isPublicAnalyticsPath("/admin/contributors")).toBe(false);
    expect(isPublicAnalyticsPath("/e2e-fixtures/workspace")).toBe(false);
  });
});
