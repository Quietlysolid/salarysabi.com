"use client";

import { FormEvent, useMemo, useState } from "react";
import { track } from "@/components/analytics";
import { downloadExcel, downloadPdf } from "@/lib/exports";
import { calculatePaye } from "@/lib/paye";

type FieldName =
  | "gross"
  | "pension"
  | "nhf"
  | "nhis"
  | "mortgage"
  | "insurance"
  | "rent";

type FormValues = Record<FieldName, string>;

const initialValues: FormValues = {
  gross: "500,000",
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

const compactMoney = new Intl.NumberFormat("en-NG", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInput(value: string) {
  const raw = value.replace(/[^\d]/g, "");
  return raw ? Number(raw).toLocaleString("en-NG") : "";
}

const deductionFields: Array<{
  name: Exclude<FieldName, "gross">;
  label: string;
  hint: string;
}> = [
  { name: "pension", label: "Pension contribution", hint: "Actual annual amount" },
  { name: "nhf", label: "NHF contribution", hint: "Actual annual amount" },
  { name: "nhis", label: "NHIS contribution", hint: "Actual annual amount" },
  {
    name: "mortgage",
    label: "Qualifying mortgage interest",
    hint: "Interest only, annual",
  },
  {
    name: "insurance",
    label: "Life insurance premium",
    hint: "Self or spouse, annual",
  },
  {
    name: "rent",
    label: "Annual rent paid",
    hint: "We calculate 20%, capped at ₦500,000",
  },
];

export function Calculator() {
  const [values, setValues] = useState(initialValues);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [showDeductions, setShowDeductions] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const inputs = useMemo(() => {
    const gross = parseMoney(values.gross);
    return {
      annualGrossIncome: period === "monthly" ? gross * 12 : gross,
      pensionContribution: parseMoney(values.pension),
      nhfContribution: parseMoney(values.nhf),
      nhisContribution: parseMoney(values.nhis),
      mortgageInterest: parseMoney(values.mortgage),
      lifeInsurancePremium: parseMoney(values.insurance),
      annualRentPaid: parseMoney(values.rent),
    };
  }, [period, values]);

  const result = useMemo(() => calculatePaye(inputs), [inputs]);

  function update(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: formatInput(value) }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setHasCalculated(true);
    track("paye_calculated");
    requestAnimationFrame(() =>
      document.getElementById("results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }

  async function exportPdf() {
    setExporting("pdf");
    try {
      await downloadPdf(inputs, result);
      track("pdf_exported");
    } finally {
      setExporting(null);
    }
  }

  function exportExcel() {
    setExporting("excel");
    try {
      downloadExcel(inputs, result);
      track("excel_exported");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="calculator-shell">
      <form className="calculator-card" onSubmit={submit}>
        <div className="card-heading">
          <div>
            <span className="eyebrow">2026 rules</span>
            <h2>Calculate your PAYE</h2>
          </div>
          <span className="status-pill">
            <span />
            Updated
          </span>
        </div>

        <div className="period-toggle" aria-label="Income period">
          <button
            className={period === "monthly" ? "active" : ""}
            type="button"
            onClick={() => setPeriod("monthly")}
          >
            Monthly income
          </button>
          <button
            className={period === "annual" ? "active" : ""}
            type="button"
            onClick={() => setPeriod("annual")}
          >
            Annual income
          </button>
        </div>

        <label className="amount-field">
          <span>
            {period === "monthly"
              ? "Gross monthly employment income"
              : "Total annual emolument"}
          </span>
          <div className="currency-input">
            <span>₦</span>
            <input
              inputMode="numeric"
              value={values.gross}
              onChange={(event) => update("gross", event.target.value)}
              aria-label="Gross income"
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
            <strong>Add eligible deductions</strong>
            <small>Enter actual annual amounts</small>
          </span>
          <span className={showDeductions ? "chevron open" : "chevron"}>⌄</span>
        </button>

        {showDeductions && (
          <div className="deduction-grid">
            {deductionFields.map((field) => (
              <label className={field.name === "rent" ? "rent-field" : ""} key={field.name}>
                <span>{field.label}</span>
                <small>{field.hint}</small>
                <div className="small-currency-input">
                  <span>₦</span>
                  <input
                    inputMode="numeric"
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    placeholder="0"
                  />
                </div>
                {field.name === "rent" && parseMoney(values.rent) > 0 && (
                  <span className="rent-feedback" role="status">
                    <span>Calculated rent relief</span>
                    <strong>{money.format(result.rentRelief)}</strong>
                    <small>
                      {result.rentRelief === 500_000
                        ? "Maximum relief reached"
                        : "20% of annual rent"}
                    </small>
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        <button className="primary-button" type="submit">
          Calculate my PAYE
          <span aria-hidden="true">→</span>
        </button>
        <p className="privacy-note">No signup. Your figures stay in this browser.</p>
      </form>

      <section className="results-card" id="results" aria-live="polite">
        <div className="result-top">
          <span className="eyebrow light">Your estimate</span>
          <p>Monthly PAYE</p>
          <strong>{hasCalculated ? money.format(result.monthlyTax) : "—"}</strong>
          <span className="per-month">per month</span>
        </div>

        <div className="result-summary">
          <div>
            <span>Income after tax</span>
            <strong>{money.format(result.monthlyIncomeAfterTax)}</strong>
            <small>Monthly gross less PAYE only</small>
          </div>
          <div>
            <span>Effective tax rate</span>
            <strong>{(result.effectiveTaxRate * 100).toFixed(1)}%</strong>
            <small>Of total gross income</small>
          </div>
        </div>

        <div className="breakdown">
          <div className="section-title">
            <h3>Annual breakdown</h3>
            <span>NGN</span>
          </div>
          <dl>
            <div>
              <dt>Gross income</dt>
              <dd>{money.format(result.annualGrossIncome)}</dd>
            </div>
            <div>
              <dt>Eligible deductions</dt>
              <dd className="deduction">
                − {money.format(result.totalEligibleDeductions)}
              </dd>
            </div>
            {result.rentRelief > 0 && (
              <div className="subrow">
                <dt>Includes rent relief</dt>
                <dd>{money.format(result.rentRelief)}</dd>
              </div>
            )}
            <div className="chargeable">
              <dt>Chargeable income</dt>
              <dd>{money.format(result.chargeableIncome)}</dd>
            </div>
            <div>
              <dt>Annual PAYE</dt>
              <dd>{money.format(result.annualTax)}</dd>
            </div>
          </dl>
        </div>

        <div className="bands">
          <div className="section-title">
            <h3>How each band applies</h3>
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

        <div className="result-footer">
          <div>
            <span className="mini-icon">✓</span>
            <p>
              <strong>Calculated with 2026 tax bands</strong>
              <small>
                Chargeable income: ₦{compactMoney.format(result.chargeableIncome)}
              </small>
            </p>
          </div>
          <div className="export-actions">
            <button disabled={exporting !== null} type="button" onClick={exportPdf}>
              {exporting === "pdf" ? "Preparing…" : "PDF"}
            </button>
            <button disabled={exporting !== null} type="button" onClick={exportExcel}>
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
        </div>
      </section>
    </div>
  );
}
