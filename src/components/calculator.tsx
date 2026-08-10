"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/components/analytics";
import { calculatePaye } from "@/lib/paye";
import { readPayContext, writePayContext } from "@/lib/pay-context";
import { rulesVerifiedDate, rulesetName, rulesetVersion } from "@/lib/site";

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
  question: string;
  help: string;
  example: string;
  guideAnchor: string;
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
    guideAnchor: "pension",
    label: "Pension",
    question: "Does your payslip show a pension deduction?",
    help: "Enter the amount beside “Pension” on your payslip, not your pension account balance.",
    example: "For example, ₦40,000 monthly is ₦480,000 yearly.",
  },
  {
    name: "nhf",
    guideAnchor: "nhf",
    label: "National Housing Fund (NHF)",
    question: "Does your payslip show an NHF deduction?",
    help: "Enter the amount beside “NHF” on your payslip. If it is not listed, leave this at ₦0.",
    example: "Use the amount actually deducted from your salary.",
  },
  {
    name: "nhis",
    guideAnchor: "nhis",
    label: "National health insurance",
    question: "Does your payslip show NHIS or NHIA?",
    help: "Enter the eligible health-insurance amount shown on your payslip.",
    example: "A private HMO may not qualify. Check with payroll if unsure.",
  },
  {
    name: "rent",
    guideAnchor: "rent-relief",
    label: "Rent for your home",
    question: "How much rent do you pay for your home?",
    help: "Enter your rent and we will calculate the relief automatically.",
    example: "This lowers taxable income; it is not a cash refund.",
  },
];

