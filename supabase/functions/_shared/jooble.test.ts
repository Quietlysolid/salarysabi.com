import { describe, expect, it } from "vitest";
import { inferWorkMode, normalizeEmploymentType, parseNgnSalary, slugifyJob, stripHtml } from "./jooble";

describe("Jooble import normalization", () => {
  it("parses monthly naira ranges", () => {
    expect(parseNgnSalary("₦150,000 - ₦200,000 per month")).toEqual({ minimum: 150000, maximum: 200000, period: "monthly" });
    expect(parseNgnSalary("NGN 250k monthly")).toEqual({ minimum: 250000, maximum: 250000, period: "monthly" });
  });

  it("parses annual salaries and rejects unsupported or non-naira pay", () => {
    expect(parseNgnSalary("NGN 3,600,000 per annum")).toEqual({ minimum: 3600000, maximum: 3600000, period: "annual" });
    expect(parseNgnSalary("$2,000 monthly")).toBeNull();
    expect(parseNgnSalary("₦5,000 daily")).toBeNull();
    expect(parseNgnSalary("Competitive salary")).toBeNull();
  });

  it("normalizes display fields", () => {
    expect(normalizeEmploymentType("Contract work")).toBe("Contract");
    expect(inferWorkMode({ title: "Designer", location: "Lagos", snippet: "Hybrid role" })).toBe("hybrid");
    expect(stripHtml("<b>Build &amp; ship</b>")).toBe("Build & ship");
    expect(slugifyJob({ id: 1234, title: "Sous Chef", company: "Yellow Door" })).toBe("sous-chef-yellow-door-1234");
  });
});
