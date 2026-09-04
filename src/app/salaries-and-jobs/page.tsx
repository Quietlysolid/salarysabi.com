import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata = {
  title: "Nigerian Salaries and Jobs with Pay | SalarySabi",
  description: "Compare Nigerian salaries or find jobs that show the pay before you apply.",
  alternates: { canonical: "/salaries-and-jobs" },
};

const paths = [
  ["01", "Compare salaries", "/salaries"],
  ["02", "Find jobs with published pay", "/jobs"],
  ["03", "Track applications", "/account"],
];

export default function Page() {
  return (
    <PublicPageShell>
      <div className="product-hub product-hub--salary-jobs">
        <header>
          <span className="eyebrow">Compare. Apply. Keep track.</span>
          <h1>Jobs &amp; salaries</h1>
        </header>
        <section className="product-hub-paths" aria-label="Salary and job tools">
          {paths.map(([number, title, href]) => (
            <Link href={href} key={href}>
              <span>{number}</span>
              <h2>{title}</h2>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </section>
        <aside className="product-hub-note product-hub-note--compact">
          <div>
            <span className="eyebrow">Help the public data grow</span>
            <strong>Share genuine pay information for SalarySabi to review.</strong>
          </div>
          <div>
            <Link href="/contributors">See funded offers</Link>
            <Link href="/suggest-a-job">Suggest a job</Link>
          </div>
        </aside>
      </div>
    </PublicPageShell>
  );
}
