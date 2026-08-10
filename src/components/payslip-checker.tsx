"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
      ? "The PAYE on your payslip is close to our estimate."
      : result.comparison === "higher"
        ? "Your payslip shows more PAYE than our estimate."
        : "Your payslip shows less PAYE than our estimate.";

  return (
    <div className="payslip-checker">
      <section className="payslip-hero">
        <span className="eyebrow">Payslip checker</span>
        <h1>Understand every figure on your payslip.</h1>
        <p>Enter two figures. We will compare the PAYE with our estimate.</p>
      </section>
      <form onSubmit={submit}>
        <div className="payslip-form-heading">
          <span className="eyebrow">Monthly payslip</span>
          <h2>Bring these two numbers</h2>
          <p>You can add deductions afterward for a closer take-home estimate.</p>
        </div>
        {carriedSalary && (
          <div className="payslip-carried-context" role="status">
            <span>Carried from your PAYE estimate</span>
            <strong>{money.format(parseMoney(values.gross))} monthly gross pay</strong>
            <button type="button" onClick={() => { setValues((current) => ({ ...current, gross: "" })); setCarriedSalary(false); }}>
              Clear
            </button>
          </div>
        )}
        <div className="payslip-fields payslip-required-fields">
          <MoneyField label="Gross pay this month" help="Look for Gross salary, Gross pay or Total earnings." field="gross" value={values.gross} update={update} placeholder="Example: 500,000" required />
          <MoneyField label="PAYE deducted this month" help="Look for PAYE, Income tax or Tax deducted." field="paye" value={values.paye} update={update} placeholder="Example: 45,000" required />
        </div>
        <button className="primary-button" type="submit">Check my PAYE</button>
        <button className="payslip-optional-toggle" type="button" aria-expanded={showOptional} onClick={() => setShowOptional((current) => !current)}>
          <span><strong>Add deductions for a closer take-home estimate</strong><small>Optional</small></span>
          <span>{showOptional ? "Hide" : "Add"}</span>
        </button>
        {showOptional && (
          <div className="payslip-fields payslip-optional-fields">
            <MoneyField label="Pension" help="Use the employee pension deduction for this month." field="pension" value={values.pension} update={update} placeholder="Example: 25,000" />
            <MoneyField label="NHF" help="Use the National Housing Fund deduction shown." field="nhf" value={values.nhf} update={update} placeholder="Example: 10,000" />
            <MoneyField label="NHIS or NHIA" help="Use the health insurance deduction shown." field="nhis" value={values.nhis} update={update} placeholder="Example: 5,000" />
            <MoneyField label="Other deductions" help="Loans and voluntary deductions affect take-home pay, not PAYE." field="other" value={values.other} update={update} placeholder="Example: 12,000" />
          </div>
        )}
        <div className="payslip-trust-row">
          <span><strong>Private</strong>Your figures stay in this browser.</span>
          <span><strong>Current rules</strong>Verified {rulesVerifiedDate}.</span>
        </div>
      </form>
      <section
        className={checked ? "payslip-result ready" : "payslip-result"}
        aria-live="polite"
        ref={resultRef}
        tabIndex={-1}
      >
        {checked ? (
          <>
            <span className="eyebrow light">Your check</span>
            <h2>{comparisonText}</h2>
            <dl>
              <div><dt>PAYE on your payslip</dt><dd>{money.format(parseMoney(values.paye))}</dd></div>
              <div><dt>SalarySabi estimate</dt><dd>{money.format(result.expectedMonthlyPaye)}</dd></div>
              <div><dt>Difference</dt><dd>{money.format(Math.abs(result.difference))}</dd></div>
              <div><dt>Pay after entered deductions</dt><dd>{money.format(result.estimatedTakeHome)}</dd></div>
            </dl>
            <p>This is a check, not proof that payroll is wrong. Rent relief, benefits, arrears or other items may change the result. Ask payroll to explain any difference.</p>
          </>
        ) : (
          <>
            <span className="eyebrow light">Your comparison</span>
            <h2>See whether your payslip PAYE is close to our estimate.</h2>
            <dl className="payslip-preview-list">
              <div><dt>Payslip PAYE</dt><dd>Not entered</dd></div>
              <div><dt>SalarySabi estimate</dt><dd>Not calculated</dd></div>
              <div><dt>Difference</dt><dd>Not calculated</dd></div>
            </dl>
            <p className="payslip-caution"><strong>A difference does not automatically mean payroll is wrong.</strong> Benefits, reliefs, arrears or other items may change the result.</p>
            <nav className="payslip-next-links" aria-label="Payslip checker help">
              <Link href="/how-paye-is-calculated">How PAYE is calculated</Link>
              <Link href="/eligible-deductions">Deductions that can reduce PAYE</Link>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}

function MoneyField({ label, help, field, value, update, placeholder, required = false }: {
  label: string;
  help: string;
  field: Field;
  value: string;
  update: (field: Field, value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}{required ? " (required)" : ""}</span>
      <small>{help}</small>
      <div><span>₦</span><input inputMode="numeric" value={value} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} required={required} /></div>
    </label>
  );
}
