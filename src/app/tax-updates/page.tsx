import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { pitGuidelinesReleaseUrl, pitGuidelinesUrl, rulesetVersion, taxActUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tax Rules Changelog | SalarySabi",
  description: "A dated record of tax-rule and PAYE calculator changes made by SalarySabi.",
  alternates: { canonical: "/tax-updates" },
};

const updates = [
  {
    date: "1 September 2026",
    version: rulesetVersion,
    title: "Full PAYE methodology independently reviewed",
    previous: "SalarySabi's maintainer had verified the implementation against the official Act and JRB guidance.",
    current: "A Nigerian tax professional independently reviewed the full PAYE calculation methodology, supported deductions, tax bands, exemptions, rent relief, payroll outputs and documented limitations.",
    effective: "Review completed 1 September 2026",
    source: "Nigeria Tax Act 2025 and JRB Personal Income Tax Guidelines 2026.",
    effect: "The review confirmed the current implementation. No calculation correction was required.",
    maintainer: "Independent Nigerian tax professional (name withheld)",
  },
  {
    date: "29 July 2026",
    version: rulesetVersion,
    title: "Calculator checked after the JRB issued its 2026 PIT Guidelines",
    previous: "Initial SalarySabi implementation of the 2026 PAYE rules.",
    current: "Confirmed the graduated bands, eligible deductions, rent relief and minimum-wage exemption against official JRB guidance.",
    effective: "1 January 2026",
    source: "Nigeria Tax Act 2025, sections 30, 58 and 163(1)(t), and Fourth Schedule; JRB Guidelines 2026, paragraphs 8–9 and Appendices 1 and 4.",
    effect: "No calculation correction was required after verification.",
    maintainer: "Ozichi Nwosu",
  },
  {
    date: "7 April 2026",
    version: "Source release",
    title: "JRB Personal Income Tax Guidelines published",
    previous: "SalarySabi relied on the enacted Nigeria Tax Act 2025 and implementation material available before the guidelines were issued.",
    current: "Added the JRB's administrative guidance for PAYE, eligible deductions, rent relief and worked examples to the verification set.",
    effective: "Guidance issued 7 April 2026; underlying Act effective 1 January 2026",
    source: "Joint Revenue Board, Personal Income Tax Guidelines 2026.",
    effect: "This document is the main administrative guide used to check SalarySabi's 2026 implementation.",
    maintainer: "Ozichi Nwosu",
  },
];

export default function TaxUpdatesPage() {
  return (
    <InfoPage eyebrow="Tax changelog" title="Tax rules change. We keep the calculator current." intro="This page records each PAYE update, when it took effect, the official source and whether the calculation changed.">
      <div className="trust-page changelog-page">
        <aside className="trust-status"><div><span>Current calculator ruleset</span><strong>{rulesetVersion}</strong></div><Link href="/how-paye-is-calculated#sources">Check the source documents</Link></aside>
        <div className="changelog-list">
          {updates.map((update, index) => <article key={`${update.date}-${update.version}`}><div className="changelog-date"><time>{update.date}</time><span>{update.version}</span></div><div><h2>{update.title}</h2><dl className="changelog-fields"><div><dt>Previous rule</dt><dd>{update.previous}</dd></div><div><dt>New or confirmed rule</dt><dd>{update.current}</dd></div><div><dt>Effective date</dt><dd>{update.effective}</dd></div><div><dt>Source</dt><dd>{update.source} {index === 0 ? <><a href={taxActUrl} rel="noreferrer" target="_blank">Open Act</a> · <a href={pitGuidelinesUrl} rel="noreferrer" target="_blank">Open Guidelines</a></> : <a href={pitGuidelinesReleaseUrl} rel="noreferrer" target="_blank">Open JRB release</a>}</dd></div><div><dt>Effect on calculations</dt><dd>{update.effect}</dd></div><div><dt>Maintainer</dt><dd>{update.maintainer}</dd></div></dl></div></article>)}
        </div>
        <section className="trust-section trust-contact"><div><span className="eyebrow">Spot a change we missed?</span><h2>Send us the official source.</h2></div><a className="primary-button" href="mailto:tax@salarysabi.com?subject=Tax%20rule%20correction">Report a tax-rule update</a></section>
      </div>
    </InfoPage>
  );
}
