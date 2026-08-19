import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoFooter, InfoHeader } from "@/components/info-page";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import {
  estimatedMonthlyAfterPaye,
  formatJobDate,
  formatJobSalary,
  jobDeadlineLabel,
  monthlyGrossRange,
  type Job,
} from "@/lib/jobs";
import { getPublishedJobBySlug } from "@/lib/supabase";
import { siteUrl } from "@/lib/site";
import { JobActions } from "@/components/job-actions";

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = (await getPublishedJobBySlug(slug)) as Job | null;
  if (!job)
    return {
      title: "Job not found | SalarySabi",
      robots: { index: false, follow: false },
    };
  return {
    title: `${job.title} at ${job.company_name} | SalarySabi Jobs`,
    description: `${formatJobSalary(job)}. ${job.location}. View the listing source and current verification status before applying.`,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      title: `${job.title} at ${job.company_name}`,
      description: formatJobSalary(job),
      url: `/jobs/${job.slug}`,
      type: "website",
    },
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = (await getPublishedJobBySlug(slug)) as Job | null;
  if (!job) notFound();
  const gross = monthlyGrossRange(job);
  const sourceName = job.source_name || "listing source";
  const employerStatus = job.employer_verified ? "Employer confirmed" : "Employer confirmation pending";
  const descriptionParts = job.description.split(/(?<=[.!?])\s+(?=[A-Z])/).map((part) => part.trim()).filter(Boolean);
  const overview = descriptionParts[0];
  const keyDetails = descriptionParts.slice(1);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.published_at,
    validThrough: job.deadline_status === "unknown" || job.deadline_status === "rolling" ? undefined : `${job.expires_at}T23:59:59+01:00`,
    employmentType: job.employment_type.toUpperCase().replaceAll(" ", "_"),
    hiringOrganization: { "@type": "Organization", name: job.company_name },
    jobLocationType: job.work_mode === "remote" ? "TELECOMMUTE" : undefined,
    jobLocation:
      job.work_mode === "remote"
        ? undefined
        : {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location,
              addressCountry: "NG",
            },
          },
    applicantLocationRequirements:
      job.work_mode === "remote"
        ? { "@type": "Country", name: "Nigeria" }
        : undefined,
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: job.salary_currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary_min,
        maxValue: job.salary_max,
        unitText: job.salary_period === "monthly" ? "MONTH" : "YEAR",
      },
    },
    url: `${siteUrl}/jobs/${job.slug}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <InfoHeader />
      <article className="job-detail">
        <Link className="job-back" href="/jobs">
          Back to jobs
        </Link>
        <div className="job-detail-heading">
          <span>{job.company_name}</span>
          <h1>{job.title}</h1>
          <div className="job-meta">
            <span>{job.location}</span>
            <span>
              {job.work_mode === "onsite" ? "On-site" : job.work_mode}
            </span>
            <span>{job.employment_type}</span>
          </div>
        </div>
        <section className="job-pay-panel">
          <span>Advertised salary</span>
          <strong>{formatJobSalary(job)}</strong>
          {gross && (
            <>
              <span>Estimated income after PAYE only</span>
              <strong>
                {money.format(estimatedMonthlyAfterPaye(gross.minimum))}–
                {money.format(estimatedMonthlyAfterPaye(gross.maximum))} monthly
              </strong>
              <small>
                Shown only for confirmed Nigerian employee gross pay. Excludes
                pension, NHF, NHIS and other deductions.
              </small>
            </>
          )}
        </section>
        <section className="job-detail-description">
          <h2>About this job</h2>
          <p>{overview}</p>
          {keyDetails.length > 0 && <><h2>Key details</h2><ul>{keyDetails.map((detail) => <li key={detail}>{detail}</li>)}</ul></>}
        </section>
        <section className="job-source-panel">
          <div>
            <span>Listing status</span>
            <strong>{sourceName} · Checked {formatJobDate(job.source_verified_at)}</strong>
            <p>{employerStatus} · {jobDeadlineLabel(job)}</p>
          </div>
          <a
            className="primary-button"
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply on {sourceName}
            <ExternalLinkIcon />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </section>
        <JobActions jobId={job.id} />
      </article>
      <InfoFooter />
    </main>
  );
}
