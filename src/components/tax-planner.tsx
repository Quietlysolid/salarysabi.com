"use client";

import { useState } from "react";
import { CompanyTaxPlanner } from "./company-tax-planner";
import { calculateForeignIncome, calculateIndependentIncome, calculateInvestmentWithholding } from "@/lib/tax-planners";
import { parsePlanningAmount } from "@/lib/planning-input";
import { taxActUrl, presumptiveTaxUrl, virtualAssetsTaxUrl, withholdingRegulationsUrl } from "@/lib/site";

type Mode = "freelancer" | "creator" | "foreign" | "company" | "investment";
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });
export function TaxPlanner({ mode }: { mode: Mode }) {
  return mode === "company" ? <CompanyTaxPlanner /> : <OtherTaxPlanner mode={mode} />;
}
function OtherTaxPlanner({ mode }: { mode: Exclude<Mode, "company"> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof calculateIndependentIncome> | ReturnType<typeof calculateInvestmentWithholding> | null>(null);
  const investment = mode === "investment";
  const foreign = mode === "foreign";
  const fields = [
    { key: "revenue", label: foreign ? "Annual business receipts in foreign currency" : investment ? "Investment payment before withholding" : "Annual business income", optional: false },
    ...(foreign ? [{ key: "exchange", label: "Naira per unit of foreign currency", optional: false }] : []),
    ...(investment ? [{ key: "rate", label: "Applicable withholding rate (%)", optional: false }] : [{ key: "expenses", label: "Allowable business expenses in naira", optional: true }, { key: "deductions", label: "Eligible personal deductions in naira", optional: true }]),
  ];
  const title = investment ? "Investment withholding calculator" : foreign ? "Foreign business income planner" : "Freelance or creator tax";
  return <section className="tax-planner" aria-labelledby="planner-title">
    <header><h1 id="planner-title">{title}</h1><p>{investment ? "Calculate withholding using a rate you have confirmed for this payment." : "Estimate 2026 personal income tax on sole-trader business profit."}</p></header>
    <div className="tax-planner-grid"><form className="tax-planner-form" noValidate onSubmit={event => {
      event.preventDefault();
      const next: Record<string,string> = {}; const parsed: Record<string,number> = {};
      for (const field of fields) {
        const value = parsePlanningAmount(values[field.key] ?? "", field.optional, field.key === "rate" ? 100 : 1e12);
        if (value === null || (field.key === "exchange" && value === 0)) next[field.key] = field.key === "rate" ? "Enter a rate from 0 to 100, with up to two decimal places." : "Enter a valid non-negative amount with up to two decimal places. Exchange rates must be greater than zero.";
        else parsed[field.key] = value;
      }
      if (!confirmed) next.scope = "Confirm the calculation scope before continuing.";
      setErrors(next); setResult(null);
      if (Object.keys(next).length) { document.getElementById(`planner-${Object.keys(next)[0]}`)?.focus(); return; }
      setResult(investment ? calculateInvestmentWithholding(parsed.revenue, parsed.rate) : foreign ? calculateForeignIncome(parsed.revenue, parsed.exchange, parsed.expenses, parsed.deductions) : calculateIndependentIncome(parsed.revenue, parsed.expenses, parsed.deductions));
      requestAnimationFrame(() => document.getElementById("planner-result")?.focus());
    }}>
      {fields.map(field => <label key={field.key} htmlFor={`planner-${field.key}`}>{field.label}{field.optional ? " (optional)" : ""}<input id={`planner-${field.key}`} inputMode="decimal" required={!field.optional} value={values[field.key] ?? ""} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} onChange={event => { setValues({...values, [field.key]:event.target.value}); setResult(null); }} />{errors[field.key] && <small id={`error-${field.key}`}>{errors[field.key]}</small>}</label>)}
      {!investment && <small>Use income and allowable expenses supported by business records. Personal deductions must be eligible; do not count the same amount twice.</small>}
      <label htmlFor="planner-scope"><span><input id="planner-scope" type="checkbox" checked={confirmed} onChange={event => {setConfirmed(event.target.checked);setResult(null);}} aria-describedby="planner-scope-help" /> {investment ? "I have confirmed the applicable rate for this payment." : "I am a Nigerian-resident sole trader estimating my only taxable income."}</span></label>
      <small id="planner-scope-help">{investment ? "This tool does not choose a rate or determine exemptions, treaty entitlement, credits or final income tax. Enter 0 only if you have confirmed an exemption." : "Not for presumptive tax, virtual assets, companies, employment or mixed income, losses brought forward or foreign-tax credits. Foreign currency alone does not determine taxability."}</small>
      {!investment && <details><summary>Income without reliable records, or paid in crypto?</summary><p>This profit-based estimate does not assess those cases. Check the <a href={presumptiveTaxUrl}>presumptive tax regulations</a> or <a href={virtualAssetsTaxUrl}>virtual-asset guidelines</a> with your revenue authority.</p></details>}
      {errors.scope && <p role="alert">{errors.scope}</p>}
      <button className="primary-button" type="submit">{investment ? "Calculate withholding" : "Estimate tax"}</button>
    </form><aside id="planner-result" tabIndex={-1} className="tax-planner-result" aria-live="polite">
      {!result ? <h2>Enter your figures to begin</h2> : "withholding" in result ? <><span className="eyebrow">Estimated withholding</span><strong>{money.format(result.withholding)}</strong><dl><div><dt>Rate used</dt><dd>{result.rate * 100}%</dd></div><div><dt>Payment after withholding</dt><dd>{money.format(result.net)}</dd></div></dl></> : <><span className="eyebrow">Estimated annual personal tax</span><strong>{money.format(result.annualTax)}</strong><dl><div><dt>Business profit</dt><dd>{money.format(result.netBusinessIncome)}</dd></div><div><dt>Monthly tax reserve</dt><dd>{money.format(result.monthlyReserve)}</dd></div></dl></>}
      <p className="planner-caveat">Planning estimate only. This does not file a return or establish tax eligibility.</p><a href={investment ? withholdingRegulationsUrl : taxActUrl}>{investment ? "Official withholding regulations" : "Nigeria Tax Act 2025"}</a>
    </aside></div>
  </section>;
}
