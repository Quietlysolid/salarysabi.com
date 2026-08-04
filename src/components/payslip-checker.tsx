"use client";

import { FormEvent, useMemo, useState } from "react";
import { checkPayslip } from "@/lib/payslip";

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

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: formatInput(value) }));
    setChecked(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
  }

  const comparisonText =
    result.comparison === "close"
      ? "The PAYE on your payslip is close to our estimate."
      : result.comparison === "higher"
        ? "Your payslip shows more PAYE than our estimate."
        : "Your payslip shows less PAYE than our estimate.";

  return (
    <div className="payslip-checker">
      <form onSubmit={submit}>
        <div className="payslip-form-heading">
          <h2>Enter the monthly figures</h2>
          <p>Use the amounts printed on your payslip.</p>
        </div>
        <div className="payslip-fields">
          <MoneyField label="Gross salary" field="gross" value={values.gross} update={update} required />
          <MoneyField label="PAYE deducted" field="paye" value={values.paye} update={update} required />
          <MoneyField label="Pension" field="pension" value={values.pension} update={update} />
          <MoneyField label="NHF" field="nhf" value={values.nhf} update={update} />
          <MoneyField label="NHIS or NHIA" field="nhis" value={values.nhis} update={update} />
          <MoneyField label="Other deductions" field="other" value={values.other} update={update} />
        </div>
        <button className="primary-button" type="submit">Check my payslip</button>
        <small>Your figures stay in this browser and are not uploaded.</small>
      </form>
      <section className={checked ? "payslip-result ready" : "payslip-result"} aria-live="polite">
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
            <span className="eyebrow light">What you’ll see</span>
            <h2>A simple comparison of your PAYE and take-home pay.</h2>
            <p>We’ll show the difference without storing your payslip figures.</p>
          </>
        )}
      </section>
    </div>
  );
}

function MoneyField({ label, field, value, update, required = false }: {
  label: string;
  field: Field;
  value: string;
  update: (field: Field, value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <div><span>₦</span><input inputMode="numeric" value={value} onChange={(event) => update(field, event.target.value)} placeholder="0" required={required} /></div>
    </label>
  );
}
