import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  FileText,
  PieChart,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { InfoFooter, InfoHeader } from "@/components/info-page";

export type Audience = "talent" | "employer";

const audienceContent = {
  talent: {
    eyebrow: "For talent",
    title: <>Know your actual salary.</>,
    image: "/images/salarysabi-option2-talent-hero.png",
    imageAlt: "Nigerian professional reviewing an offer letter beside her laptop",
    actions: [
      { href: "/payslip-checker", label: "Calculate & verify pay", icon: Calculator, primary: true },
      { href: "/salaries", label: "Find salary ranges", icon: ChartNoAxesCombined, primary: false },
      { href: "/jobs", label: "Find jobs with published pay", icon: BriefcaseBusiness, primary: false },
    ],
  },
  employer: {
    eyebrow: "For employers",
    title: <>Hire like you<br />have nothing to hide.</>,
    image: "/images/salarysabi-option2-employer-hero.png",
    imageAlt: "Two Nigerian small-business owners reviewing payroll on a laptop",
    actions: [
      { href: "/payroll", label: "Run payroll", icon: FileText, primary: true },
      { href: "/company-tax", label: "Plan company tax", icon: PieChart, primary: false },
      { href: "/post-a-job", label: "Post a salary-transparent role", icon: UsersRound, primary: false },
    ],
  },
} as const;

function GatewayHeader() {
  return (
    <header className="split-gateway-header">
      <Link aria-label="SalarySabi home" className="split-gateway-brand" href="/"><BrandWordmark /></Link>
    </header>
  );
}

function AudienceChoice({ audience }: { audience: Audience }) {
  const content = audienceContent[audience];
  const href = audience === "talent" ? "/talent" : "/payroll";

  return (
    <article className={`gateway-choice gateway-choice--${audience}`}>
      <Image
        alt={content.imageAlt}
        fill
        priority
        sizes="(max-width: 760px) 100vw, 50vw"
        src={content.image}
      />
      <div className="gateway-choice-content">
        <span className="gateway-choice-eyebrow">{content.eyebrow}</span>
        <h2>{audience === "talent" ? "Know your actual salary." : "Pay people right. Prove it."}</h2>
        <p>{audience === "talent" ? "Salary na promise. Take-home na reality." : "Hire like you have nothing to hide."}</p>
      </div>
      {audience === "talent" ? <PayPreview /> : <PayrollPreview compact />}
      <a className="gateway-choice-action" href={href}>
        {audience === "talent" ? "Understand my pay" : "Run my payroll"} <ArrowRight aria-hidden="true" />
      </a>
    </article>
  );
}

export function SplitGatewayHome() {
  return (
    <div className="split-gateway-shell">
      <GatewayHeader />
      <main className="audience-gateway" id="main-content" tabIndex={-1}>
        <section aria-label="Choose how you want to use SalarySabi" className="gateway-choices">
          <AudienceChoice audience="talent" />
          <AudienceChoice audience="employer" />
        </section>
      </main>
      <nav aria-label="Helpful links" className="gateway-utility-links">
        <Link href="/paye-guide">Learn</Link>
        <Link href="/contributors">Contribute</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/tax-updates">Inspect the rules</Link>
      </nav>
    </div>
  );
}

function PayPreview() {
  return (
    <div className="gateway-pay-preview gateway-motion-sequence" aria-label="Example take-home pay calculation">
      <div className="gateway-motion-step gateway-motion-step--1"><span>Gross salary</span><strong>{"\u20A6500,000"}</strong></div>
      <ArrowDown className="gateway-motion-connector gateway-motion-connector--1" aria-hidden="true" />
      <div className="gateway-paye gateway-motion-step gateway-motion-step--2"><span>PAYE</span><strong>{"\u2212\u20A672,500"}</strong></div>
      <ArrowDown className="gateway-motion-connector gateway-motion-connector--2" aria-hidden="true" />
      <div className="gateway-take-home gateway-motion-step gateway-motion-step--3"><span>Take-home pay</span><strong>{"\u20A6427,500"}</strong></div>
    </div>
  );
}

function PayrollPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    ["Adaeze M.", "500,000", "72,500", "427,500"],
    ["Tunde O.", "350,000", "45,500", "304,500"],
    ["Ngozi I.", "280,000", "32,900", "247,100"],
  ];

  if (compact) return (
    <div className="gateway-payroll-preview gateway-payroll-preview--compact" aria-label="Example August 2026 payroll summary" role="group">
      <header><strong>August payroll ready</strong><span>Aug 2026</span></header>
      <div className="gateway-payroll-summary">
        <strong>3 employees</strong>
        <span>PAYE calculated · Net pay confirmed</span>
      </div>
    </div>
  );

  return (
    <div className="gateway-payroll-preview" aria-label="Example August 2026 payroll record" role="table">
      <header><strong>Payroll record</strong><span>Aug 2026</span></header>
      <div className="gateway-payroll-row gateway-payroll-head" role="row">
        <span role="columnheader">Employee</span><span role="columnheader">Gross ({"\u20A6"})</span><span role="columnheader">PAYE ({"\u20A6"})</span><span role="columnheader">Net ({"\u20A6"})</span>
      </div>
      {rows.map((row, index) => (
        <div className={`gateway-payroll-row gateway-payroll-row--${index + 1}`} key={row[0]} role="row">
          {row.map((cell) => <span key={cell} role="cell">{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function TalentStory() {
  return (
    <div className="talent-story">
      <div className="talent-story-inner">
        <header className="talent-story-heading">
          <span>From offer letter to bank alert.</span>
          <h1>Everything about your pay in one place.</h1>
          <p>SalarySabi helps you calculate your take-home pay, compare salaries, and find jobs that publish the pay.</p>
          <Link className="talent-primary-link" href="/payslip-checker">Calculate my pay <ArrowRight aria-hidden="true" /></Link>
        </header>

        <div className="talent-story-paths">
          <article>
            <span className="talent-story-icon"><Calculator aria-hidden="true" /></span>
            <div>
              <h2>Calculate your pay</h2>
              <p>See your PAYE, deductions, and take-home pay.</p>
              <Link href="/payslip-checker">Calculate pay <ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
          <article>
            <span className="talent-story-icon"><ChartNoAxesCombined aria-hidden="true" /></span>
            <div>
              <h2>Compare salaries</h2>
              <p>See verified salary ranges for roles like yours.</p>
              <Link href="/salaries">Compare salaries <ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
          <article>
            <span className="talent-story-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <div>
              <h2>Find jobs with published pay</h2>
              <p>Know the salary and original source before applying.</p>
              <Link href="/jobs">Explore jobs <ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
        </div>

        <aside className="talent-trust-strip">
          <ShieldCheck aria-hidden="true" />
          <strong>Built on Nigeria&apos;s official tax rules.</strong>
          <Link href="/tax-updates">Inspect the rules <ArrowRight aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}

function EmployerStory() {
  return (
    <section aria-labelledby="employer-home-title" className="employer-editorial-hero">
      <Image
        alt="Two Nigerian small-business owners reviewing payroll on a laptop"
        fill
        priority
        sizes="100vw"
        src="/images/salarysabi-option2-employer-hero.png"
      />
      <div className="employer-editorial-copy">
        <span>For employers</span>
        <h1 id="employer-home-title">Hire like you have nothing to hide.</h1>
        <p>Payroll records, company tax estimates and job posts that show the salary. Built for teams small enough that the payroll officer is also you.</p>
        <nav aria-label="For employers tools" className="employer-editorial-actions">
          <Link className="employer-primary-action" href="/payroll"><FileText aria-hidden="true" />Run payroll <ArrowRight aria-hidden="true" /></Link>
          <Link href="/company-tax"><PieChart aria-hidden="true" />Plan company tax <ArrowRight aria-hidden="true" /></Link>
          <Link href="/post-a-job"><UsersRound aria-hidden="true" />Post open roles <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </div>
      <PayrollPreview />
    </section>
  );
}

export function AudienceHome({ audience }: { audience: Audience }) {
  const content = audienceContent[audience];

  return (
    <div className={`public-page-shell audience-home audience-home--${audience}`}>
      <InfoHeader />
      <main id="main-content" tabIndex={-1}>
        {audience === "talent" ? (
          <section aria-label="Talent at work" className="audience-home-hero audience-home-hero--talent-content">
            <Image alt={content.imageAlt} fill priority sizes="100vw" src={content.image} />
            <TalentStory />
          </section>
        ) : null}
        {audience === "employer" ? <EmployerStory /> : null}
      </main>
      <InfoFooter />
    </div>
  );
}
