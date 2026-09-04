import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  FileText,
  Landmark,
  PieChart,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { InfoFooter, InfoHeader } from "@/components/info-page";
import { MobileNavigation, SiteNavigation } from "@/components/site-navigation";

export type Audience = "talent" | "employer";

const audienceContent = {
  talent: {
    image: "/images/salarysabi-faceless-talent-v3.png",
    imageAlt: "Hands checking a Nigerian take-home pay result on a phone",
  },
  employer: {
    image: "/images/salarysabi-faceless-employer-v3.png",
    imageAlt: "Hands reviewing and approving a Nigerian payroll on a tablet",
  },
} as const;

function GatewayHeader() {
  return (
    <header className="split-gateway-header">
      <div className="split-gateway-header-inner">
        <Link aria-label="SalarySabi home" className="split-gateway-brand" href="/"><BrandWordmark /></Link>
        <SiteNavigation />
        <Link className="split-gateway-header-action" href="/payslip-checker">Calculate pay</Link>
        <MobileNavigation />
      </div>
    </header>
  );
}

const gatewayToolGroups = [
  {
    title: "Pay & tax",
    icon: Calculator,
    links: [
      ["Calculate take-home pay", "/payslip-checker"],
      ["Check my payslip", "/payslip-checker"],
      ["Understand PAYE", "/paye-guide"],
    ],
  },
  {
    title: "Salaries & jobs",
    icon: BriefcaseBusiness,
    links: [
      ["Compare salaries", "/salaries"],
      ["Find jobs with pay", "/jobs"],
      ["Track applications", "/account"],
    ],
  },
  {
    title: "Employer tools",
    icon: Landmark,
    links: [
      ["Run payroll", "/payroll"],
      ["Plan company tax", "/company-tax"],
      ["Post an open role", "/post-a-job"],
    ],
  },
] as const;

export function SplitGatewayHome() {
  return (
    <div className="split-gateway-shell">
      <GatewayHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="gateway-intro" aria-labelledby="gateway-title">
          <div className="gateway-intro-copy">
            <h1 id="gateway-title">Pay should<br />be clear.</h1>
            <span aria-hidden="true" className="gateway-intro-accent" />
            <nav aria-label="Choose how you use SalarySabi" className="gateway-intro-actions">
              <Link href="/talent">I earn a salary <ArrowRight aria-hidden="true" /></Link>
              <Link href="/employers">I manage payroll <ArrowRight aria-hidden="true" /></Link>
            </nav>
          </div>
          <div className="gateway-intro-images" aria-label="SalarySabi for employees and employers">
            <div className="gateway-intro-image gateway-intro-image--talent">
              <Image alt={audienceContent.talent.imageAlt} fill priority sizes="(max-width: 760px) 44vw, 300px" src={audienceContent.talent.image} />
            </div>
            <div className="gateway-intro-image gateway-intro-image--employer">
              <Image alt={audienceContent.employer.imageAlt} fill priority sizes="(max-width: 760px) 54vw, 340px" src={audienceContent.employer.image} />
            </div>
          </div>
        </section>

        <section aria-labelledby="gateway-paths-title" className="gateway-paths">
          <div className="gateway-paths-inner">
            <header><span id="gateway-paths-title">Choose your path</span></header>
            <div className="gateway-path-list">
              <Link href="/talent">
                <span className="gateway-path-icon"><Calculator aria-hidden="true" /></span>
                <span><small>For talent</small><strong>Understand<br />my pay</strong></span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/employers">
                <span className="gateway-path-icon"><UsersRound aria-hidden="true" /></span>
                <span><small>For employers</small><strong>Manage my<br />team&apos;s pay</strong></span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="SalarySabi tools" className="gateway-directory">
          {gatewayToolGroups.map(({ title, icon: Icon, links }) => (
            <section key={title} aria-labelledby={`gateway-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <header><Icon aria-hidden="true" /><h2 id={`gateway-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{title}</h2></header>
              <nav aria-label={title}>
                {links.map(([label, href]) => <Link href={href} key={label}><span>{label}</span><ArrowRight aria-hidden="true" /></Link>)}
              </nav>
            </section>
          ))}
        </section>
      </main>
      <InfoFooter />
    </div>
  );
}

function TalentStory() {
  return (
    <div className="talent-story">
      <div className="talent-story-inner">
        <section aria-labelledby="talent-home-title" className="audience-editorial-hero audience-editorial-hero--talent">
          <header className="talent-story-heading">
            <span>From offer letter to bank alert.</span>
            <h1 id="talent-home-title">Everything about your pay in one place.</h1>
            <Link className="talent-primary-link" href="/payslip-checker">Calculate my pay <ArrowRight aria-hidden="true" /></Link>
          </header>
          <div className="audience-editorial-media">
            <Image alt={audienceContent.talent.imageAlt} fill priority sizes="(max-width: 760px) calc(100vw - 36px), 470px" src={audienceContent.talent.image} />
          </div>
        </section>

        <div className="talent-story-paths">
          <article>
            <span className="talent-story-icon"><Calculator aria-hidden="true" /></span>
            <div>
              <h2>Calculate your pay</h2>
              <Link href="/payslip-checker">Calculate pay <ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
          <article>
            <span className="talent-story-icon"><ChartNoAxesCombined aria-hidden="true" /></span>
            <div>
              <h2>Compare salaries</h2>
              <Link href="/salaries">Compare salaries <ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
          <article>
            <span className="talent-story-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <div>
              <h2>Find jobs with published pay</h2>
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
    <section aria-labelledby="employer-home-title" className="audience-editorial-hero audience-editorial-hero--employer employer-editorial-hero">
      <div className="employer-editorial-copy">
        <span>For employers</span>
        <h1 id="employer-home-title">Hire like you have nothing to hide.</h1>
        <nav aria-label="For employers tools" className="employer-editorial-actions">
          <Link className="employer-primary-action" href="/payroll"><FileText aria-hidden="true" />Run payroll <ArrowRight aria-hidden="true" /></Link>
          <Link href="/company-tax"><PieChart aria-hidden="true" />Plan company tax <ArrowRight aria-hidden="true" /></Link>
          <Link href="/post-a-job"><UsersRound aria-hidden="true" />Post open roles <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </div>
      <div className="audience-editorial-media">
        <Image alt={audienceContent.employer.imageAlt} fill priority sizes="(max-width: 760px) calc(100vw - 36px), 500px" src={audienceContent.employer.image} />
      </div>
    </section>
  );
}

export function AudienceHome({ audience }: { audience: Audience }) {
  return (
    <div className={`public-page-shell audience-home audience-home--${audience}`}>
      <InfoHeader />
      <main id="main-content" tabIndex={-1}>
        {audience === "talent" ? (
          <TalentStory />
        ) : null}
        {audience === "employer" ? <EmployerStory /> : null}
      </main>
      <InfoFooter />
    </div>
  );
}
