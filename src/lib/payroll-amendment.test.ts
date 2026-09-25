import { describe, it, expect } from "vitest";
import { amendmentDraft, amendmentLine, amendmentChanged } from "./payroll-amendment";
const saved = { id:"saved-item", employee_id:null, employee_number:"OLD-1", full_name:"Original name", email:null, monthly_gross:200000, monthly_paye:20000, monthly_statutory_deductions:0, monthly_other_deductions:0, monthly_net_pay:180000 };
describe("saved payroll amendments", () => {
 it("preserves original totals and identity even when the employee was deleted", () => {
  const d=amendmentDraft(saved); expect(amendmentLine(d,"2026.1")).toMatchObject({fullName:"Original name",monthlyPaye:20000,monthlyNetPay:180000}); expect(amendmentChanged(d)).toBe(false);
 });
 it("recalculates only net pay without mutating the snapshot", () => {
  const d={...amendmentDraft(saved),gross:"210000.25",other:"50.10"};
  expect(amendmentLine(d,"2026.1")?.monthlyNetPay).toBe(189950.15); expect(amendmentChanged(d)).toBe(true); expect(saved.monthly_gross).toBe(200000);
 });
 it.each(["", "-1", "NaN", "Infinity", "1.001"])("rejects invalid corrected amounts %s", gross => { expect(amendmentLine({...amendmentDraft(saved),gross},"2026.1")).toBeNull(); });
 it("rejects deductions above gross",()=>{expect(amendmentLine({...amendmentDraft(saved),paye:"300000"},"2026.1")).toBeNull();});
});
