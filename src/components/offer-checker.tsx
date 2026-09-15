"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateOffer, defaultOfferAssumptions, formatNaira, grossForTakeHome, MAX_MONTHLY_SALARY } from "@/lib/offer";

function AmountField({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <label className="decision-field" htmlFor={id}>
    <span>{label}</span>
    {hint && <small id={`${id}-hint`}>{hint}</small>}
    <div><span aria-hidden="true">₦</span><input id={id} type="number" inputMode="decimal" min="0" max={MAX_MONTHLY_SALARY} step="0.01" value={value} onChange={e => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} /></div>
  </label>;
}

export function OfferChecker() {
  const [gross, setGross] = useState("650000");
  const [pension, setPension] = useState(true);
  const [base, setBase] = useState("650000");
  const [baseEdited, setBaseEdited] = useState(false);
  const [rent, setRent] = useState("0");
  const [nhf, setNhf] = useState("0");
  const [nhis, setNhis] = useState("0");
  const [other, setOther] = useState("0");
  const [target, setTarget] = useState("600000");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const monthlyGross = Number(gross);
  const fields = [gross, rent, nhf, nhis, other, ...(pension ? [base] : [])];
  const valid = gross !== "" && monthlyGross > 0 && fields.every(value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_MONTHLY_SALARY) && (!pension || (base !== "" && Number(base) <= monthlyGross));
  const assumptions = { ...defaultOfferAssumptions, pensionRate: pension && valid ? Number(base) / monthlyGross * 0.08 : 0, annualRent: Number(rent), monthlyNhf: Number(nhf), monthlyNhis: Number(nhis), monthlyOther: Number(other) };
  const result = valid ? calculateOffer(monthlyGross, assumptions) : null;
  const requiredGross = result && target !== "" ? grossForTakeHome(Number(target), assumptions) : null;

  return <div className="decision-workspace">
    <section className="decision-inputs" aria-labelledby="offer-input-title">
      <h2 id="offer-input-title">What’s in your offer?</h2>
      <p>Try the example, then enter your own figures. Nothing you enter is saved or sent to SalarySabi.</p>
      <div className="decision-fields">
        <AmountField id="offer-gross" label="Monthly gross offer" value={gross} onChange={value => { setGross(value); if (!baseEdited) setBase(value); }} />
        <label className="decision-toggle"><input type="checkbox" checked={pension} onChange={e => setPension(e.target.checked)} /><span>Include employee pension (8% of pensionable pay)</span></label>
        {pension && <AmountField id="offer-base" label="Monthly pensionable pay" hint="Starts at your full gross. Usually basic salary + housing + transport; check the offer letter." value={base} onChange={value => { setBaseEdited(true); setBase(value); }} />}
        <AmountField id="offer-rent" label="Annual rent attributable to 2026" hint="Your share only. Used for rent relief and your after-rent budget." value={rent} onChange={setRent} />
        <details className="decision-details"><summary>Other deductions and offer details</summary><div className="decision-fields">
          <AmountField id="offer-nhf" label="Monthly NHF contribution" value={nhf} onChange={setNhf} />
          <AmountField id="offer-nhis" label="Monthly NHIS contribution" value={nhis} onChange={setNhis} />
          <AmountField id="offer-other" label="Other monthly payroll deductions" hint="For example, loan repayments. These reduce take-home, with no tax relief assumed." value={other} onChange={setOther} />
          <label className="decision-field">Job title (optional)<input value={role} maxLength={100} onChange={e => setRole(e.target.value)} placeholder="Software Engineer" /></label>
          <label className="decision-field">Location (optional)<input value={location} maxLength={100} onChange={e => setLocation(e.target.value)} placeholder="Lagos" /></label>
        </div></details>
      </div>
    </section>
    <section className="decision-results" aria-labelledby="offer-result-title" aria-live="polite" aria-atomic="true">
      <span className="eyebrow">Know what your salary really pays</span>
      <h2 id="offer-result-title">Your offer, in real money.</h2>
      {(role || location) && <p>{[role, location].filter(Boolean).join(" · ")}</p>}
      {!result ? <p role="status">Enter a positive gross salary and non-negative amounts up to ₦1 billion. Pensionable pay must not exceed gross salary.</p> : <>
        <dl className="decision-breakdown">
          <div><dt>Monthly gross</dt><dd>{formatNaira(monthlyGross)}</dd></div>
          <div><dt>Employee pension</dt><dd>− {formatNaira(result.monthlyPension)}</dd></div>
          <div><dt>Estimated PAYE</dt><dd>− {formatNaira(result.tax.monthlyTax)}</dd></div>
          <div><dt>NHF, NHIS & other deductions</dt><dd>− {formatNaira(Number(nhf) + Number(nhis) + Number(other))}</dd></div>
          <div className="decision-total"><dt>Estimated monthly take-home</dt><dd data-testid="offer-take-home">{formatNaira(result.monthlyTakeHome)}</dd></div>
        </dl>
        {result.monthlyTakeHome < 0 && <p role="status">Deductions exceed your available pay. Check the figures in your offer.</p>}
        <dl className="decision-metrics">
          <div><dt>Annual take-home</dt><dd>{formatNaira(result.annualTakeHome)}</dd></div>
          <div><dt>Effective PAYE rate</dt><dd>{(result.tax.effectiveTaxRate * 100).toFixed(1)}%</dd></div>
          <div><dt>Per calendar day</dt><dd>{formatNaira(result.dailyTakeHome)}</dd></div>
          <div><dt>Monthly money after rent</dt><dd data-testid="offer-after-rent">{formatNaira(result.monthlyAfterRent)}</dd></div>
        </dl>
        <p className="decision-note">Daily pay = annual take-home ÷ 365. After-rent money sets aside one twelfth of annual rent; rent is not a payroll deduction.</p>
        <div className="decision-target">
          <h3>What gross salary should I ask for?</h3>
          <AmountField id="offer-target" label="Target monthly take-home" value={target} onChange={setTarget} />
          <p>{requiredGross === null ? "Enter a target between ₦0 and ₦1 billion. Targets requiring gross above ₦1 billion are outside this tool’s range." : <>Estimated gross needed: <strong data-testid="offer-required-gross">{formatNaira(requiredGross)}/month</strong></>}</p>
          <small>Uses the same pensionable share of gross ({(assumptions.pensionRate / 0.08 * 100).toFixed(1)}%), rent and fixed deductions. Rounded up to a whole naira.</small>
        </div>
        <p className="decision-note">Assumes steady pay for 12 months. Bonuses, benefits in kind, mortgage interest, life-insurance relief and payroll adjustments are not included. Title and location label your offer; they do not change this estimate or establish a market salary.</p>
        <div className="decision-result-links"><Link href="/payslip-checker">Check an existing payslip →</Link><Link href="/salaries">Optional: share anonymous salary data →</Link></div>
      </>}
    </section>
  </div>;
}
