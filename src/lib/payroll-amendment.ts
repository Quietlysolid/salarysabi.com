import type { PayrollLine } from "./payroll";
export type SavedPayrollItem = {
 id: string; employee_id: string | null; employee_number: string; full_name: string; email: string | null;
 monthly_gross: number; monthly_paye: number; monthly_statutory_deductions: number; monthly_other_deductions: number; monthly_net_pay: number;
};
export type AmendmentDraft = { original: SavedPayrollItem; gross: string; paye: string; deductions: string; other: string };
export function amendmentDraft(item: SavedPayrollItem): AmendmentDraft {
 return { original: item, gross: String(item.monthly_gross), paye: String(item.monthly_paye), deductions: String(item.monthly_statutory_deductions), other: String(item.monthly_other_deductions) };
}
export function amendmentLine(draft: AmendmentDraft, version: string): PayrollLine | null {
 const values = [draft.gross, draft.paye, draft.deductions, draft.other];
 if (values.some(value => !/^\d+(\.\d{1,2})?$/.test(value))) return null;
 const [gross, paye, deductions, other] = values.map(Number);
 if (values.some(value => !Number.isFinite(Number(value)) || Number(value) > 999999999999.99)) return null;
 const net = Math.round((gross - paye - deductions - other) * 100) / 100;
 if (net < 0) return null;
 return { id: draft.original.id, employeeNumber: draft.original.employee_number, fullName: draft.original.full_name,
 email: draft.original.email ?? undefined, monthlyGross: gross, monthlyPaye: paye, monthlyStatutoryDeductions: deductions,
 monthlyOtherDeductions: other, monthlyNetPay: net, rulesetVersion: version,
 monthlyPension: 0, monthlyNhf: 0, monthlyNhis: 0, monthlyMortgageInterest: 0, monthlyLifeInsurance: 0, monthlyRent: 0 };
}
export function amendmentChanged(draft: AmendmentDraft) {
 return Number(draft.gross) !== Number(draft.original.monthly_gross) || Number(draft.paye) !== Number(draft.original.monthly_paye)
 || Number(draft.deductions) !== Number(draft.original.monthly_statutory_deductions) || Number(draft.other) !== Number(draft.original.monthly_other_deductions);
}
