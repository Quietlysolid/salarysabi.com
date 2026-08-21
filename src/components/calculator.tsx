"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { track } from "@/components/analytics";
import { calculatePaye } from "@/lib/paye";
import { readPayContext, writePayContext } from "@/lib/pay-context";
import { rulesVerifiedDate, taxReviewStatus } from "@/lib/site";

type FieldName =
  | "gross"
  | "pension"
  | "nhf"
  | "nhis"
  | "mortgage"
  | "insurance"
  | "rent";

type FormValues = Record<FieldName, string>;

type DeductionField = {
  name: Exclude<FieldName, "gross">;
  label: string;
  hint?: string;
};

const initialValues: FormValues = {
  gross: "",
  pension: "",
  nhf: "",
  nhis: "",
  mortgage: "",
  insurance: "",
  rent: "",
};

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const commonDeductionFields: DeductionField[] = [
  {
    name: "pension",
    label: "Pension",
  },
  {
    name: "nhf",
    label: "National Housing Fund (NHF)",
  },
  {
    name: "nhis",
    label: "National health insurance",
  },
  {
    name: "rent",
    label: "Home rent",
  },
];

const otherDeductionFields: DeductionField[] = [
  {
    name: "mortgage",
    label: "Mortgage interest",
    hint: "Enter interest only, not the full repayment.",
  },
  {
    name: "insurance",
    label: "Life assurance",
    hint: "Use the amount on your insurer’s statement.",
  },
];

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInput(value: string) {
  const raw = value.replace(/[^\d]/g, "");
  return raw ? Number(raw).toLocaleString("en-NG") : "";
}

