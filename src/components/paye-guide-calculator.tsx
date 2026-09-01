"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { calculatePaye } from "@/lib/paye";
import { rulesetVersion, taxProfessionalReviewDate, taxProfessionalReviewIso } from "@/lib/site";

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-NG") : "";
}

function parseMoney(value: string) {
  const number = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function PayeGuideCalculator() {
  const [gross, setGross] = useState("500,000");
  const monthlyGross = parseMoney(gross);
  const result = useMemo(
    () => calculatePaye({ annualGrossIncome: monthlyGross * 12 }),
    [monthlyGross],
  );
  const takeHome = Math.max(0, monthlyGross - result.monthlyTax);

  return (
    <section className="paye-guide-live" aria-labelledby="paye-guide-live-title">
      <div className="paye-guide-live-input">
        <span className="eyebrow">Your PAYE, made clear</span>
        <h1 id="paye-guide-live-title">See where your salary goes.</h1>
        <p>Enter your monthly salary. See PAYE and take-home pay instantly.</p>
        <label htmlFor="paye-guide-gross">
          <span>Monthly gross salary</span>
          <span className="paye-guide-money-input">
            <span aria-hidden="true">₦</span>
            <input
              id="paye-guide-gross"
              inputMode="numeric"
              value={gross}
              onChange={(event) => setGross(formatInput(event.target.value))}
            />
          </span>
        </label>
        <p className="paye-guide-private"><ShieldCheck aria-hidden="true" />Private in your browser. Nothing you enter is saved.</p>
      </div>

      <div className="paye-guide-live-result" aria-live="polite">
        <span className="eyebrow">From offer letter to bank alert</span>
        <div className="paye-guide-equation" aria-label={`${money.format(monthlyGross)} gross salary minus ${money.format(result.monthlyTax)} PAYE equals ${money.format(takeHome)} take-home pay`}>
          <div><span>Gross salary</span><strong>{money.format(monthlyGross)}</strong></div>
          <b aria-hidden="true">−</b>
          <div><span>PAYE</span><strong>{money.format(result.monthlyTax)}</strong></div>
          <b aria-hidden="true">=</b>
          <div className="is-take-home"><span>Take-home pay</span><strong>{money.format(takeHome)}</strong></div>
        </div>
        <p>PAYE is estimated using the active 2026 rules before optional deductions and reliefs.</p>
        <p className="paye-guide-trust-line">
          <strong>Independently reviewed</strong>
          <span aria-hidden="true">·</span>
          <time dateTime={taxProfessionalReviewIso}>{taxProfessionalReviewDate}</time>
          <span aria-hidden="true">·</span>
          <span>Ruleset {rulesetVersion}</span>
        </p>
        <Link href="/payslip-checker">Check this against my payslip <ArrowRight aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
