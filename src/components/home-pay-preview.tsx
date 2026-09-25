"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { checkPayslip } from "@/lib/payslip";

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });

export function HomePayAction() {
  return <a className="landing-primary-action" href="#home-gross" onClick={(event) => {
    const input = document.getElementById("home-gross") as HTMLInputElement | null;
    if (!input) return;
    event.preventDefault();
    input.focus({ preventScroll: true });
    input.select();
    input.scrollIntoView({ block: "center", behavior: "instant" });
  }}>Calculate my pay <ArrowRight aria-hidden="true" /></a>;
}

export function HomePayPreview() {
  const [gross, setGross] = useState("300,000");
  const [isExample, setIsExample] = useState(true);
  const amount = Number(gross.replaceAll(",", ""));
  const valid = /^\d+(\.\d{0,2})?$/.test(gross.replaceAll(",", "")) && amount > 0 && amount <= 1_000_000_000;
  const result = valid ? checkPayslip({ monthlyGross: amount, monthlyPaye: 0 }) : null;
  const [storageError, setStorageError] = useState(false);

  return <section className="home-pay-preview" aria-labelledby="home-preview-title">
    <header><span className="eyebrow">YOUR PAY, AT A GLANCE</span><span className="home-preview-badge">2026 estimate</span></header>
    <h2 id="home-preview-title">What lands in your account?</h2>
    <label htmlFor="home-gross">Monthly salary before deductions</label>
    <small id="home-preview-example" className="home-preview-example">{isExample ? "Example salary. Enter yours to try it." : "Your monthly gross salary in naira."}</small>
    <div className="home-preview-input"><span aria-hidden="true">₦</span><input id="home-gross" inputMode="decimal" value={gross} onChange={(event) => { setGross(event.target.value); setIsExample(false); }} onBlur={() => { if (valid) setGross(new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(amount)); }} aria-describedby="home-preview-example home-preview-assumptions" aria-invalid={gross !== "" && !valid} maxLength={18} /></div>
    <div className="home-preview-result" aria-live="polite" aria-atomic="true">
      <div><span>Estimated monthly PAYE</span><strong>{result ? money.format(result.expectedMonthlyPaye) : "—"}</strong></div>
      <div className="home-preview-net"><span>Estimated take-home</span><strong>{result ? money.format(result.expectedTakeHome) : "—"}</strong></div>
    </div>
    <p id="home-preview-assumptions">PAYE only. Add pension, rent relief and other deductions for a fuller estimate.</p>
    {!valid && gross !== "" && <p role="status">Enter a monthly salary between ₦0.01 and ₦1 billion.</p>}
    <Link className="home-preview-continue" href={valid ? "/calculator?from=home" : "/calculator"} onClick={(event) => {
      if (!valid) return;
      try { window.sessionStorage.setItem("salarysabi:home-gross", String(amount)); }
      catch { event.preventDefault(); setStorageError(true); }
    }}>Add deductions &amp; reliefs <ArrowRight aria-hidden="true" size={18} /></Link>
    {storageError && <p role="status">Your browser could not carry this amount over. <Link href="/calculator">Open the calculator</Link> and enter it there.</p>}
  </section>;
}
