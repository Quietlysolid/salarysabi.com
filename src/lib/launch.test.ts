import { describe, expect, it } from "vitest";
import {
  isAnalyticsEvent,
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
    expect(isAnalyticsEvent("paye_calculated")).toBe(true);
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
  });
});
