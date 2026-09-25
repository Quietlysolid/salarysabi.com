"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  maximumFractionDigits: 2,
});

function parseMoney(value: string) {
  const number = Number(value.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function formatInput(value: string) {
  if (value.includes("-")) return value;
  const clean = value.replace(/[^\d.]/g, "");
  const [whole, ...fraction] = clean.split(".");
  const integer = whole ? Number(whole).toLocaleString("en-NG") : "";
  return fraction.length ? `${integer || "0"}.${fraction.join("").slice(0, 2)}` : integer;
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

const subscribeToReady = () => () => {};

export function PayslipChecker({ initialMode = "calculate", offer, unavailableOffer = false }: { initialMode?: "calculate" | "check"; unavailableOffer?: boolean; offer?: { title: string; slug: string; minimum: number; maximum: number } }) {
  const ready = useSyncExternalStore(subscribeToReady, () => true, () => false);
  const [mode, setMode] = useState<"calculate" | "check">(initialMode);
  const [error, setError] = useState("");
  const [values, setValues] = useState({ ...initialValues, gross: offer ? formatInput(String(Math.round(offer.minimum * 100) / 100)) : "" });
  const [checked, setChecked] = useState(false);
  const [carriedSalary, setCarriedSalary] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);

  const resultRef = useRef<HTMLElement>(null);
  const checkStarted = useRef(false);
  const checkCompleted = useRef(false);

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
    if (new URLSearchParams(window.location.search).get("from") === "home") {
      let gross = "";
      try { gross = window.sessionStorage.getItem("salarysabi:home-gross") ?? ""; } catch { return; }
      if (!Number.isFinite(Number(gross)) || Number(gross) <= 0 || Number(gross) > 1_000_000_000) return;
      const timer = window.setTimeout(() => {
        setValues((current) => ({ ...current, gross: formatInput(gross) }));
        setCarriedSalary(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (new URLSearchParams(window.location.search).get("from") !== "calculator") return;
    const context = readPayContext(window.localStorage);
    if (!context || parseMoney(context.values.gross) <= 0) return;
    const restoredGross = context.period === "annual"
      ? Math.round(parseMoney(context.values.gross) / 12)
      : parseMoney(context.values.gross);
    const restoreTimer = window.setTimeout(() => {
      setValues((current) => ({ ...current, gross: formatInput(String(restoredGross)) }));
      setCarriedSalary(true);
      setMode("check");
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!checked) return;
    const focusTimer = window.setTimeout(() => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }
      resultRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [checked]);

  function update(field: Field, value: string) {
    if (!checkStarted.current) {
      track(mode === "check" ? "payslip_check_started" : "paye_input_started");
      checkStarted.current = true;
    }
    setValues((current) => ({ ...current, [field]: formatInput(value) }));
    setError("");
    setChecked(false);
    setQuestionsCopied(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (Object.values(values).some(value => value.includes("-") || !Number.isFinite(Number(value.replace(/,/g, ""))))) { setError("Enter valid, non-negative amounts."); return; }
    const deductions = ["pension", "nhf", "nhis", "other"].reduce((sum, field) => sum + parseMoney(values[field as Field]), 0);
    if (monthlyGross <= 0) { setError("Enter a monthly gross salary greater than zero."); return; }
    if (deductions + (mode === "check" ? enteredPaye : result.expectedMonthlyPaye) > monthlyGross) {
      setError("Deductions exceed your gross pay. Check the monthly amounts entered."); return;
    }
    setError("");
    setChecked(true);
    if (!checkCompleted.current) {
      track(mode === "check" ? "payslip_checked" : "paye_calculated");
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
  const payrollQuestions = questionsForPayroll(result.comparison);
  const deductions = [
    {
      label: "PAYE",
      amount: mode === "check" ? enteredPaye : result.expectedMonthlyPaye,
      suffix: "",
      explanation: "Monthly income tax. Calculated from your inputs in estimate mode.",
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

  return (
    <div className={`payslip-live-workspace${checked ? " has-result" : " is-idle"}`}>
      <div className="payslip-live-entry">
        <section className="payslip-live-hero">
          <span className="eyebrow">Your Pay Check</span>
          {unavailableOffer && <p role="status">We could not carry this listing into the calculator. Enter a confirmed monthly gross amount in naira to continue.</p>}
          {offer && <aside className="connected-context"><strong>From {offer.title}</strong><p>Advertised monthly gross: {money.format(offer.minimum)} to {money.format(offer.maximum)}. Start with either end, or enter your offer.</p><button type="button" onClick={() => update("gross", String(Math.round(offer.minimum * 100) / 100))}>Use minimum</button>{offer.maximum !== offer.minimum && <button type="button" onClick={() => update("gross", String(Math.round(offer.maximum * 100) / 100))}>Use maximum</button>}<Link href={`/jobs/${offer.slug}`}>Back to listing</Link></aside>}
          <h1>{mode === "calculate" ? "Know your take-home pay." : "Check your payslip."}</h1>
          <p>{mode === "calculate" ? "Estimate what reaches your account after tax and deductions." : "Compare the PAYE on your payslip with our estimate."}</p>
          <div className="pay-mode-switch" role="group" aria-label="Choose your pay tool">
            {(["calculate", "check"] as const).map((option) => <a key={option} href={option === "check" ? "/calculator?mode=check" : "/calculator"} aria-current={mode === option ? "page" : undefined} onClick={(event) => { event.preventDefault(); window.history.replaceState({}, "", option === "check" ? "/calculator?mode=check" : "/calculator"); setMode(option); setChecked(false); setError(""); checkStarted.current = false; checkCompleted.current = false; }}>{option === "calculate" ? "Calculate take-home" : "Check my payslip"}</a>)}
          </div>
          <div className="payslip-trust-row" aria-label="Privacy and calculation freshness">
            <ShieldCheck aria-hidden="true" />
            <span><strong>Private in your browser</strong></span>
          </div>
        </section>

        <form className="payslip-live-form" onSubmit={submit}>
          {!ready && <p role="status">Starting calculator...</p>}
          <noscript>Enable JavaScript to calculate your pay.</noscript>
          <fieldset className="pay-ready-fields" disabled={!ready}>
          <p className="pay-period-note">Enter monthly amounts in naira. Annual rent is labelled separately.</p>
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
            <MoneyField label="Monthly gross pay" help="Your salary before tax and deductions." field="gross" value={values.gross} update={update} placeholder="500,000" required />
            {mode === "check" && <MoneyField label="PAYE deducted" help="PAYE or Income tax on your payslip." field="paye" value={values.paye} update={update} placeholder="45,000" required />}
            {mode === "check" && <MoneyField label="Pension deducted" help="Enter the employee pension on your payslip, or 0 if none is shown." field="pension" value={values.pension} update={update} placeholder="40,000" required />}
          </div>

          <details className="payslip-deductions"><summary className="payslip-optional-toggle">
            <span><strong>Deductions &amp; reliefs</strong><small>{mode === "calculate" ? "Optional. Blank amounts are treated as zero." : "Add other deductions and annual rent."}</small></span>
            <ChevronDown aria-hidden="true" />
          </summary>
            <div className="payslip-fields payslip-optional-fields">
              {mode === "calculate" && <MoneyField label="Monthly pension" field="pension" value={values.pension} update={update} placeholder="0" />}
              <MoneyField label="NHF" field="nhf" value={values.nhf} update={update} placeholder="10,000" />
              <MoneyField label="NHIS contribution" help="Enter only an eligible NHIS contribution shown on the payslip." field="nhis" value={values.nhis} update={update} placeholder="5,000" />
              <MoneyField label="Annual rent paid" help="Used to calculate rent relief. It is not counted as a payslip deduction." field="rent" value={values.rent} update={update} placeholder="1,200,000" />
              <MoneyField label="Other deductions" field="other" value={values.other} update={update} placeholder="12,000" />
            </div>
          </details>
          {error && <p className="pay-form-error" role="alert">{error}</p>}
          <button className="primary-button payslip-live-submit" type="submit">{mode === "calculate" ? "Calculate take-home pay" : "Check my PAYE"}<ArrowRight aria-hidden="true" /></button>
          </fieldset>
        </form>
      </div>

      {checked && <section className={`payslip-live-result is-${result.comparison}`} ref={resultRef} tabIndex={-1} aria-labelledby="payslip-result-title" aria-live="polite">
        <span className="eyebrow">Your Pay Check</span>
        <h2 id="payslip-result-title">{mode === "calculate" ? "Your estimated take-home" : result.comparison === "close" ? "Your PAYE matches our estimate closely." : "Your PAYE differs from our estimate."}</h2>
        <p className="pay-check-caveat">{mode === "calculate" ? "Based on the current 2026 calculation rules and the deductions you entered. Blank deductions are treated as zero." : "An estimate, not proof of a payroll error. Bonuses, benefits and payroll adjustments can change PAYE."}</p>
        {mode === "check" && <><p>{comparisonTitle} Compared with our estimate.</p>
        <div className="payslip-result-comparison">
          <div><span>Monthly PAYE on your payslip</span><strong>{money.format(enteredPaye)}</strong></div>
          <div><span>Estimated monthly PAYE</span><strong>{money.format(result.expectedMonthlyPaye)}</strong></div>
        </div></>}

        <div className="payslip-result-equation" aria-label={`${money.format(monthlyGross)} gross salary minus estimated PAYE and entered deductions equals ${money.format(result.expectedTakeHome)} expected take-home pay`}>
          <span>Estimated take-home per month</span>
          <strong>{money.format(result.expectedTakeHome)}</strong>
          <small>{money.format(monthlyGross)} gross − {money.format(result.expectedMonthlyPaye)} estimated PAYE − {money.format(result.totalDeductions - enteredPaye)} other entered deductions</small>
        </div>

        {mode === "check" && <div className={`payslip-live-status is-${result.comparison}`}>
          {result.comparison === "close" ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <div>
            <strong>What to do next</strong>
            <span>{comparisonGuidance}</span>
          </div>
        </div>}

        <details className="pay-result-details"><summary>View calculation breakdown</summary>
        <section className="pay-check-breakdown" aria-labelledby="pay-check-breakdown-title">
          <div className="pay-check-section-heading">
            <span>What each amount means</span>
            <h3 id="pay-check-breakdown-title">{mode === "check" ? "Your entered deductions" : "Your calculation"}</h3>
          </div>
          <dl>
            {deductions.map((deduction) => (
              <div key={deduction.label}>
                <dt><strong>{deduction.label}</strong><span>{deduction.explanation}</span></dt>
                <dd>{money.format(deduction.amount)}{deduction.suffix}</dd>
              </div>
            ))}
            <div className="is-total">
              <dt><strong>Total deductions</strong><span>PAYE plus pension and other deductions.</span></dt>
              <dd>{money.format(mode === "check" ? result.totalDeductions : result.totalDeductions - enteredPaye + result.expectedMonthlyPaye)}</dd>
            </div>
            <div className="is-take-home">
              <dt><strong>{mode === "check" ? "Take-home from your payslip figures" : "Estimated monthly take-home"}</strong><span>Gross pay minus the deductions entered above.</span></dt>
              <dd>{money.format(mode === "check" ? result.estimatedTakeHome : result.expectedTakeHome)}</dd>
            </div>
          </dl>
        </section>

        </details>
        {mode === "check" && <details className="pay-result-details"><summary>Questions to ask payroll</summary>
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

        </details>}

        <div className="connected-next">
          {mode === "calculate" && <button type="button" onClick={() => { setMode("check"); setChecked(false); setError(""); window.history.replaceState({}, "", "/calculator?mode=check"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Check my payslip with these figures <ArrowRight aria-hidden="true" /></button>}
          <Link href="/salaries">Explore or share salary knowledge <ArrowRight aria-hidden="true" /></Link>
        </div>
        <nav className="pay-check-next-actions" aria-label="Your Pay Check next actions">
          <span>Choose your next move</span>
          <Link href="/how-paye-is-calculated">Understand PAYE <ArrowRight aria-hidden="true" /></Link>
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
      {help && <small id={`pay-${field}-help`}>{help}</small>}
      <div><span aria-hidden="true">₦</span><input aria-describedby={help ? `pay-${field}-help` : undefined} inputMode="decimal" value={value} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} required={required} /></div>
    </label>
  );
}
