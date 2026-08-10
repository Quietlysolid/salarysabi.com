import { describe, expect, it } from "vitest";
import { PAY_CONTEXT_STORAGE_KEY, readPayContext, writePayContext } from "./pay-context";

describe("browser-local pay context", () => {
  it("round-trips calculator values and return context", () => {
    let saved = "";
    const storage = {
      getItem: (key: string) => key === PAY_CONTEXT_STORAGE_KEY ? saved : null,
      setItem: (key: string, value: string) => { if (key === PAY_CONTEXT_STORAGE_KEY) saved = value; },
    };
    const context = {
      values: { gross: "500,000", pension: "40,000", nhf: "", nhis: "", mortgage: "", insurance: "", rent: "" },
      period: "monthly" as const,
      deductionPeriod: "monthly" as const,
      returnField: "pension",
      updatedAt: 1,
    };
    writePayContext(storage, context);
    expect(readPayContext(storage)).toEqual(context);
  });

  it("ignores malformed or incomplete storage", () => {
    expect(readPayContext({ getItem: () => "not json" })).toBeNull();
    expect(readPayContext({ getItem: () => JSON.stringify({ period: "monthly" }) })).toBeNull();
  });
});
