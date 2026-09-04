"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { calculatePaye } from "@/lib/paye";
import { rulesetVersion, taxProfessionalReviewDate, taxProfessionalReviewIso } from "@/lib/site";
import { track } from "@/components/analytics";

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
  const [pensionablePay, setPensionablePay] = useState("500,000");
  const [includePension, setIncludePension] = useState(true);
  const [pensionBaseEdited, setPensionBaseEdited] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const inputStarted = useRef(false);
  const calculationRecorded = useRef(false);
  const payslipTransitionRecorded = useRef(false);
  const monthlyGross = parseMoney(gross);
  const monthlyPensionablePay = parseMoney(pensionablePay);
  const employeePension = includePension ? monthlyPensionablePay * 0.08 : 0;
  const employerPension = includePension ? monthlyPensionablePay * 0.1 : 0;
  const result = useMemo(
    () => calculatePaye({
      annualGrossIncome: monthlyGross * 12,
      pensionContribution: employeePension * 12,
    }),
    [employeePension, monthlyGross],
  );
  const takeHome = Math.max(0, monthlyGross - employeePension - result.monthlyTax);

  useEffect(() => {
    if (!hasEdited || monthlyGross <= 0 || calculationRecorded.current) return;
    const timer = window.setTimeout(() => {
      track("paye_calculated");
      calculationRecorded.current = true;
    }, 800);
    return () => window.clearTimeout(timer);
  }, [employeePension, hasEdited, monthlyGross]);

  function startInput() {
    if (!inputStarted.current) {
      track("paye_input_started");
      inputStarted.current = true;
    }
    setHasEdited(true);
  }

  function updateGross(value: string) {
    startInput();
    const formatted = formatInput(value);
    setGross(formatted);
    if (!pensionBaseEdited) setPensionablePay(formatted);
  }

  function updatePensionablePay(value: string) {
    startInput();
    setPensionBaseEdited(true);
    setPensionablePay(formatInput(value));
  }

  function updatePensionChoice(checked: boolean) {
    startInput();
    setIncludePension(checked);
  }

  function trackPayslipTransition() {
    if (payslipTransitionRecorded.current) return;
    track("paye_to_payslip_clicked");
    payslipTransitionRecorded.current = true;
  }

  return (
    <section className="paye-guide-live" aria-labelledby="paye-guide-live-title">
      <div className="paye-guide-live-input">
        <span className="eyebrow">Your PAYE, made clear</span>
        <h1 id="paye-guide-live-title">See where your salary goes.</h1>
        <label htmlFor="paye-guide-gross">
          <span>Monthly gross salary</span>
          <span className="paye-guide-money-input">
            <span aria-hidden="true">₦</span>
            <input
              id="paye-guide-gross"
              inputMode="numeric"
              value={gross}
              onChange={(event) => updateGross(event.target.value)}
            />
          </span>
        </label>
        <label className="paye-guide-pension-toggle">
          <input type="checkbox" checked={includePension} onChange={(event) => updatePensionChoice(event.target.checked)} />
          <span><strong>Include statutory employee pension</strong><small>On by default. Turn this off only if you are exempt or your employer pays your employee share.</small></span>
        </label>
        {includePension && <label htmlFor="paye-guide-pensionable-pay">
          <span>Monthly pensionable pay</span>
          <small>Usually basic salary + housing + transport. Check your contract or payslip.</small>
          <span className="paye-guide-money-input">
            <span aria-hidden="true">₦</span>
            <input
              id="paye-guide-pensionable-pay"
              inputMode="numeric"
              value={pensionablePay}
              onChange={(event) => updatePensionablePay(event.target.value)}
            />
          </span>
        </label>}
        <p className="paye-guide-private"><ShieldCheck aria-hidden="true" />Private in your browser. Nothing you enter is saved.</p>
      </div>

      <div className="paye-guide-live-result" aria-live="polite">
        <span className="eyebrow">From offer letter to bank alert</span>
        <dl className="paye-guide-equation" aria-label={`${money.format(monthlyGross)} gross salary minus ${money.format(employeePension)} employee pension minus ${money.format(result.monthlyTax)} PAYE equals ${money.format(takeHome)} take-home pay`}>
          <div className="is-gross">
            <span className="paye-guide-equation-operator" aria-hidden="true" />
            <dt>Gross salary</dt>
            <dd>{money.format(monthlyGross)}</dd>
          </div>
          <div>
            <span className="paye-guide-equation-operator" aria-hidden="true">&minus;</span>
            <dt>Employee pension</dt>
            <dd>{money.format(employeePension)}</dd>
          </div>
          <div>
            <span className="paye-guide-equation-operator" aria-hidden="true">&minus;</span>
            <dt>PAYE</dt>
            <dd>{money.format(result.monthlyTax)}</dd>
          </div>
          <div className="is-take-home">
            <span className="paye-guide-equation-operator" aria-hidden="true">=</span>
            <dt>Take-home pay</dt>
            <dd>{money.format(takeHome)}</dd>
          </div>
        </dl>
        {includePension ? <p className="paye-guide-pension-note"><strong>Your pension contribution:</strong> 8% of the pensionable pay entered. Your employer&apos;s minimum contribution would be {money.format(employerPension)} (10%), paid into your RSA rather than deducted from take-home pay.</p> : <p className="paye-guide-pension-note"><strong>Pension excluded:</strong> This estimate assumes no employee pension deduction.</p>}
        <p className="paye-guide-trust-line">
          <strong>Independently reviewed</strong>
          <span aria-hidden="true">·</span>
          <time dateTime={taxProfessionalReviewIso}>{taxProfessionalReviewDate}</time>
          <span aria-hidden="true">·</span>
          <span>Ruleset {rulesetVersion}</span>
        </p>
        <Link href="/payslip-checker" onClick={trackPayslipTransition}>Check this against my payslip <ArrowRight aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
