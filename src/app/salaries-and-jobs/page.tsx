import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata = {
  title: "Nigerian Jobs with Pay | SalarySabi",
  description: "Find jobs that show the pay before you apply and track your applications.",
  alternates: { canonical: "/salaries-and-jobs" },
};

const paths = [
  ["01", "Find jobs with published pay", "/jobs"],
  ["02", "Track applications", "/account"],
];

export default function Page() {
  return (
    <PublicPageShell>
      <div className="product-hub product-hub--salary-jobs">
        <header>
          <span className="eyebrow">Apply. Keep track.</span>
          <h1>Find your next role</h1>
        </header>
        <section className="product-hub-paths" aria-label="Job tools">
          {paths.map(([number, title, href]) => (
            <Link href={href} key={href}>
              <span>{number}</span>
              <h2>{title}</h2>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </section>
      </div>
    </PublicPageShell>
  );
}
