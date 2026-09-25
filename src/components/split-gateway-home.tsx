import { HomePayAction, HomePayPreview } from "@/components/home-pay-preview";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Calculator,
  BriefcaseBusiness,
  Users,
  Building2,
  ClipboardList,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { InfoFooter } from "@/components/info-page";
import { MobileNavigation, SiteNavigation } from "@/components/site-navigation";

export type Audience = "talent" | "employer";

export function GatewayHeader() {
  return (
    <header className="split-gateway-header">
      <div className="split-gateway-header-inner">
        <Link aria-label="SalarySabi home" className="split-gateway-brand" href="/"><BrandWordmark /></Link>
        <SiteNavigation />
        <MobileNavigation />
      </div>
    </header>
  );
}

export function SplitGatewayHome() {
  return (
    <div className="split-gateway-shell">
      <GatewayHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="gateway-intro" aria-labelledby="gateway-title">
          <div className="gateway-intro-copy">
            <h1 id="gateway-title">Salary na promise.<br />Take-home na reality.</h1>
            <p className="landing-description">Pay tools, salary insights and jobs with clear pay.</p>
            <div className="home-main-actions"><HomePayAction /><Link className="home-employer-action" href="/payroll">Manage payroll <ArrowRight aria-hidden="true" /></Link></div>
          </div>
          <HomePayPreview />
        </section>

        <section className="home-audiences" aria-label="Explore SalarySabi">
          <div className="home-task-group"><h2>For individuals</h2><nav aria-label="Tools for individuals">
            <Link href="/jobs">Find jobs with salaries <ArrowRight aria-hidden="true" /></Link>
            <Link href="/salaries">Compare salaries <ArrowRight aria-hidden="true" /></Link>
            <Link href="/calculator?mode=check">Check my payslip <ArrowRight aria-hidden="true" /></Link>
          </nav></div>
          <div className="home-task-group"><h2>For employers</h2><nav aria-label="Tools for employers">
            <Link href="/post-a-job">Post a job <ArrowRight aria-hidden="true" /></Link>
            <Link href="/payroll">Run payroll <ArrowRight aria-hidden="true" /></Link>
            <Link href="/company-tax">Estimate company tax <ArrowRight aria-hidden="true" /></Link>
          </nav></div>
        </section>
      </main>
      <InfoFooter />
    </div>
  );
}

const talentTools = [
  { title: "Calculate my take-home", description: "See your pay after tax and deductions.", href: "/calculator", icon: Calculator },
  { title: "Check my payslip", description: "Compare your payslip's PAYE with an estimate.", href: "/calculator?mode=check", icon: FileText },
  { title: "Find jobs with salaries", description: "Know the advertised pay before applying.", href: "/jobs", icon: BriefcaseBusiness },
  { title: "Compare and share salaries", description: "Explore pay reported by the community.", href: "/salaries", icon: Users },
];
const employerTools = [
  { title: "Run payroll", description: "Calculate monthly pay and create payslips for up to 20 employees.", href: "/payroll", icon: FileText },
  { title: "Estimate company tax", description: "Get a planning estimate from your business figures.", href: "/company-tax", icon: Building2 },
  { title: "Post a job", description: "Advertise a role with a published salary range.", href: "/post-a-job", icon: BriefcaseBusiness },
  { title: "Manage my listings", description: "Track your submitted roles and their publication status.", href: "/hiring", icon: ClipboardList },
];

function AudienceTools({ audience }: { audience: Audience }) {
  const talent = audience === "talent";
  const tools = talent ? talentTools : employerTools;
  return <section className="audience-tools" aria-labelledby="audience-tools-title">
    <header><span className="eyebrow">{talent ? "For individuals" : "For employers"}</span><h1 id="audience-tools-title">{talent ? "Know your pay. Plan your next move." : "Your team. Your next hire. Your numbers."}</h1></header>
    <div className="audience-tool-list">{tools.map(({ title, description, href, icon: Icon }, index) => <Link key={href} href={href} className={`audience-tool${index === 0 ? " audience-tool-primary" : ""}`}><span className="audience-tool-icon"><Icon aria-hidden="true" size={24} /></span><div><h2>{title}</h2><p>{description}</p></div><ArrowRight className="audience-tool-arrow" aria-hidden="true" size={20} /></Link>)}</div>
    <Link className="audience-switch" href={talent ? "/employers" : "/individuals"}>{talent ? "Managing a team? Explore employer tools" : "Looking after your own pay? Explore tools for individuals"}<ArrowRight aria-hidden="true" size={16} /></Link>
  </section>;
}

export function AudienceHome({ audience }: { audience: Audience }) {
  return (
    <div className={`public-page-shell audience-home audience-home--${audience} split-gateway-shell audience-hub`}>
      <GatewayHeader />
      <main id="main-content" tabIndex={-1}>
        <AudienceTools audience={audience} />
      </main>
      <InfoFooter />
    </div>
  );
}
