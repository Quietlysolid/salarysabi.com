"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, CircleAlert, CircleCheck, ShieldCheck } from "lucide-react";
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

function clampPercent(value: number) {
  return Math.min(98, Math.max(2, value));
}

export function PayslipChecker() {
  const [values, setValues] = useState(initialValues);
  const [checked, setChecked] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [carriedSalary, setCarriedSalary] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const monthlyGross = parseMoney(values.gross);
  const enteredPaye = parseMoney(values.paye);
  const result = useMemo(
    () =>
      checkPayslip({
        monthlyGross,
        monthlyPaye: enteredPaye,
        monthlyPension: parseMoney(values.pension),
        monthlyNhf: parseMoney(values.nhf),
        monthlyNhis: parseMoney(values.nhis),
        otherDeductions: parseMoney(values.other),
      }),
    [enteredPaye, monthlyGross, values.nhf, values.nhis, values.other, values.pension],
  );
  const hasGross = monthlyGross > 0;
  const hasComparison = hasGross && Boolean(values.paye);
  const meterMax = Math.max(
    100_000,
    Math.ceil(Math.max(enteredPaye, result.expectedMonthlyPaye) * 1.2 / 10_000) * 10_000,
  );
  const enteredPosition = clampPercent((enteredPaye / meterMax) * 100);
  const estimatePosition = clampPercent((result.expectedMonthlyPaye / meterMax) * 100);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") !== "calculator") return;
    const context = readPayContext(window.localStorage);
    if (!context || parseMoney(context.values.gross) <= 0) return;
    const restoredGross = context.period === "annual"
      ? Math.round(parseMoney(context.values.gross) / 12)
      : parseMoney(context.values.gross);
    const restoreTimer = window.setTimeout(() => {
      setValues((current) => ({ ...current, gross: formatInput(String(restoredGross)) }));
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
      if (window.matchMedia("(max-width: 900px)").matches) {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      resultRef.current?.focus({ preventScroll: true });
    });
  }

  const comparisonTitle =
    result.comparison === "close"
      ? "Your PAYE is close to our estimate."
      : `Your PAYE is ${money.format(Math.abs(result.difference))} ${result.comparison === "higher" ? "higher" : "lower"} than our estimate.`;
  const comparisonGuidance =
    result.comparison === "close"
      ? "The difference is within the comparison tolerance."
      : "Check the monthly figure on your payslip, then ask payroll to explain the difference.";

  return (
    <div className="payslip-live-workspace">
      <div className="payslip-live-entry">
        <section className="payslip-live-hero">
          <span className="eyebrow">Pay &amp; tax</span>
          <h1>Check payslip PAYE</h1>
          <p>Enter the gross pay and PAYE shown on one monthly payslip. SalarySabi will compare them with an independent estimate.</p>
          <div className="payslip-trust-row" aria-label="Privacy and calculation freshness">
            <ShieldCheck aria-hidden="true" />
            <span><strong>Private in your browser</strong> · Official 2026 rules reviewed {rulesVerifiedDate}</span>
          </div>
        </section>

        <form className="payslip-live-form" onSubmit={submit}>
          {carriedSalary && (
            <div className="payslip-carried-context" role="status">
              <span>Carried from your PAYE estimate</span>
              <strong>{money.format(monthlyGross)} monthly gross pay</strong>
              <button type="button" onClick={() => { setValues((current) => ({ ...current, gross: "" })); setCarriedSalary(false); }}>
                Clear
              </button>
            </div>
          )}
          <div className="payslip-fields payslip-required-fields">
            <MoneyField label="Monthly gross pay" help="On your payslip: Gross pay or Total earnings." field="gross" value={values.gross} update={update} placeholder="500,000" required />
            <MoneyField label="Monthly PAYE" help="On your payslip: PAYE or Income tax." field="paye" value={values.paye} update={update} placeholder="45,000" required />
          </div>
          <button className="primary-button payslip-live-submit" type="submit">Check my pay <ArrowRight aria-hidden="true" /></button>
          <button className="payslip-optional-toggle" type="button" aria-expanded={showOptional} onClick={() => setShowOptional((current) => !current)}>
            <span><strong>Optional deductions</strong><small>Add pension, NHF, health insurance or other deductions.</small></span>
            <ChevronDown aria-hidden="true" />
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
      </div>

      <section className={`payslip-live-result${hasGross ? " has-values" : ""}`} ref={resultRef} tabIndex={-1}>
        <span className="eyebrow">Result</span>
        <h2>From offer letter<br />to bank alert</h2>
        <div
          className="payslip-live-equation"
          aria-label={hasGross ? `${money.format(monthlyGross)} gross salary minus ${money.format(result.expectedMonthlyPaye)} PAYE equals ${money.format(result.expectedTakeHome)} estimated take-home pay` : "Enter your monthly gross salary to see the calculation"}
        >
          <div><span>Gross salary</span><strong>{hasGross ? money.format(monthlyGross) : "—"}</strong></div>
          <b aria-hidden="true">−</b>
          <div><span>PAYE</span><strong>{hasGross ? money.format(result.expectedMonthlyPaye) : "—"}</strong></div>
          <b aria-hidden="true">=</b>
          <div className="is-take-home"><span>Take-home pay</span><strong>{hasGross ? money.format(result.expectedTakeHome) : "—"}</strong></div>
        </div>

        <div className={`payslip-comparison-meter${hasComparison ? " has-values" : ""}`} role="img" aria-label={hasComparison ? `Your payslip PAYE is ${money.format(enteredPaye)} and the SalarySabi estimate is ${money.format(result.expectedMonthlyPaye)}` : "Enter the PAYE from your payslip to compare it with the SalarySabi estimate"}>
          <div className="payslip-meter-labels">
            <div style={{ left: `${enteredPosition}%` }}><span>Your payslip PAYE</span><strong>{hasComparison ? money.format(enteredPaye) : "—"}</strong></div>
            <div style={{ left: `${estimatePosition}%` }}><span>SalarySabi estimate</span><strong>{hasGross ? money.format(result.expectedMonthlyPaye) : "—"}</strong></div>
          </div>
          <div className="payslip-meter-track">
            {hasComparison && <span className="payslip-meter-fill" style={{ width: `${Math.max(enteredPosition, estimatePosition)}%` }} />}
            {hasComparison && <i className="payslip-meter-marker is-entered" style={{ left: `${enteredPosition}%` }} />}
            {hasGross && <i className="payslip-meter-marker is-estimate" style={{ left: `${estimatePosition}%` }} />}
          </div>
          <div className="payslip-meter-scale"><span>₦0</span><span>{money.format(meterMax)}</span></div>
        </div>

        <div className={`payslip-live-status${checked ? ` is-${result.comparison}` : ""}`} aria-live="polite">
          {checked ? (result.comparison === "close" ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />) : <ShieldCheck aria-hidden="true" />}
          <div>
            <strong>{checked ? comparisonTitle : "Your comparison will appear here."}</strong>
            <span>{checked ? comparisonGuidance : "Enter both figures, then check your pay."}</span>
          </div>
        </div>
        <Link className="payslip-live-learn" href="/how-paye-is-calculated">See how PAYE works <ArrowRight aria-hidden="true" /></Link>
      </section>
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
      <div><span aria-hidden="true">₦</span><input inputMode="numeric" value={value} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} required={required} /></div>
    </label>
  );
}
