export const PAY_CONTEXT_STORAGE_KEY = "salarysabi:pay-context";

export type PayContext = {
  values: Record<"gross" | "pension" | "nhf" | "nhis" | "mortgage" | "insurance" | "rent", string>;
  period: "monthly" | "annual";
  deductionPeriod: "monthly" | "annual";
  returnField?: string;
  updatedAt: number;
};

export function readPayContext(storage: Pick<Storage, "getItem">): PayContext | null {
  try {
    const parsed = JSON.parse(storage.getItem(PAY_CONTEXT_STORAGE_KEY) ?? "null") as Partial<PayContext> | null;
    if (!parsed?.values || (parsed.period !== "monthly" && parsed.period !== "annual")) return null;
    return parsed as PayContext;
  } catch {
    return null;
  }
}

export function writePayContext(storage: Pick<Storage, "setItem">, context: PayContext) {
  storage.setItem(PAY_CONTEXT_STORAGE_KEY, JSON.stringify(context));
}
