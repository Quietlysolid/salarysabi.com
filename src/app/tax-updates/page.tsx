import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { pitGuidelinesReleaseUrl, pitGuidelinesUrl, rulesetVersion, taxActUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "PAYE Tax Rule Updates | SalarySabi",
  description: "See the current SalarySabi PAYE ruleset, independent review status and official Nigerian tax sources.",
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
  },
  {
    date: "29 July 2026",
    version: rulesetVersion,
    title: "Calculator checked after the JRB issued its 2026 PIT Guidelines",
    previous: "Initial SalarySabi implementation of the 2026 PAYE rules.",
    current: "Confirmed the graduated bands, eligible deductions, rent relief and minimum-wage exemption against official JRB guidance.",
    effective: "1 January 2026",
    source: "Nigeria Tax Act 2025, sections 30, 58 and 163(1)(t), and Fourth Schedule; JRB Guidelines 2026, paragraphs 8 to 9 and Appendices 1 and 4.",
  },
  {
    date: "7 April 2026",
    version: "Source release",
    title: "JRB Personal Income Tax Guidelines published",
    previous: "SalarySabi relied on the enacted Nigeria Tax Act 2025 and implementation material available before the guidelines were issued.",
    current: "Added the JRB's administrative guidance for PAYE, eligible deductions, rent relief and worked examples to the verification set.",
    effective: "Guidance issued 7 April 2026; underlying Act effective 1 January 2026",
    source: "Joint Revenue Board, Personal Income Tax Guidelines 2026.",
  },
];

function SourceDetails({ index, source }: { index: number; source: string }) {
  if (index === 0) {
    return (
      <>
        {source}{" "}
        <a href={taxActUrl} rel="noreferrer" target="_blank">Nigeria Tax Act</a>
        <span aria-hidden="true"> · </span>
        <a href={pitGuidelinesUrl} rel="noreferrer" target="_blank">JRB PAYE Guidelines</a>
      </>
    );
  }

  return (
    <>
      {source}{" "}
      <a href={pitGuidelinesReleaseUrl} rel="noreferrer" target="_blank">Official JRB release</a>
    </>
  );
}

function UpdateFields({ index }: { index: number }) {
  const update = updates[index];

  return (
    <dl className="changelog-fields">
      <div><dt>Before</dt><dd>{update.previous}</dd></div>
      <div><dt>Now</dt><dd>{update.current}</dd></div>
      <div><dt>Effective</dt><dd>{update.effective}</dd></div>
      <div><dt>Official source</dt><dd><SourceDetails index={index} source={update.source} /></dd></div>
    </dl>
  );
}

export default function TaxUpdatesPage() {
  const latestUpdate = updates[0];

  return (
    <InfoPage
      eyebrow="PAYE rules · Current"
      title="Your PAYE calculator stays current."
      intro="Checked against Nigeria's official tax rules. Independently reviewed 1 September 2026."
      heroAction={(
        <div className="tax-updates-hero-actions">
          <a className="primary-button" href="#latest-update">See what changed</a>
          <Link className="secondary-button" href="/how-paye-is-calculated#sources">View official sources</Link>
        </div>
      )}
    >
      <div className="trust-page changelog-page">
        <aside className="tax-update-proof" aria-label="Current PAYE rule status">
          <div><span>Ruleset</span><strong>{rulesetVersion}</strong></div>
          <div><span>Review</span><strong>Independent review complete</strong></div>
          <div><span>Sources</span><Link href="/how-paye-is-calculated#sources">Official sources linked</Link></div>
        </aside>

        <section className="changelog-section" aria-labelledby="change-history-heading">
          <header className="changelog-section-heading">
            <span className="eyebrow">Change history</span>
            <h2 id="change-history-heading">What changed</h2>
          </header>

          <div className="changelog-list">
            <article className="changelog-latest" id="latest-update">
              <div className="changelog-date"><time>{latestUpdate.date}</time><span>{latestUpdate.version}</span></div>
              <div><h3>{latestUpdate.title}</h3><UpdateFields index={0} /></div>
            </article>

            {updates.slice(1).map((update, offset) => {
              const index = offset + 1;
              return (
                <details className="changelog-history-entry" key={`${update.date}-${update.version}`}>
                  <summary>
                    <span className="changelog-summary-date"><time>{update.date}</time><span>{update.version}</span></span>
                    <strong>{update.title}</strong>
                    <span className="changelog-summary-toggle" aria-hidden="true" />
                  </summary>
                  <div className="changelog-history-content"><UpdateFields index={index} /></div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="trust-section trust-contact">
          <div><span className="eyebrow">Tax rule corrections</span><h2>Spotted a rule change?</h2></div>
          <a className="primary-button" href="mailto:tax@salarysabi.com?subject=Tax%20rule%20correction">Send the official source</a>
        </section>
      </div>
    </InfoPage>
  );
}
