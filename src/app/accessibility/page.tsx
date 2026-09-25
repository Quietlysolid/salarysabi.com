import type { Metadata } from "next";
import { InfoFooter } from "@/components/info-page";
import { GatewayHeader } from "@/components/split-gateway-home";

export const metadata: Metadata = {
  title: "Accessibility | SalarySabi",
  description: "Our approach to accessibility, current testing status and how to get help.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return <div className="split-gateway-shell terms-page-shell">
    <GatewayHeader />
    <main id="main-content" tabIndex={-1}>
      <article className="terms-document accessibility-document" aria-labelledby="accessibility-title">
        <header className="terms-heading">
          <h1 id="accessibility-title">Accessibility</h1>
          <p className="terms-date">Last updated: <time dateTime="2026-09-24">24 September 2026</time></p>
        </header>
        <div className="terms-body terms-full-text">
          <section aria-labelledby="approach-title">
            <h2 id="approach-title">Our approach</h2>
            <p>We aim to make SalarySabi usable with keyboards, screen readers and different screen sizes. Our approach includes clear headings, labelled fields, visible keyboard focus and messages that do not rely on colour alone.</p>
          </section>
          <section aria-labelledby="testing-title">
            <h2 id="testing-title">Testing and limitations</h2>
            <p>We have not completed a full accessibility audit or confirmed that every part of the site meets the Web Content Accessibility Guidelines (WCAG).</p>
            <p>Downloaded PDFs and spreadsheets have not been fully checked for accessibility. Tell us if you have trouble using them.</p>
          </section>
          <section aria-labelledby="help-title">
            <h2 id="help-title">Get help</h2>
            <p>Email <a href="mailto:hello@salarysabi.com?subject=Accessibility%20help">hello@salarysabi.com</a> with the page address and what you were unable to do. You can also ask for help accessing information in another format.</p>
            <p>If known, include your browser or assistive technology. These details are optional. Do not send passwords, payslips, bank details or payroll records.</p>
          </section>
        </div>
      </article>
    </main>
    <InfoFooter />
  </div>;
}
