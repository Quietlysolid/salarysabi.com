import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Accessibility | SalarySabi",
  description: "SalarySabi's accessibility commitment, known limitations and feedback route.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return <InfoPage title="Accessibility" intro="SalarySabi is designed to work with keyboards, screen readers and different screen sizes.">
    <div className="legal-sections accessibility-sections">
      <section><h2>What we support</h2><p>Clear headings, labelled fields, visible focus states, keyboard controls, plain language and messages that do not rely on colour alone.</p></section>
      <section><h2>Known limitations</h2><p>An independent WCAG audit has not yet been completed. Downloaded files may be less accessible than the website.</p></section>
      <section><h2>Report a problem</h2><p>Email <a href="mailto:hello@salarysabi.com?subject=Accessibility%20feedback">hello@salarysabi.com</a> with the page, what you tried to do, and your browser or assistive technology. Do not include sensitive information.</p></section>
    </div>
  </InfoPage>;
}