const otherDeductionFields: DeductionField[] = [
  {
    name: "mortgage",
    guideAnchor: "mortgage-interest",
    label: "Mortgage interest",
    question: "Do you pay interest on a mortgage for your main home?",
    help: "Enter only the interest charged, not the full payment or loan repayment.",
    example: "Use the interest amount on your lender’s statement.",
  },
  {
    name: "insurance",
    guideAnchor: "life-assurance",
    label: "Life assurance",
    question: "Do you pay life-assurance premiums for yourself or your spouse?",
    help: "Enter qualifying life-assurance premiums, not car, travel or ordinary health insurance.",
    example: "Use the amount on your insurer’s receipt or statement.",
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

export function Calculator({ guided = false }: { guided?: boolean }) {
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

  function update(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: formatInput(value) }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
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
        <span className="deduction-kicker">{field.label}</span>
        <strong>{field.question}</strong>
        <small>{field.help}</small>
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
        <small className="field-example">{field.example}</small>
        <Link
          className="deduction-guide-link"
          href={`/eligible-deductions?from=calculator#${field.guideAnchor}`}
          onClick={() => {
            writePayContext(window.localStorage, {
              values,
              period,
              deductionPeriod,
              returnField: field.name,
              updatedAt: Date.now(),
            });
          }}
        >
          Check what belongs in this field
        </Link>
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
        <div className="card-heading">
          <div>
            <h2>How much do you earn?</h2>
            <small className="live-note">
              Enter your salary before tax and other deductions.
            </small>
          </div>
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
              ? `Example ${period === "monthly" ? "monthly" : "yearly"} salary`
              : period === "monthly"
                ? "Your monthly salary before deductions"
                : "Your total yearly salary before deductions"}
          </span>
          <div className="currency-input">
            <span>₦</span>
            <input
              id="calculator-gross"
              inputMode="numeric"
              value={values.gross}
              onChange={(event) => {
                setIsExampleSalary(false);
                update("gross", event.target.value);
              }}
              aria-label="Salary before deductions"
              placeholder="500,000"
            />
          </div>
        </label>

        <button
          className="deduction-toggle"
          type="button"
          aria-expanded={showDeductions}
          onClick={() => setShowDeductions((value) => !value)}
        >
          <span>
            <strong>Add pension, rent or other deductions</strong>
            <small>Optional. Skip this if none apply to you.</small>
          </span>
          <span className={showDeductions ? "chevron open" : "chevron"}>
            {showDeductions ? "Hide" : "Show"}
          </span>
        </button>

        {showDeductions && (
          <div className="deduction-flow">
            <div className="deduction-intro">
              <strong>Enter only what you can confirm</strong>
              <p>
                Check your payslip, PFA statement or receipt. If you do not
                recognise an item, leave it at ₦0.
              </p>
            </div>

            <div className="deduction-period">
              <span>I want to enter</span>
              <button
                className={deductionPeriod === "monthly" ? "active" : ""}
                type="button"
                onClick={() => setDeductionPeriod("monthly")}
              >
                Monthly amounts
              </button>
              <button
                className={deductionPeriod === "annual" ? "active" : ""}
                type="button"
                onClick={() => setDeductionPeriod("annual")}
              >
                Yearly totals
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
                <strong>Other deductions you may have</strong>
                <small>Mortgage interest and life assurance</small>
              </span>
              <span className={showOtherDeductions ? "chevron open" : "chevron"}>
                {showOtherDeductions ? "Hide" : "Show"}
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
          Calculate my PAYE
        </button>
        <p className="privacy-note">
          No signup. Your salary figures stay in this browser.
        </p>
      </form>

      {(!guided || hasCalculated) && <section
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
          <p>Your PAYE estimate</p>
          {hasCalculated ? (
            <>
              <strong>{money.format(result.monthlyTax)}</strong>
              <span className="per-month">per month</span>
              <small className="result-explainer">
                Based on a {money.format(parseMoney(values.gross))}{" "}
                {period === "monthly" ? "monthly" : "yearly"} salary
              </small>
            </>
          ) : (
            <div className="result-empty">
              <h2>No estimate yet</h2>
              <p>Enter your salary and select Calculate my PAYE to see the breakdown.</p>
            </div>
          )}
        </div>

        {hasCalculated && <div className="result-summary">
          <div>
            <span>Income after PAYE only</span>
            <strong>{money.format(result.monthlyIncomeAfterTax)}</strong>
            <small>Before pension, NHF and other payroll deductions</small>
          </div>
          <div>
            <span>Share of salary paid as PAYE</span>
            <strong>{(result.effectiveTaxRate * 100).toFixed(1)}%</strong>
            <small>Excludes pension, NHF, NHIS and other payroll deductions</small>
          </div>
        </div>}

        {hasCalculated && <details className="calculation-details">
          <summary>
            <span>
              <strong>See how we got this number</strong>
              <small>Yearly figures and every 2026 tax band</small>
            </span>
            <span className="details-plus" aria-hidden="true">
              +
            </span>
          </summary>

          <div className="breakdown">
            <div className="section-title">
              <h3>Your yearly calculation</h3>
              <span>NGN</span>
            </div>
            <dl>
              <div>
                <dt>Total yearly salary</dt>
                <dd>{money.format(result.annualGrossIncome)}</dd>
              </div>
              <div>
                <dt>Deductions that reduce taxable income</dt>
                <dd className="deduction">
                  − {money.format(result.totalEligibleDeductions)}
                </dd>
              </div>
              {result.rentRelief > 0 && (
                <div className="subrow">
                  <dt>Includes calculated rent relief</dt>
                  <dd>{money.format(result.rentRelief)}</dd>
                </div>
              )}
              <div className="chargeable">
                <dt>Income used to calculate your tax</dt>
                <dd>{money.format(result.chargeableIncome)}</dd>
              </div>
              <div>
                <dt>Total PAYE for the year</dt>
                <dd>{money.format(result.annualTax)}</dd>
              </div>
            </dl>
          </div>

          <div className="bands">
            <div className="section-title">
              <h3>How each tax band applies</h3>
            </div>
            {result.bands.map((band) => (
              <div className="band-row" key={band.label}>
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
                <strong>{money.format(band.tax)}</strong>
              </div>
            ))}
          </div>
        </details>}

        {hasCalculated && <div className="result-footer">
          <div>
            <p>
              <strong>Based on official 2026 JRB guidance</strong>
              <small>
                Independent estimate. Rules checked {rulesVerifiedDate}.
              </small>
            </p>
          </div>
          <div className="export-actions">
            <button disabled={exporting !== null} type="button" onClick={exportPdf}>
              {exporting === "pdf" ? "Preparing…" : "PDF"}
            </button>
            <button
              disabled={exporting !== null}
              type="button"
              onClick={exportExcel}
            >
              {exporting === "excel" ? "Preparing…" : "Excel"}
            </button>
            <button
              type="button"
              onClick={() => {
                track("print_opened");
                window.print();
              }}
            >
              Print
            </button>
          </div>
        </div>}
        {hasCalculated && <aside className="calculation-trust" aria-label="Calculation source and freshness">
          <div>
            <span>Rules verified</span>
            <strong>{rulesVerifiedDate}</strong>
          </div>
          <p><strong>Ruleset {rulesetVersion}</strong><br />Based on the {rulesetName}.</p>
          <Link href="/how-paye-is-calculated">See the calculation</Link>
        </aside>}
        {hasCalculated && (
          <Link className="payslip-context-action" href="/payslip-checker?from=calculator">
            <span>
              <strong>Have this month’s payslip?</strong>
              <small>Carry this salary into the payslip checker.</small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>}
    </div>
  );
}
