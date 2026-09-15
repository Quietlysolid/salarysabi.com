"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, CircleAlert, CircleCheck, Copy, ShieldCheck } from "lucide-react";
import { checkPayslip } from "@/lib/payslip";
import { readPayContext } from "@/lib/pay-context";
import { track } from "./analytics";

type Field = "gross" | "paye" | "pension" | "nhf" | "nhis" | "rent" | "other";
type Values = Record<Field, string>;

const initialValues: Values = {
  gross: "",
  paye: "",
  pension: "",
  nhf: "",
  nhis: "",
  rent: "",
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

function questionsForPayroll(comparison: "close" | "higher" | "lower") {
  const differenceQuestion = comparison === "higher"
    ? "Was a bonus, arrears payment, taxable benefit or prior-period adjustment included in my PAYE?"
    : comparison === "lower"
      ? "Was an exemption, tax credit or cumulative adjustment applied to my PAYE?"
      : "Were any bonuses, arrears or prior-period adjustments included in this calculation?";

  return [
    "What taxable pay did you use to calculate my PAYE for this month?",
    "Which eligible deductions and reliefs were applied?",
    differenceQuestion,
    "Can you share the PAYE calculation or payroll breakdown used for this payslip?",
  ];
}

export function PayslipChecker() {
  const [values, setValues] = useState(initialValues);
  const [checked, setChecked] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [carriedSalary, setCarriedSalary] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const [deductionInterest, setDeductionInterest] = useState<"yes" | "no" | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const checkStarted = useRef(false);
  const checkCompleted = useRef(false);
  const deductionInterestRecorded = useRef(false);
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
        annualRentPaid: parseMoney(values.rent),
        otherDeductions: parseMoney(values.other),
      }),
    [enteredPaye, monthlyGross, values.nhf, values.nhis, values.other, values.pension, values.rent],
  );
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

  useEffect(() => {
    if (!checked) return;
    const focusTimer = window.setTimeout(() => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      resultRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [checked]);

  function update(field: Field, value: string) {
    if (!checkStarted.current) {
      track("payslip_check_started");
      checkStarted.current = true;
    }
    setValues((current) => ({ ...current, [field]: formatInput(value) }));
    setChecked(false);
    setQuestionsCopied(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!checkCompleted.current) {
      track("payslip_checked");
      checkCompleted.current = true;
    }
  }

  const comparisonTitle =
    result.comparison === "close"
      ? "Your PAYE looks right."
      : `Your PAYE is ${money.format(Math.abs(result.difference))} ${result.comparison === "higher" ? "higher" : "lower"}.`;
  const comparisonGuidance =
    result.comparison === "close"
      ? "Your payslip PAYE is within SalarySabi’s comparison tolerance. Keep the payroll breakdown with your records."
      : "Check the monthly figures you entered, then ask payroll to explain the difference before treating it as an error.";
  const verdict = {
    looks_consistent: {
      label: "Looks consistent",
      detail: "No material PAYE difference found.",
    },
    review_recommended: {
      label: "Review recommended",
      detail: "There is a difference worth confirming with payroll.",
    },
    likely_discrepancy: {
      label: "Likely discrepancy",
      detail: "There is a large difference worth investigating.",
    },
  }[result.verdict];
  const payrollQuestions = questionsForPayroll(result.comparison);
  const deductions = [
    {
      label: "PAYE",
      amount: enteredPaye,
      suffix: "",
      explanation: "Income tax withheld on this payslip. SalarySabi compares this with the 2026 PAYE estimate.",
      show: true,
    },
    {
      label: "Pension",
      amount: parseMoney(values.pension),
      suffix: "",
      explanation: "Entered as an eligible pension contribution, reducing chargeable income and take-home pay.",
      show: parseMoney(values.pension) > 0,
    },
    {
      label: "NHF",
      amount: parseMoney(values.nhf),
      suffix: "",
      explanation: "Entered as an eligible National Housing Fund contribution, reducing chargeable income and take-home pay.",
      show: parseMoney(values.nhf) > 0,
    },
    {
      label: "NHIS contribution",
      amount: parseMoney(values.nhis),
      suffix: "",
      explanation: "Entered as an eligible health-insurance contribution, reducing chargeable income and take-home pay.",
      show: parseMoney(values.nhis) > 0,
    },
    {
      label: "Calculated rent relief",
      amount: result.annualRentRelief,
      suffix: " / year",
      explanation: "Twenty percent of annual rent entered, capped at ₦500,000. This reduces chargeable income; it is not money deducted from this payslip.",
      show: result.annualRentRelief > 0,
    },
    {
      label: "Other deductions",
      amount: parseMoney(values.other),
      suffix: "",
      explanation: "Included in take-home pay, but not treated as an eligible PAYE deduction.",
      show: parseMoney(values.other) > 0,
    },
  ].filter((item) => item.show);

  async function copyPayrollQuestions() {
    try {
      await navigator.clipboard.writeText([
        "Hello, please help me understand the PAYE on my latest payslip:",
        ...payrollQuestions.map((question, index) => `${index + 1}. ${question}`),
        "Thank you.",
      ].join("\n"));
      setQuestionsCopied(true);
    } catch {
      setQuestionsCopied(false);
    }
  }

  function recordDeductionInterest(response: "yes" | "no") {
    if (deductionInterestRecorded.current) return;
    setDeductionInterest(response);
    track(response === "yes" ? "deduction_tracker_interest_yes" : "deduction_tracker_interest_no");
    deductionInterestRecorded.current = true;
  }

  return (
    <div className={`payslip-live-workspace${checked ? " has-result" : " is-idle"}`}>
      <div className="payslip-live-entry">
        <section className="payslip-live-hero">
          <span className="eyebrow">Your Pay Check</span>
          <h1>Know if your pay looks right.</h1>
          <div className="payslip-trust-row" aria-label="Privacy and calculation freshness">
            <ShieldCheck aria-hidden="true" />
            <span><strong>Private in your browser</strong></span>
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
            <MoneyField label="Gross pay" help="Gross pay or Total earnings on your payslip." field="gross" value={values.gross} update={update} placeholder="500,000" required />
            <MoneyField label="PAYE deducted" help="PAYE or Income tax on your payslip." field="paye" value={values.paye} update={update} placeholder="45,000" required />
            <MoneyField label="Pension deducted" help="Enter the employee pension on your payslip, or 0 if none is shown." field="pension" value={values.pension} update={update} placeholder="40,000" required />
          </div>
          <button className="primary-button payslip-live-submit" type="submit">Check my PAYE <ArrowRight aria-hidden="true" /></button>
          <button className="payslip-optional-toggle" type="button" aria-expanded={showOptional} onClick={() => setShowOptional((current) => !current)}>
            <span><strong>Optional deductions</strong><small>Add them for a more useful take-home breakdown.</small></span>
            <ChevronDown aria-hidden="true" />
          </button>
          {showOptional && (
            <div className="payslip-fields payslip-optional-fields">
              <MoneyField label="NHF" field="nhf" value={values.nhf} update={update} placeholder="10,000" />
              <MoneyField label="NHIS contribution" help="Enter only an eligible NHIS contribution shown on the payslip." field="nhis" value={values.nhis} update={update} placeholder="5,000" />
              <MoneyField label="Annual rent paid" help="Used to calculate rent relief. It is not counted as a payslip deduction." field="rent" value={values.rent} update={update} placeholder="1,200,000" />
              <MoneyField label="Other deductions" field="other" value={values.other} update={update} placeholder="12,000" />
            </div>
          )}
        </form>
      </div>

      {checked && <section className={`payslip-live-result is-${result.comparison}`} ref={resultRef} tabIndex={-1} aria-labelledby="payslip-result-title" aria-live="polite">
        <span className="eyebrow">Your Pay Check</span>
        <div className={`pay-check-verdict is-${result.verdict}`}>
          {result.verdict === "looks_consistent" ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <div>
            <small>Verdict</small>
            <strong>{verdict.label}</strong>
            <span>{verdict.detail}</span>
          </div>
        </div>
        <h2 id="payslip-result-title">{comparisonTitle}</h2>
        <p className="pay-check-caveat">This is an independent estimate, not proof of a payroll error. Bonuses, benefits, arrears and payroll adjustments can change PAYE.</p>

        <div className="payslip-result-comparison" aria-label={`Your payslip PAYE is ${money.format(enteredPaye)} and the SalarySabi estimate is ${money.format(result.expectedMonthlyPaye)}`}>
          <div><span>PAYE on your payslip</span><strong>{money.format(enteredPaye)}</strong></div>
          <div><span>SalarySabi PAYE estimate</span><strong>{money.format(result.expectedMonthlyPaye)}</strong></div>
        </div>

        <div className="payslip-result-equation" aria-label={`${money.format(monthlyGross)} gross salary minus estimated PAYE and entered deductions equals ${money.format(result.expectedTakeHome)} expected take-home pay`}>
          <span>Expected take-home with entered deductions</span>
          <strong>{money.format(result.expectedTakeHome)}</strong>
          <small>{money.format(monthlyGross)} gross − {money.format(result.expectedMonthlyPaye)} estimated PAYE − {money.format(result.totalDeductions - enteredPaye)} other entered deductions</small>
        </div>

        <div className={`payslip-live-status is-${result.comparison}`}>
          {result.comparison === "close" ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <div>
            <strong>What to do next</strong>
            <span>{comparisonGuidance}</span>
          </div>
        </div>

        <section className="pay-check-breakdown" aria-labelledby="pay-check-breakdown-title">
          <div className="pay-check-section-heading">
            <span>What each amount means</span>
            <h3 id="pay-check-breakdown-title">Your entered deductions</h3>
          </div>
          <dl>
            {deductions.map((deduction) => (
              <div key={deduction.label}>
                <dt><strong>{deduction.label}</strong><span>{deduction.explanation}</span></dt>
                <dd>{money.format(deduction.amount)}{deduction.suffix}</dd>
              </div>
            ))}
            <div className="is-total">
              <dt><strong>Total entered deductions</strong><span>PAYE plus every optional deduction you entered.</span></dt>
              <dd>{money.format(result.totalDeductions)}</dd>
            </div>
            <div className="is-take-home">
              <dt><strong>Take-home from entered figures</strong><span>Gross pay minus the deductions entered above.</span></dt>
              <dd>{money.format(result.estimatedTakeHome)}</dd>
            </div>
          </dl>
        </section>

        <section className="pay-check-payroll" aria-labelledby="payroll-questions-title">
          <div className="pay-check-section-heading">
            <span>Do not argue from the estimate</span>
            <h3 id="payroll-questions-title">Ask payroll these questions</h3>
          </div>
          <ol>
            {payrollQuestions.map((question) => <li key={question}>{question}</li>)}
          </ol>
          <button type="button" className="pay-check-copy" onClick={copyPayrollQuestions}>
            {questionsCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {questionsCopied ? "Questions copied" : "Copy questions for payroll"}
          </button>
        </section>

        <section className="pay-check-research" aria-labelledby="deduction-tracker-question">
          <span>Help choose what SalarySabi builds next</span>
          <h3 id="deduction-tracker-question">Would you like SalarySabi to help confirm whether your PAYE and pension deductions were actually remitted?</h3>
          <p>Your response records only yes or not now. SalarySabi does not send the pay figures you entered.</p>
          {deductionInterest === null ? (
            <div>
              <button type="button" onClick={() => recordDeductionInterest("yes")}>Yes, help me track it</button>
              <button type="button" onClick={() => recordDeductionInterest("no")}>Not now</button>
            </div>
          ) : (
            <p className="pay-check-research-response" role="status">
              <Check aria-hidden="true" />
              {deductionInterest === "yes"
                ? "Thank you. Your interest was recorded without your pay figures."
                : "Thanks. We recorded ‘not now’ and nothing from your payslip."}
            </p>
          )}
        </section>

        <nav className="pay-check-next-actions" aria-label="Your Pay Check next actions">
          <span>Choose your next move</span>
          <Link href="/how-paye-is-calculated">Understand PAYE <ArrowRight aria-hidden="true" /></Link>
          <Link href="/salaries">Compare my salary <ArrowRight aria-hidden="true" /></Link>
          <Link href="/jobs">See jobs with published pay <ArrowRight aria-hidden="true" /></Link>
        </nav>
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
      <div><span aria-hidden="true">₦</span><input inputMode="numeric" value={value} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} required={required} /></div>
    </label>
  );
}
