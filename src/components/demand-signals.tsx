"use client";

import { useState } from "react";
import { track } from "@/components/analytics";
import { EarlyAccessForm } from "@/components/early-access-form";

export function DemandSignals() {
  const [showPayslipSignup, setShowPayslipSignup] = useState(false);

  function chooseVerification() {
    track("verify_interest");
    setShowPayslipSignup(true);
  }

  function choosePayroll() {
    track("payroll_interest");
    document.getElementById("early-access")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <section className="demand-signals" aria-labelledby="next-need-title">
      <div>
        <span className="eyebrow">Help shape what comes next</span>
        <h2 id="next-need-title">What brought you here today?</h2>
        <p>Choose the option closest to what you need.</p>
      </div>
      <div className="demand-actions">
        <button type="button" onClick={chooseVerification}>
          <span>For employees</span>
          <strong>I want to check my payslip</strong>
        </button>
        <button type="button" onClick={choosePayroll}>
          <span>For employers</span>
          <strong>I need payroll for my team</strong>
        </button>
      </div>
      {showPayslipSignup && (
        <div className="employee-interest-panel">
          <div>
            <strong>Want to know when payslip checking is ready?</strong>
            <p>Leave your email and we will send one launch update.</p>
          </div>
          <EarlyAccessForm
            source="payslip_checker"
            idPrefix="payslip"
            label="Email me when it launches"
            placeholder="you@email.com"
            buttonText="Notify me"
            successMessage="You are on the payslip-checker list."
          />
        </div>
      )}
    </section>
  );
}