export function Calculator() {
  const [values, setValues] = useState(initialValues);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [deductionPeriod, setDeductionPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [showDeductions, setShowDeductions] = useState(false);
  const [showOtherDeductions, setShowOtherDeductions] = useState(false);
  const [isExampleSalary, setIsExampleSalary] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [grossError, setGrossError] = useState("");
  const grossInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = readPayContext(window.localStorage);
    const returningFromGuide = new URLSearchParams(window.location.search).get("restore") === "deduction";
    const restoreTimer = window.setTimeout(() => {
      if (saved) {
        setValues({ ...initialValues, ...saved.values });
        setPeriod(saved.period);
        setDeductionPeriod(saved.deductionPeriod);
        if (returningFromGuide) {
          setShowDeductions(true);
          if (saved.returnField === "mortgage" || saved.returnField === "insurance") setShowOtherDeductions(true);
          window.setTimeout(() => {
            const target = document.getElementById(`calculator-${saved.returnField ?? "gross"}`);
            target?.scrollIntoView({ behavior: "smooth", block: "center" });
            target?.focus({ preventScroll: true });
          }, 80);
        }
      }
      setContextReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!contextReady) return;
    const previous = readPayContext(window.localStorage);
    writePayContext(window.localStorage, {
      values,
      period,
      deductionPeriod,
      returnField: previous?.returnField,
      updatedAt: Date.now(),
    });
  }, [contextReady, deductionPeriod, period, values]);

  const inputs = useMemo(() => {
    const gross = parseMoney(values.gross);
    const deductionMultiplier = deductionPeriod === "monthly" ? 12 : 1;
    return {
      annualGrossIncome: period === "monthly" ? gross * 12 : gross,
      pensionContribution: parseMoney(values.pension) * deductionMultiplier,
      nhfContribution: parseMoney(values.nhf) * deductionMultiplier,
      nhisContribution: parseMoney(values.nhis) * deductionMultiplier,
      mortgageInterest: parseMoney(values.mortgage) * deductionMultiplier,
      lifeInsurancePremium: parseMoney(values.insurance) * deductionMultiplier,
      annualRentPaid: parseMoney(values.rent) * deductionMultiplier,
    };
  }, [deductionPeriod, period, values]);

  const result = useMemo(() => calculatePaye(inputs), [inputs]);
  const showResult = hasCalculated || inputs.annualGrossIncome > 0;

  function update(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: formatInput(value) }));
    if (name === "gross" && parseMoney(value) > 0) setGrossError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (inputs.annualGrossIncome <= 0) {
      setHasCalculated(false);
      setGrossError("Enter your salary before calculating.");
      grossInputRef.current?.focus();
      return;
    }
    setGrossError("");
    setHasCalculated(true);
    track("paye_calculated");
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      resultsRef.current?.focus({ preventScroll: true });
    });
  }

  async function exportPdf() {
    setExporting("pdf");
    try {
      const { downloadPdf } = await import("@/lib/exports");
      await downloadPdf(inputs, result);
      track("pdf_exported");
    } finally {
      setExporting(null);
    }
  }

  async function exportExcel() {
    setExporting("excel");
    try {
      const { downloadExcel } = await import("@/lib/exports");
      downloadExcel(inputs, result);
      track("excel_exported");
    } finally {
      setExporting(null);
    }
  }

  async function shareResult() {
    const text = `My estimated Nigerian PAYE is ${money.format(result.monthlyTax)} monthly on ${money.format(result.annualGrossIncome)} annual gross pay. Calculated with SalarySabi's 2026 ruleset.`;
    try {
      if (navigator.share) await navigator.share({ title: "My PAYE breakdown", text, url: window.location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
        setShareMessage("Breakdown copied. You can paste it into a message.");
      }
      track("paye_result_shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("Sharing is not available in this browser. Download the PDF instead.");
    }
  }

  function renderDeductionField(field: DeductionField) {
    const periodLabel = deductionPeriod === "monthly" ? "monthly" : "yearly";
    return (
      <label
        className={
          field.name === "rent"
            ? "deduction-field rent-field"
            : "deduction-field"
        }
        key={field.name}
      >
        <strong>{field.label}</strong>
        {field.hint && <small>{field.hint}</small>}
        <div className="small-currency-input">
          <span>₦</span>
          <input
            id={`calculator-${field.name}`}
            inputMode="numeric"
            value={values[field.name]}
            onChange={(event) => update(field.name, event.target.value)}
            aria-label={`${field.label} ${periodLabel} amount`}
            placeholder="0"
          />
          <em>{periodLabel}</em>
        </div>
        {field.name === "rent" && parseMoney(values.rent) > 0 && (
          <span className="rent-feedback" role="status">
            <span>Your calculated rent relief</span>
            <strong>{money.format(result.rentRelief)}</strong>
            <small>
              {result.rentRelief === 500_000
                ? "Maximum yearly relief reached"
                : "20% of your annual rent"}
            </small>
          </span>
        )}
      </label>
    );
  }

  return (
    <div className="calculator-shell">
      <form className="calculator-card" onSubmit={submit}>
        <header className="simple-home-intro">
          <p className="simple-home-slogan">Know what you earn, what you owe and what you keep.</p>
          <h1>Check your take-home pay</h1>
          <p className="simple-home-platform-intro">Start with your take-home pay, then verify your payslip, compare salaries and find jobs that publish what they pay.</p>
        </header>

        <div className="tax-review-byline calculator-review-byline">
          <strong>Prepared and maintained by Ozichi Nwosu</strong>
          <span>{taxReviewStatus}</span>
          <small><Link href="/tax-updates">See source history and review status</Link></small>
        </div>

        <div className="period-toggle" aria-label="Income period">
          <button
            className={period === "monthly" ? "active" : ""}
            type="button"
            onClick={() => setPeriod("monthly")}
          >
            Monthly salary
          </button>
          <button
            className={period === "annual" ? "active" : ""}
            type="button"
            onClick={() => setPeriod("annual")}
          >
            Yearly salary
          </button>
        </div>

        <label className="amount-field">
          <span>
            {isExampleSalary
              ? "Example salary before deductions"
              : "Salary before deductions"}
          </span>
          <div className="currency-input">
            <span>₦</span>
            <input
              id="calculator-gross"
              ref={grossInputRef}
              inputMode="numeric"
              value={values.gross}
              onChange={(event) => {
                setIsExampleSalary(false);
                update("gross", event.target.value);
              }}
              aria-label="Salary before deductions"
              aria-invalid={Boolean(grossError)}
              aria-describedby={grossError ? "calculator-gross-error" : undefined}
              placeholder="e.g. 500,000"
            />
          </div>
          {grossError && <small className="field-error" id="calculator-gross-error" role="alert">{grossError}</small>}
        </label>

        <button
          className="deduction-toggle"
          type="button"
          aria-expanded={showDeductions}
          onClick={() => setShowDeductions((value) => !value)}
        >
          <span>
            <strong>Optional deductions</strong>
          </span>
          <span className={showDeductions ? "chevron open" : "chevron"}>
            {showDeductions ? "−" : "+"}
          </span>
        </button>

        {showDeductions && (
          <div className="deduction-flow">
            <div className="deduction-intro">
              <p>Use amounts from your payslip. Leave unknown fields at ₦0.</p>
            </div>

            <div className="deduction-period">
              <span>Amounts are</span>
              <button
                className={deductionPeriod === "monthly" ? "active" : ""}
                type="button"
                onClick={() => setDeductionPeriod("monthly")}
              >
                Monthly
              </button>
              <button
                className={deductionPeriod === "annual" ? "active" : ""}
                type="button"
                onClick={() => setDeductionPeriod("annual")}
              >
                Yearly
              </button>
            </div>

            <div className="deduction-grid">
              {commonDeductionFields.map(renderDeductionField)}
            </div>

            <button
              className="other-deductions-toggle"
              type="button"
              aria-expanded={showOtherDeductions}
              onClick={() => setShowOtherDeductions((value) => !value)}
            >
              <span>
                <strong>More deductions</strong>
              </span>
              <span className={showOtherDeductions ? "chevron open" : "chevron"}>
                {showOtherDeductions ? "Hide" : "Add"}
              </span>
            </button>

            {showOtherDeductions && (
              <div className="deduction-grid other-deduction-grid">
                {otherDeductionFields.map(renderDeductionField)}
              </div>
            )}
          </div>
        )}

        <button className="primary-button" type="submit">
          {hasCalculated ? "Update result" : "Calculate take-home pay"}
        </button>
      </form>

      {<section
        className="results-card"
        id="results"
        aria-live="polite"
        ref={resultsRef}
        tabIndex={-1}
      >
        <div className="result-top">
          {isExampleSalary && (
            <span className="result-state-label">Example preview</span>
          )}
          <p>Take-home pay</p>
          {showResult ? (
            <>
              <strong>{money.format(result.monthlyIncomeAfterTax)}</strong>
              {" "}
              <span className="per-month">per month</span>
            </>
          ) : (
            <div className="result-empty">
              <h2>See your take-home pay, PAYE and effective tax rate.</h2>
            </div>
          )}
        </div>

        {showResult && <div className="result-summary">
          <div>
            <span>PAYE</span>
            <strong>{money.format(result.monthlyTax)}</strong>
          </div>
          <div>
            <span>Effective rate</span>
            <strong>{(result.effectiveTaxRate * 100).toFixed(1)}%</strong>
          </div>
        </div>}

        {showResult && <details className="calculation-details">
          <summary>
            <span>
              <strong>View full calculation</strong>
              <small>Yearly figures and tax bands</small>
            </span>
            <span className="details-plus" aria-hidden="true">
              +
            </span>
          </summary>

          <div className="breakdown">
            <div className="section-title">
              <h3>Yearly totals</h3>
            </div>
            <dl>
              <div>
                <dt>Salary</dt>
                <dd>{money.format(result.annualGrossIncome)}</dd>
              </div>
              <div>
                <dt>Eligible deductions</dt>
                <dd className="deduction">
                  {money.format(result.totalEligibleDeductions)}
                </dd>
              </div>
              {result.rentRelief > 0 && (
                <div className="subrow">
                  <dt>Includes calculated rent relief</dt>
                  <dd>{money.format(result.rentRelief)}</dd>
                </div>
              )}
              <div className="chargeable">
                <dt>Taxable income</dt>
                <dd>{money.format(result.chargeableIncome)}</dd>
              </div>
              <div>
                <dt>PAYE</dt>
                <dd>{money.format(result.annualTax)}</dd>
              </div>
            </dl>
          </div>

          <div className="bands">
            <div className="section-title">
              <h3>Tax bands</h3>
            </div>
            {result.bands.map((band) => {
              const reached = band.taxableAmount > 0;
              return <div className={reached ? "band-row" : "band-row is-unreached"} key={band.label}>
                <div>
                  <span>{band.label}</span>
                  <small>{Math.round(band.rate * 100)}%</small>
                </div>
                <div className="bar">
                  <span
                    style={{
                      width: `${
                        result.chargeableIncome
                          ? Math.min(
                              100,
                              (band.tax / Math.max(result.annualTax, 1)) * 100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <strong>{reached ? money.format(band.tax) : "Not reached"}</strong>
              </div>;
            })}
          </div>
        </details>}

        {hasCalculated && <aside className="calculation-trust" aria-label="Calculation source and freshness">
          <Link href="/tax-updates" aria-label="See calculation source and review status">
            <ShieldCheck aria-hidden="true" />
            <p><strong>Official 2026 rules</strong><span> · Reviewed {rulesVerifiedDate}</span></p>
          </Link>
        </aside>}
        {hasCalculated && <section className="result-next-actions" aria-labelledby="result-next-title">
          <h2 id="result-next-title">What to do next</h2>
          <ol>
            <li><Link className="result-next-primary" href="/payslip-checker?from=calculator"><span><strong>Verify with my payslip</strong></span><ArrowRight aria-hidden="true" /></Link></li>
            <li><Link href="/salaries"><span><strong>Compare my salary</strong></span><ArrowRight aria-hidden="true" /></Link></li>
            <li><Link href="/jobs"><span><strong>Find jobs with published pay</strong></span><ArrowRight aria-hidden="true" /></Link></li>
          </ol>
        </section>}
        {hasCalculated && <div className="result-footer">
          <Link href="/how-paye-is-calculated">How this PAYE was calculated</Link>
          <div className="export-actions">
            <button disabled={exporting !== null} type="button" onClick={exportPdf}>{exporting === "pdf" ? "Preparing…" : "PDF"}</button>
            <button disabled={exporting !== null} type="button" onClick={exportExcel}>{exporting === "excel" ? "Preparing…" : "Excel"}</button>
            <button type="button" onClick={shareResult}>Share</button>
          </div>
          <small role="status">{shareMessage}</small>
        </div>}
      </section>}
    </div>
  );
}
