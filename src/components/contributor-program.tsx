"use client";

import Link from "next/link";
import { useState } from "react";

export function ContributorProgram() {
  const [rulesOpen, setRulesOpen] = useState(false);

  function showEligibility() {
    setRulesOpen(true);
    window.setTimeout(() => document.getElementById("pilot-rules")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  return <main className="contributor-page salary-reward-page simplified-reward-page">
    <header className="contributor-hero">
      <h1>Share your salary. Earn ₦1,000.</h1>
      <p>Anonymous · About 2 minutes · Only the first 20 approved reports qualify</p>
      <div className="contributor-hero-actions">
        <button className="primary-button" onClick={showEligibility} type="button">Check eligibility</button>
      </div>
    </header>

    <section className="contributor-rules" aria-label="How it works">
      <article><span>01</span><h2>Answer questions</h2></article>
      <article><span>02</span><h2>We review</h2></article>
      <article><span>03</span><h2>Get ₦1,000</h2></article>
    </section>

    <details className="reward-rules-disclosure" id="pilot-rules" open={rulesOpen} onToggle={(event) => setRulesOpen(event.currentTarget.open)}>
      <summary>Who qualifies and what approval means <span aria-hidden="true">+</span></summary>
      <div>
        <ul>
          <li>The salary must be your own current or recent Nigerian employment income.</li>
          <li>Required answers must be complete and internally plausible.</li>
          <li>Duplicate, fabricated or identifying submissions are rejected.</li>
          <li>One paid report per person; the offer closes after 20 approvals.</li>
          <li>Your individual salary is never published. A benchmark needs five similar approved reports.</li>
        </ul>
        <Link className="primary-button reward-rules-cta" href="/salaries?campaign=salary-pilot-2026#salary-report">Share my salary</Link>
      </div>
    </details>
  </main>;
}
