"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { JourneyNextSteps } from "@/components/journey-next-steps";
import { checkPayslip } from "@/lib/payslip";
import { readPayContext } from "@/lib/pay-context";
import { rulesVerifiedDate } from "@/lib/site";
import { track } from "./analytics";

type Field = "gross" | "paye" | "pension" | "nhf" | "nhis" | "other";
type Values = Record<Field, string>;

const initialValues: Values = {
  gross: "",
  paye: "",
  pension: "",
  nhf: "",
  nhis: "",
  other: "",
};

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function parseMoney(value: string) {
  const number = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function formatInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-NG") : "";
}

export function PayslipChecker() {
  const [values, setValues] = useState(initialValues);
  const [checked, setChecked] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [carriedSalary, setCarriedSalary] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const result = useMemo(
    () =>
      checkPayslip({
        monthlyGross: parseMoney(values.gross),
        monthlyPaye: parseMoney(values.paye),
        monthlyPension: parseMoney(values.pension),
        monthlyNhf: parseMoney(values.nhf),
        monthlyNhis: parseMoney(values.nhis),
        otherDeductions: parseMoney(values.other),
      }),
    [values],
  );

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") !== "calculator") return;
    const context = readPayContext(window.localStorage);
    if (!context || parseMoney(context.values.gross) <= 0) return;
    const monthlyGross = context.period === "annual"
      ? Math.round(parseMoney(context.values.gross) / 12)
      : parseMoney(context.values.gross);
    const restoreTimer = window.setTimeout(() => {
      setValues((current) => ({ ...current, gross: formatInput(String(monthlyGross)) }));
      setCarriedSalary(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: formatInput(value) }));
    setChecked(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    track("payslip_checked");
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      resultRef.current?.focus({ preventScroll: true });
    });
  }

  const comparisonText =
    result.comparison === "close"
      ? "Your PAYE looks correct"
      : result.comparison === "higher"
        ? "Your PAYE may be too high"
        : "Your PAYE may be too low";
  const differenceDirection = result.comparison === "higher" ? "higher" : "lower";

  return (
    <div className="payslip-checker">
      <section className="payslip-hero">
        <span className="eyebrow">Pay &amp; tax</span>
        <h1>Check payslip PAYE</h1>
        <p>Enter the gross pay and PAYE shown on one monthly payslip. SalarySabi will compare them with an independent estimate.</p>
        <div className="payslip-trust-row" aria-label="Privacy and calculation freshness">
          <ShieldCheck aria-hidden="true" />
          <span><strong>Private in your browser</strong> · Official 2026 rules reviewed {rulesVerifiedDate}</span>
        </div>
      </section>
      <form onSubmit={submit}>
        {carriedSalary && (
          <div className="payslip-carried-context" role="status">
            <span>Carried from your PAYE estimate</span>
            <strong>{money.format(parseMoney(values.gross))} monthly gross pay</strong>
            <button type="button" onClick={() => { setValues((current) => ({ ...current, gross: "" })); setCarriedSalary(false); }}>
              Clear
            </button>
          </div>
        )}
        <header className="payslip-form-heading"><h2>Enter two numbers from your payslip</h2><p>Use monthly amounts. You can add other deductions after the first check.</p></header>
        <div className="payslip-fields payslip-required-fields">
          <MoneyField label="Monthly gross pay" help="On your payslip: Gross pay or Total earnings." field="gross" value={values.gross} update={update} placeholder="500,000" required />
          <MoneyField label="Monthly PAYE" help="On your payslip: PAYE or Income tax." field="paye" value={values.paye} update={update} placeholder="45,000" required />
        </div>
        <button className="primary-button" type="submit">{checked ? "Check again" : "Check PAYE"}</button>
        <button className="payslip-optional-toggle" type="button" aria-expanded={showOptional} onClick={() => setShowOptional((current) => !current)}>
          <strong>Optional deductions</strong>
          <span>{showOptional ? "Hide" : "Add"}</span>
        </button>
        {showOptional && (
          <div className="payslip-fields payslip-optional-fields">
            <MoneyField label="Pension" field="pension" value={values.pension} update={update} placeholder="25,000" />
            <MoneyField label="NHF" field="nhf" value={values.nhf} update={update} placeholder="10,000" />
            <MoneyField label="Health insurance" field="nhis" value={values.nhis} update={update} placeholder="5,000" />
            <MoneyField label="Other deductions" field="other" value={values.other} update={update} placeholder="12,000" />
          </div>
        )}
      </form>
      {checked && <section
        className={checked ? "payslip-result ready" : "payslip-result"}
        aria-live="polite"
        ref={resultRef}
        tabIndex={-1}
      >
        <h2>{comparisonText}</h2>
        <dl>
          <div><dt>Your payslip</dt><dd>{money.format(parseMoney(values.paye))}</dd></div>
          <div><dt>Our estimate</dt><dd>{money.format(result.expectedMonthlyPaye)}</dd></div>
          <div><dt>{result.comparison === "close" ? "Difference" : `${differenceDirection[0].toUpperCase()}${differenceDirection.slice(1)} than estimate`}</dt><dd>{money.format(Math.abs(result.difference))}</dd></div>
          <div><dt>Pay after entered amounts</dt><dd>{money.format(result.estimatedTakeHome)}</dd></div>
        </dl>
        {result.comparison !== "close" && <p>Check that {money.format(parseMoney(values.paye))} is the monthly PAYE on your payslip. If it is, ask payroll why it is {money.format(Math.abs(result.difference))} {differenceDirection} than our estimate.</p>}
        <Link href="/how-paye-is-calculated">See how PAYE is calculated</Link>
        <JourneyNextSteps
          title="Use the comparison"
          description="Choose the next action that matches what you found."
          steps={[
            { href: "/#calculator", title: "Recalculate take-home pay", description: "Adjust salary or eligible deductions." },
            { href: "/salaries", title: "Compare my salary", description: "See reviewed ranges as public groups become available." },
            { href: "/jobs", title: "Find jobs with published pay", description: "See the offered salary before applying." },
          ]}
        />
      </section>}
    </div>
  );
}

function MoneyField({ label, help, field, value, update, placeholder, required = false }: {
  label: string;
  help?: string;
  field: Field;
  value: string;
  update: (field: Field, value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      {help && <small>{help}</small>}
      <div><span>₦</span><input inputMode="numeric" value={value} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} required={required} /></div>
    </label>
  );
}
