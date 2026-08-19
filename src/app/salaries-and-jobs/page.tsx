import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata = {
  title: "Nigerian Salaries and Jobs with Pay | SalarySabi",
  description: "Compare Nigerian salaries or find jobs that show the pay before you apply.",
  alternates: { canonical: "/salaries-and-jobs" },
};

const paths = [
  ["Compare salaries", "See what similar roles pay.", "/salaries"],
  ["Find jobs", "See salaries before applying.", "/jobs"],
];

export default function Page() {
  return (
    <PublicPageShell>
      <main className="product-hub product-hub--salary-jobs">
        <header>
          <h1>Salaries &amp; jobs</h1>
        </header>
        <section className="product-hub-paths" aria-label="Salary and job tools">
          {paths.map(([title, description, href]) => (
            <Link href={href} key={href}>
              <h2>{title}</h2>
              <p>{description} <span aria-hidden="true">→</span></p>
            </Link>
          ))}
        </section>
        <p className="product-hub-secondary">
          <Link href="/account">Track applications <span aria-hidden="true">→</span></Link>
        </p>
        <aside className="product-hub-note product-hub-note--compact">
          <Link href="/salaries">Share salary</Link>
          <span aria-hidden="true">·</span>
          <Link href="/suggest-a-job">Share job</Link>
        </aside>
      </main>
    </PublicPageShell>
  );
}
