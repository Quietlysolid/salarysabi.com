"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { calculatePaye } from "@/lib/paye";

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
        <span className="eyebrow">Try the calculation</span>
        <h2 id="paye-guide-live-title">See where your salary goes.</h2>
        <p>Move the salary or type your monthly gross pay. The PAYE estimate updates immediately.</p>
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
        <input
          aria-label="Monthly gross salary slider"
          className="paye-guide-range"
          max="5000000"
          min="70000"
          onChange={(event) => setGross(formatInput(event.target.value))}
          step="10000"
          type="range"
          value={Math.min(5_000_000, Math.max(70_000, monthlyGross || 70_000))}
        />
        <div className="paye-guide-range-labels" aria-hidden="true"><span>₦70,000</span><span>₦5,000,000</span></div>
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
        <Link href="/payslip-checker">Check this against my payslip <ArrowRight aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
