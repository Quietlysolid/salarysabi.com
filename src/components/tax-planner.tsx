"use client";

import { useMemo, useState } from "react";
import { calculateCompanyTax, calculateForeignIncome, calculateIndependentIncome, calculateInvestmentWithholding } from "@/lib/tax-planners";

type Mode = "freelancer" | "creator" | "foreign" | "company" | "investment";
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const cash = (value: unknown) => money.format(typeof value === "number" ? value : 0);
const number = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;
const formatted = (value: string) => value.replace(/[^\d]/g, "") ? Number(value.replace(/[^\d]/g, "")).toLocaleString("en-NG") : "";

const copy: Record<Mode, { title: string; intro: string }> = {
  freelancer: { title: "Freelance or creator tax", intro: "Estimate tax on your annual profit." },
  creator: { title: "Creator income tax planner", intro: "Plan tax on content, sponsorship, platform and production income after supportable expenses." },
  foreign: { title: "Foreign-currency income planner", intro: "Convert foreign earnings to naira, deduct supportable business expenses and estimate personal income tax." },
  company: { title: "Company tax planner", intro: "Check the small-company thresholds and estimate company income tax and development levy on profit." },
  investment: { title: "Investment withholding planner", intro: "Estimate tax withheld from dividends, interest or royalties. Your final liability can differ." },
};

export function TaxPlanner({ mode }: { mode: Mode }) {
  const [values, setValues] = useState({ revenue: "", expenses: "", assets: "", rate: "10", exchange: "", deductions: "" });
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: formatted(value) }));
  const result = useMemo(() => {
    if (mode === "company") return calculateCompanyTax(number(values.revenue), number(values.assets), number(values.expenses));
    if (mode === "foreign") return calculateForeignIncome(number(values.revenue), number(values.exchange), number(values.expenses));
    if (mode === "investment") return calculateInvestmentWithholding(number(values.revenue), number(values.rate));
    return calculateIndependentIncome(number(values.revenue), number(values.expenses), number(values.deductions));
  }, [mode, values]);
  const active = number(values.revenue) > 0;
  const independent = mode === "freelancer" || mode === "creator";

  return <section className="tax-planner" aria-labelledby="planner-title">
    <header>{mode !== "company" && !independent && <span className="eyebrow">2026 planning estimate</span>}<h1 id="planner-title">{copy[mode].title}</h1></header>
    <div className="tax-planner-grid">
      <form className="tax-planner-form" onSubmit={(event) => event.preventDefault()}>
        <label>{mode === "foreign" ? "Annual amount in foreign currency" : mode === "investment" ? "Annual investment income" : mode === "company" ? "Annual revenue" : "Annual business income"}<span className="small-currency-input"><b>{mode === "foreign" ? "$" : "₦"}</b><input inputMode="numeric" value={values.revenue} onChange={(event) => set("revenue", event.target.value)} placeholder={mode === "company" ? "Example: 12,000,000" : mode === "foreign" ? "10,000" : "Example: 12,000,000"} /></span></label>
        {mode === "foreign" && <label>Naira exchange rate per unit<span className="small-currency-input"><b>₦</b><input inputMode="numeric" value={values.exchange} onChange={(event) => set("exchange", event.target.value)} placeholder="1,500" /></span><small>Use a supportable rate for the relevant transaction or reporting date.</small></label>}
        {mode !== "investment" && <label>{mode === "company" || independent ? "Business expenses" : "Annual supportable expenses"}<span className="small-currency-input"><b>₦</b><input inputMode="numeric" value={values.expenses} onChange={(event) => set("expenses", event.target.value)} placeholder={mode === "company" || independent ? "Example: 2,000,000" : "2,000,000"} /></span><small>{mode === "company" || independent ? "Business expenses only. Keep your records." : "Do not enter personal spending. Keep invoices and records."}</small></label>}
        {independent && <label>Other tax deductions (optional)<span className="small-currency-input"><b>₦</b><input inputMode="numeric" value={values.deductions} onChange={(event) => set("deductions", event.target.value)} placeholder="Example: 100,000" /></span></label>}
        {mode === "company" && <label>Qualifying fixed assets<span className="small-currency-input"><b>₦</b><input inputMode="numeric" value={values.assets} onChange={(event) => set("assets", event.target.value)} placeholder="Example: 100,000,000" /></span><small>Use the value from your company’s tax records.</small></label>}
        {mode === "investment" && <label>Withholding rate (%)<span className="small-currency-input"><input inputMode="decimal" value={values.rate} onChange={(event) => set("rate", event.target.value)} /></span><small>10% is a common planning default, not a conclusion about your transaction.</small></label>}
      </form>
      <aside className="tax-planner-result" aria-live="polite">
        {!active ? <><span className="eyebrow">Your estimate</span><h2>{mode === "company" ? "Enter annual revenue to begin" : independent ? "Enter annual income to begin" : "Enter an amount to begin"}</h2>{mode !== "company" && !independent && <p>The calculation stays on your device.</p>}</> : mode === "company" && "companyIncomeTax" in result ? <><span className="eyebrow">Estimated company taxes</span><strong>{cash(result.total)}</strong><dl><div><dt>Estimated profit</dt><dd>{cash(result.profit)}</dd></div><div><dt>Small-company treatment</dt><dd>{result.isSmallCompany ? "Likely eligible" : "Not indicated"}</dd></div><div><dt>Company income tax</dt><dd>{cash(result.companyIncomeTax)}</dd></div><div><dt>Development levy</dt><dd>{cash(result.developmentLevy)}</dd></div></dl></> : mode === "investment" && "withholding" in result ? <><span className="eyebrow">Estimated amount withheld</span><strong>{cash(result.withholding)}</strong><dl><div><dt>Income after withholding</dt><dd>{cash(result.net)}</dd></div><div><dt>Rate used</dt><dd>{Math.round(Number(result.rate) * 100)}%</dd></div></dl></> : "annualTax" in result ? <><span className="eyebrow">Estimated annual personal tax</span><strong>{cash(result.annualTax)}</strong><dl>{"nairaRevenue" in result && <div><dt>Naira income</dt><dd>{cash(result.nairaRevenue)}</dd></div>}<div><dt>Net business income</dt><dd>{cash(result.netBusinessIncome)}</dd></div><div><dt>Monthly tax reserve</dt><dd>{cash(result.monthlyReserve)}</dd></div><div><dt>Income after estimated tax</dt><dd>{cash(result.afterTax)}</dd></div></dl></> : null}
        <p className="planner-caveat">{mode === "company" || independent ? <><strong>Estimate only.</strong> Confirm before filing.</> : <><strong>Planning estimate only.</strong> Classification, residency, source, allowable expenses, withholding credits and filing circumstances can change the result. Confirm a return with the relevant authority or a qualified Nigerian tax professional.</>}</p>
        <p className="planner-caveat"><a href="https://www.jrb.gov.ng/policies-reforms" rel="noreferrer" target="_blank">{mode === "company" || independent ? "Official guidance ↗" : "Check the official Nigeria Tax Act and JRB guidance ↗"}</a></p>
      </aside>
    </div>
  </section>;
}
