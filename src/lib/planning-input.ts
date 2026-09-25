/** Strict parsing: never silently turn a negative or decimal input into another amount. */
export function parsePlanningAmount(value: string, optional = false, max = 1e12): number | null {
  const text = value.trim();
  if (!text) return optional ? 0 : null;
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text.replaceAll(",", ""));
  return Number.isFinite(amount) && amount <= max ? amount : null;
}
