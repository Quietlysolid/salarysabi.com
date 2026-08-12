"use client";

import Link from "next/link";
import { EarlyAccessForm } from "@/components/early-access-form";

const proposedCampaigns = [
  {
    kind: "Salary reports",
    reward: "Proposed: ₦500 per approved contribution",
    title: "Share an anonymous salary report",
    description: "Help SalarySabi build credible Nigerian salary benchmarks. Reports would be reviewed and only published in anonymous groups.",
    rule: "One proposed reward per person during the founding pilot.",
  },
  {
    kind: "Transparent job sources",
    reward: "Proposed total reward: to be confirmed",
    title: "Find a salary-transparent job",
    description: "Share a current vacancy from an employer’s official website where the salary is already visible.",
    rule: "The role would need to be open, original and independently verifiable.",
  },
];

export function ContributorProgram() {
  return <main className="contributor-page">
    <header className="contributor-hero"><span className="eyebrow">SalarySabi contributor pilot</span><h1>Share transparent jobs. Earn when they lead to hires.</h1><p>Join the waitlist for a proposed pilot with verified contributions and milestone-based rewards.</p></header>
    <section className="contributor-rules" aria-label="How the proposed contributor pilot would work">
      <article><span>01</span><h2>Find a transparent job</h2><p>Share an open role from the employer&apos;s official website where candidates can already see the salary.</p></article>
      <article><span>02</span><h2>SalarySabi verifies it</h2><p>We check the source, remove duplicates and publish only credible opportunities.</p></article>
      <article><span>03</span><h2>Earn through milestones</h2><p>If the funded pilot opens, rewards would follow verification, a confirmed hire and three-month retention.</p></article>
    </section>
    <section className="contributor-reward-model" aria-labelledby="contributor-reward-heading">
      <header><span className="eyebrow">Proposed job reward</span><h2 id="contributor-reward-heading">How the proposed job reward adds up.</h2><p>Earn 100% across three milestones. Employers confirm hiring and retention, so contributors are never asked to contact or monitor an employee.</p></header>
      <ol>
        <li><strong>20%</strong><div><span>Job verified and published</span><small>The vacancy is open, original, salary-transparent and independently verifiable.</small></div></li>
        <li><strong>30%</strong><div><span>Employer confirms a hire</span><small>The employer confirms that a SalarySabi-attributed application resulted in employment.</small></div></li>
        <li><strong>50%</strong><div><span>Employee completes three months</span><small>The employer confirms the three-month retention milestone.</small></div></li>
      </ol>
      <p className="contributor-pilot-status"><strong>Concept only.</strong> These are not active offers. No submissions or rewards are currently active. Final eligibility, attribution and payment terms would be published before a funded pilot opens.</p>
    </section>
    <div className="contributor-layout">
      <section className="contributor-campaigns"><div className="contributor-section-heading"><span className="eyebrow">Concept test</span><h2>Proposed founding campaigns</h2></div><div>{proposedCampaigns.map(c=><article key={c.kind}><div><span>{c.kind}</span><strong>{c.reward}</strong></div><h3>{c.title}</h3><p>{c.description}</p><p className="campaign-eligibility">{c.rule}</p></article>)}</div></section>
      <aside className="contributor-account" id="contributor-interest"><span className="eyebrow">Pilot waitlist</span><h2>Be first to know if the pilot opens.</h2><p>Join the waitlist and we will send one email with the final rules if SalarySabi activates a funded pilot.</p><EarlyAccessForm source="contributor_program" idPrefix="contributor" label="Email address" placeholder="you@example.com" buttonText="Join the pilot waitlist" successMessage="You are on the pilot waitlist. We will contact you only if the contributor pilot opens." /></aside>
    </div>
    <aside className="contributor-boundary"><div><span className="eyebrow">Contribute now</span><h2>Prefer to help without joining the pilot?</h2><p>Anonymous salary reporting remains open and unpaid.</p></div><Link href="/salaries">Share a salary report →</Link></aside>
  </main>;
}
