"use client";

import { useState } from "react";
import { calculateCompanyTax } from "@/lib/tax-planners";
import { taxTransitionUrl } from "@/lib/site";

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });
const source = "https://nass.gov.ng/documents/download/11249";
const validAmount = (value: string) => /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value.trim()) && Number(value.replaceAll(",", "")) <= 1_000_000_000_000;
const amount = (value: string) => Number(value.replaceAll(",", ""));
type Field = "revenue" | "expenses" | "assets" | "assessable" | "total";

export function CompanyTaxPlanner() {
  const [values, setValues] = useState({ revenue: "", expenses: "", assets: "", assessable: "", total: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [result, setResult] = useState<ReturnType<typeof calculateCompanyTax> | null>(null);
  const [useTaxBases, setUseTaxBases] = useState(false);
  const [changed, setChanged] = useState(false);
  const fields: { key: Field; label: string; example: string; help: string }[] = [
    { key: "revenue", label: "Annual revenue", example: "12,000,000", help: "Total annual turnover before expenses." },
    { key: "expenses", label: "Annual business expenses (optional)", example: "2,000,000", help: "Blank means zero. Use tax-deductible expenses from your records." },
    { key: "assets", label: "Total fixed assets", example: "100,000,000", help: "Long-term business assets, such as equipment and property. Enter 0 if none." },
  ];
  if (useTaxBases) fields.push(
    { key: "assessable", label: "Assessable profits", example: "20,000,000", help: "From your tax computation, before capital allowances. Used for development levy." },
    { key: "total", label: "Total profits", example: "15,000,000", help: "Taxable total profits after applicable reliefs and capital allowances. Used for company income tax." },
  );
  return <section className="tax-planner company-tax-planner" aria-labelledby="planner-title">
    <header><h1 id="planner-title">Company tax planner</h1><p>Estimate company income tax and development levy.</p></header>
    <div className="tax-planner-grid">
      <form className="tax-planner-form" noValidate onSubmit={event => {
        event.preventDefault();
        const next: Partial<Record<Field, string>> = {};
        for (const { key } of fields) {
          if (key === "expenses" && !values[key].trim()) continue;
          if (!validAmount(values[key])) next[key] = "Enter a non-negative amount up to 1 trillion naira, with no more than two decimal places.";
        }
        setErrors(next);
        const first = fields.find(({ key }) => next[key]);
        if (first) { setResult(null); document.getElementById(`company-${first.key}`)?.focus(); return; }
        setResult(calculateCompanyTax(amount(values.revenue), amount(values.assets), amount(values.expenses || "0"), useTaxBases ? { assessableProfits: amount(values.assessable), totalProfits: amount(values.total) } : undefined));
        setChanged(false);
        requestAnimationFrame(() => document.getElementById("company-estimate")?.focus());
      }}>
        <label>Calculation basis<select value={useTaxBases ? "tax" : "simple"} onChange={event => { setUseTaxBases(event.target.value === "tax"); setResult(null); setErrors({}); }}><option value="simple">Simplified profit estimate</option><option value="tax">Use profits from my tax computation</option></select></label>
        {fields.map(({ key, label, example, help }) => <label key={key} htmlFor={`company-${key}`}>{label}
          <span className="small-currency-input"><b aria-hidden="true">&#8358;</b><input id={`company-${key}`} required={key !== "expenses"} inputMode="decimal" value={values[key]} placeholder={`Example: ${example}`} aria-invalid={!!errors[key]} aria-describedby={`company-${key}-help${errors[key] ? ` company-${key}-error` : ""}`} onChange={event => {
            setValues(current => ({ ...current, [key]: event.target.value }));
            setErrors(current => ({ ...current, [key]: undefined }));
            if (result) setChanged(true);
            setResult(null);
          }} onBlur={() => { if (validAmount(values[key])) setValues(current => ({ ...current, [key]: amount(current[key]).toLocaleString("en-NG", { maximumFractionDigits: 2 }) })); }} /></span>
          <small id={`company-${key}-help`}>{help}</small>
          {errors[key] && <small className="company-input-error" id={`company-${key}-error`}>{errors[key]}</small>}
        </label>)}
        <details className="company-assets-help"><summary>Which asset value should I use?</summary><p>Use the total fixed-asset value in your company records, not this year&apos;s asset purchases. This input checks company size; it does not calculate capital allowances. Confirm the valuation with your tax adviser if unsure.</p></details>
        <p className="company-scope">For Nigerian-resident companies under ordinary company-tax rules. Special-sector taxes, large-group minimum tax and non-resident companies are outside this planner.</p>
        <button className="primary-button" type="submit">Estimate company tax</button>
      </form>
      <aside id="company-estimate" tabIndex={-1} className={`tax-planner-result${result ? "" : " company-estimate-empty"}`} aria-label="Company tax estimate" aria-live="polite">
        <span className="eyebrow">{result ? "Estimated company taxes" : "Your estimate"}</span>
        {result ? <><strong>{money.format(result.total)}</strong><dl>
          <div><dt>Assessable profits (levy base)</dt><dd>{money.format(result.assessableProfits)}</dd></div><div><dt>Total profits (income-tax base)</dt><dd>{money.format(result.totalProfits)}</dd></div>
          <div><dt>Small-company size thresholds</dt><dd>{result.isSmallCompany ? "Within both limits" : "Above a limit"}</dd></div>
          <div><dt>Company income tax ({result.isSmallCompany ? "0" : "30"}%)</dt><dd>{money.format(result.companyIncomeTax)}</dd></div>
          <div><dt>Development levy ({result.isSmallCompany ? "0" : "4"}%)</dt><dd>{money.format(result.developmentLevy)}</dd></div>
        </dl>{result.usesEstimatedBases && <p>Both bases use revenue minus expenses here. Use figures from your tax computation for separate statutory bases.</p>}{amount(values.expenses || "0") > amount(values.revenue) && <p>Expenses exceed revenue. This estimate uses zero profit and does not calculate loss relief.</p>}</> : <h2>{changed ? "Figures changed. Estimate again." : "Enter your figures to begin"}</h2>}
        <p className="planner-caveat">2026 planning estimate. Confirm before filing. For accounting periods ending before 1 January 2026, check the <a href={taxTransitionUrl}>official transition guidance</a>.</p>
        <details className="company-assumptions"><summary>Rules and assumptions</summary><p>Uses the National Assembly&apos;s January 2026 text: annual turnover up to &#8358;100 million and total fixed assets up to &#8358;250 million for small-company treatment; otherwise 30% company income tax and 4% development levy.</p><p>The simplified option uses revenue minus expenses for both taxes. The tax-computation option applies 30% to entered total profits and 4% to entered assessable profits. Capital allowances, losses, credits, incentives and minimum effective tax are not calculated.</p><p>Older official copies show a different small-company definition, including a &#8358;50 million threshold and a professional-services exclusion. Confirm the applicable classification before relying on a zero estimate.</p></details>
        <p className="planner-caveat"><a href={source} target="_blank" rel="noreferrer">Nigeria Tax Act: sections 56, 59 and 201 &#8599;</a></p>
      </aside>
    </div>
  </section>;
}
