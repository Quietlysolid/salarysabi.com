import { describe, it, expect } from "vitest";
import { parsePlanningAmount } from "./planning-input";
describe("planning input", () => {
  it("preserves fractional rates and currency", () => {
    expect(parsePlanningAmount("7.5", false, 100)).toBe(7.5);
    expect(parsePlanningAmount("1,500.50")).toBe(1500.5);
  });
  it.each(["-5", "7..5", "1,23", "NaN", "1e8", "1.234"])("rejects malformed input %s", value => expect(parsePlanningAmount(value)).toBeNull());
  it("requires a rate without inventing a default", () => {
    expect(parsePlanningAmount("", false, 100)).toBeNull();
    expect(parsePlanningAmount("101", false, 100)).toBeNull();
    expect(parsePlanningAmount("0", false, 100)).toBe(0);
    expect(parsePlanningAmount("", true)).toBe(0);
  });
});
