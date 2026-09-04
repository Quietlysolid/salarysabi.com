import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type JourneyNextStep = {
  href: string;
  title: string;
  description: string;
};

export function JourneyNextSteps({
  title,
  steps,
}: {
  title: string;
  description?: string;
  steps: JourneyNextStep[];
}) {
  return (
    <section className="journey-next-steps" aria-labelledby={`journey-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <header>
        <span className="eyebrow">What to do next</span>
        <h2 id={`journey-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{title}</h2>
      </header>
      <div>
        {steps.map((step) => (
          <Link href={step.href} key={step.href}>
            <span>
              <strong>{step.title}</strong>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
