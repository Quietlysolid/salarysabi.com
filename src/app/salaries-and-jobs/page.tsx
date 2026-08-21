import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata = {
  title: "Nigerian Salaries and Jobs with Pay | SalarySabi",
  description: "Compare Nigerian salaries or find jobs that show the pay before you apply.",
  alternates: { canonical: "/salaries-and-jobs" },
};

const paths = [
  ["01", "Compare salaries", "See reviewed ranges for similar roles as the public dataset grows.", "/salaries"],
  ["02", "Find jobs with published pay", "See the offered salary and source before you apply.", "/jobs"],
  ["03", "Track applications", "Save jobs and keep your application progress in one workspace.", "/account"],
];

export default function Page() {
  return (
    <PublicPageShell>
      <div className="product-hub product-hub--salary-jobs">
        <header>
          <span className="eyebrow">Compare. Apply. Keep track.</span>
          <h1>Jobs &amp; salaries</h1>
          <p>Understand what roles pay, find openings that publish salary information and organise your next move.</p>
        </header>
        <section className="product-hub-paths" aria-label="Salary and job tools">
          {paths.map(([number, title, description, href]) => (
            <Link href={href} key={href}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{description} <span aria-hidden="true">→</span></p>
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
