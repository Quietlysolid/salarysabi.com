import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Accessibility | SalarySabi",
  description: "SalarySabi's accessibility commitment, known limitations and feedback route.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return <InfoPage eyebrow="Accessibility" title="Salary information should work for everybody." intro="SalarySabi should work across devices, input methods and assistive technologies. That is the standard we are working toward.">
    <div className="legal-sections">
      <section><h2>What we work toward</h2><p>We use semantic headings, labelled fields, keyboard-operable controls, visible focus styles, plain language, responsive layouts and status messages that do not rely on colour alone.</p></section>
      <section><h2>Supported browsers</h2><p>SalarySabi is designed for current versions of Chrome, Edge, Firefox and Safari on desktop and mobile. Older browsers may not support every feature or visual detail.</p></section>
      <section><h2>Known limitations</h2><p>SalarySabi has not yet completed an independent WCAG conformance audit or full testing across every screen reader and browser combination. Downloaded PDF and spreadsheet exports may provide less navigation structure than the website.</p><p>Interactive job and account features can also change as those tools develop. We will record confirmed accessibility issues and material fixes here.</p></section>
      <section><h2>Report a problem</h2><p>Email <a href="mailto:hello@salarysabi.com?subject=Accessibility%20feedback">hello@salarysabi.com</a>. Tell us the page, what you were trying to do, your browser or assistive technology, and what went wrong. Do not include sensitive salary or identity information.</p></section>
    </div>
  </InfoPage>;
}
