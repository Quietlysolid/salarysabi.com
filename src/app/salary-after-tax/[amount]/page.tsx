import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideCalculator } from "@/components/paye-guide-calculator";
import { calculateOffer, defaultOfferAssumptions, formatNaira, salaryExamples } from "@/lib/offer";
import { pitGuidelinesUrl } from "@/lib/site";

type Props = { params: Promise<{ amount: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return salaryExamples.map(amount => ({ amount: String(amount) })); }
function salaryFromSlug(slug: string) {
  const amount = salaryExamples.find(value => String(value) === slug);
  if (!amount) notFound();
  return amount;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const amount = salaryFromSlug((await params).amount);
  const result = calculateOffer(amount, defaultOfferAssumptions);
  return { title: `${formatNaira(amount)} Salary After Tax in Nigeria (2026) | SalarySabi`,
    description: `A ${formatNaira(amount)} monthly salary gives an estimated ${formatNaira(result.monthlyTakeHome)} take-home with 8% employee pension on full gross. See PAYE and adjust your assumptions.`,
    alternates: { canonical: `/salary-after-tax/${amount}` } };
}
export default async function SalaryAfterTaxPage({ params }: Props) {
  const amount = salaryFromSlug((await params).amount);
  const result = calculateOffer(amount, defaultOfferAssumptions);
  const withoutPension = calculateOffer(amount, { ...defaultOfferAssumptions, pensionRate: 0 });
  return <PublicPageShell className="decision-page">
    <article className="salary-answer">
      <header><span className="eyebrow">Nigeria salary after tax · 2026</span><h1>{formatNaira(amount)} salary after tax in Nigeria</h1><p>If you earn <strong>{formatNaira(amount)} a month</strong> throughout 2026, your estimated take-home is <strong>{formatNaira(result.monthlyTakeHome)} per month</strong>, assuming employee pension of 8% on your full gross salary, no rent relief and no other deductions.</p></header>
      <dl className="salary-answer-breakdown"><div><dt>Monthly gross</dt><dd>{formatNaira(amount)}</dd></div><div><dt>Employee pension</dt><dd>{formatNaira(result.monthlyPension)}</dd></div><div><dt>Estimated monthly PAYE</dt><dd>{formatNaira(result.tax.monthlyTax)}</dd></div><div><dt>Monthly take-home</dt><dd>{formatNaira(result.monthlyTakeHome)}</dd></div></dl>
      <Link className="decision-primary" href="#calculator">Calculate my exact salary →</Link>
      <section><h2>How this estimate is calculated</h2><p>Your annual gross is {formatNaira(amount * 12)}. After employee pension of {formatNaira(result.monthlyPension * 12)}, chargeable income is {formatNaira(result.tax.chargeableIncome)}. Applying the graduated bands gives annual PAYE of {formatNaira(result.tax.annualTax)} and an effective PAYE rate of {(result.tax.effectiveTaxRate * 100).toFixed(1)}%.</p>
        <div className="salary-table-wrap"><table><caption>Annual PAYE by tax band</caption><thead><tr><th scope="col">Band</th><th scope="col">Income in band</th><th scope="col">Tax</th></tr></thead><tbody>{result.tax.bands.filter(band => band.taxableAmount > 0).map(band => <tr key={band.label}><th scope="row">{band.label} ({band.rate * 100}%)</th><td>{formatNaira(band.taxableAmount)}</td><td>{formatNaira(band.tax)}</td></tr>)}</tbody></table></div>
        <p>Your annual take-home would be {formatNaira(result.annualTakeHome)}. Figures are rounded for display; calculations use unrounded amounts.</p></section>
      <section><h2>What could change your take-home?</h2><p>Your pensionable pay may be lower than gross; confirm the basic salary, housing and transport amounts in your contract. If no employee pension applies, estimated take-home is {formatNaira(withoutPension.monthlyTakeHome)} with PAYE of {formatNaira(withoutPension.tax.monthlyTax)} per month.</p><p>Actual NHF and NHIS contributions, eligible rent relief and other deductions can change the result. Bonuses, benefits in kind and cumulative payroll adjustments are outside this example. Use the <Link href="/offer-checker">Offer Checker</Link> to include rent and additional deductions.</p><p>Estimates use SalarySabi’s shared PAYE engine and the <a href={pitGuidelinesUrl} target="_blank" rel="noreferrer">JRB 2026 guidelines</a>. <Link href="/how-paye-is-calculated">Read the full methodology</Link>. This is an estimate, not tax advice.</p></section>
    </article>
    <div id="calculator" className="take-home-calculator"><PayeGuideCalculator initialGross={amount} embedded /></div>
    <nav className="decision-examples" aria-label="Other salary examples"><h2>Explore other monthly salaries</h2><div>{salaryExamples.filter(value => value !== amount).map(value => <Link key={value} href={`/salary-after-tax/${value}`}>{formatNaira(value)} after tax →</Link>)}</div></nav>
  </PublicPageShell>;
}
