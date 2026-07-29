"use client";

import { useState } from "react";
import { track } from "@/components/analytics";

export function DemandSignals() {
  const [noted, setNoted] = useState(false);

  function chooseVerification() {
    track("verify_interest");
    setNoted(true);
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
      {noted && (
        <p className="interest-confirmation" role="status">
          Thanks. Your interest was counted. Payslip verification is being
          considered for the next release.
        </p>
      )}
    </section>
  );
}
