"use client";

import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, CircleDollarSign, Clock3, RotateCcw, WalletCards, XCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Wallet = {
  balance_kobo: number;
  available_to_request_kobo: number;
  pending_kobo: number;
  pending_payout_kobo: number;
  approved_claims: number;
  pending_claims: number;
  minimum_payout_kobo: number;
  cooling_kobo: number;
  next_available_at: string | null;
  contributor_level: "new" | "verified" | "trusted";
  allowed_payout_methods: Array<"airtime" | "bank_transfer">;
};

type Claim = {
  claim_id: string;
  campaign_title: string;
  contribution_type: "salary_report" | "job_source";
  reward_kobo: number;
  status: "pending" | "approved" | "rejected" | "reversed";
  review_note: string | null;
  reviewed_at: string | null;
  submitted_at: string;
};

type Payout = {
  id: string;
  amount_kobo: number;
  payout_method: "airtime" | "bank_transfer";
  status: "pending" | "processing" | "paid" | "rejected";
  reviewed_at: string | null;
  created_at: string;
};

const emptyWallet: Wallet = { balance_kobo: 0, available_to_request_kobo: 0, pending_kobo: 0, pending_payout_kobo: 0, approved_claims: 0, pending_claims: 0, minimum_payout_kobo: 50000, cooling_kobo: 0, next_available_at: null, contributor_level: "new", allowed_payout_methods: ["airtime"] };
const fixtureWallet: Wallet = { balance_kobo: 100000, available_to_request_kobo: 100000, pending_kobo: 100000, pending_payout_kobo: 0, approved_claims: 3, pending_claims: 1, minimum_payout_kobo: 50000, cooling_kobo: 0, next_available_at: null, contributor_level: "verified", allowed_payout_methods: ["airtime", "bank_transfer"] };
const fixtureClaims: Claim[] = [
  { claim_id: "fixture-pending", campaign_title: "Transparent jobs scout pilot", contribution_type: "job_source", reward_kobo: 100000, status: "pending", review_note: null, reviewed_at: null, submitted_at: "2026-08-20T10:00:00Z" },
  { claim_id: "fixture-approved", campaign_title: "Founding salary-report pilot", contribution_type: "salary_report", reward_kobo: 100000, status: "approved", review_note: "Approved after the report passed the privacy and plausibility checks.", reviewed_at: "2026-08-19T14:00:00Z", submitted_at: "2026-08-18T09:00:00Z" },
  { claim_id: "fixture-rejected", campaign_title: "Transparent jobs scout pilot", contribution_type: "job_source", reward_kobo: 100000, status: "rejected", review_note: "The employer page no longer accepted applications when reviewed.", reviewed_at: "2026-08-18T13:00:00Z", submitted_at: "2026-08-17T09:00:00Z" },
];

const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
const date = (value: string) => new Date(value).toLocaleDateString("en-NG", { dateStyle: "medium" });

const claimStatus = {
  pending: { label: "In review", icon: Clock3 },
  approved: { label: "Approved", icon: CheckCircle2 },
  rejected: { label: "Not approved", icon: XCircle },
  reversed: { label: "Reversed", icon: RotateCcw },
} as const;

function friendlyError(message: string) {
  if (message.includes("already being processed")) return "You already have a payout being processed.";
  if (message.includes("already linked")) return "That payout destination is already connected to another contributor. Contact support if this is your account.";
  if (message.includes("Minimum payout")) return "The minimum payout is ₦500.";
  if (message.includes("valid mobile number")) return "Enter a valid mobile number, including the network prefix.";
  if (message.includes("bank name")) return "Enter the bank name, the 10-digit account number and the name on the account.";
  if (message.includes("exceeds available")) return "That amount is higher than your available balance.";
  if (message.includes("first payout")) return "Your first payout is available as airtime while your contributor account is being verified.";
  if (message.includes("Payouts are paused")) return "Payouts are paused while the account is reviewed. Contact support if you think this is a mistake.";
  return "We could not complete that request. Check the details and try again.";
}

export function ContributorDashboard({ fixtureMode = false }: { fixtureMode?: boolean }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(fixtureMode);
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState<Wallet>(fixtureMode ? fixtureWallet : emptyWallet);
  const [claims, setClaims] = useState<Claim[]>(fixtureMode ? fixtureClaims : []);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [method, setMethod] = useState<"airtime" | "bank_transfer">("airtime");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(fixtureMode ? "Local preview—no production reward or payout will change." : "");

  useEffect(() => {
    if (fixtureMode) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setChecked(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setChecked(true); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [fixtureMode, supabase]);

  const load = useCallback(async () => {
    if (fixtureMode) return;
    const [walletResult, claimResult, payoutResult] = await Promise.all([
      supabase.rpc("contributor_wallet"),
      supabase.rpc("contributor_claim_history"),
      supabase.from("contributor_payout_requests").select("id,amount_kobo,payout_method,status,reviewed_at,created_at").order("created_at", { ascending: false }),
    ]);
    if (walletResult.error || claimResult.error || payoutResult.error) {
      setMessage("We could not load every contribution record. Refresh and try again.");
      return;
    }
    setWallet((walletResult.data ?? emptyWallet) as unknown as Wallet);
    setClaims((claimResult.data ?? []) as Claim[]);
    setPayouts((payoutResult.data ?? []) as Payout[]);
  }, [fixtureMode, supabase]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, session]);

  async function sendSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/contributions` } });
    setMessage(error ? "We could not send the sign-in link. Try again shortly." : "Check your email and open the secure SalarySabi sign-in link.");
    setBusy(false);
  }

  async function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amountNaira = Number(data.get("amount"));
    const selectedMethod = wallet.allowed_payout_methods.includes(method) ? method : (wallet.allowed_payout_methods[0] ?? "airtime");
    const destination = selectedMethod === "airtime"
      ? String(data.get("mobile_number") || "").trim()
      : [data.get("bank_name"), data.get("account_number"), data.get("account_name")]
          .map((value) => String(value || "").trim())
          .join(" | ");
    if (!Number.isFinite(amountNaira) || amountNaira * 100 < wallet.minimum_payout_kobo) {
      setMessage(`Enter at least ${money(wallet.minimum_payout_kobo)}.`);
      return;
    }
    if (amountNaira * 100 > wallet.available_to_request_kobo) {
      setMessage("That amount is higher than your available balance.");
      return;
    }
    setBusy(true);
    if (fixtureMode) {
      setWallet({ ...wallet, available_to_request_kobo: 0, pending_payout_kobo: amountNaira * 100 });
      setPayouts([{ id: "fixture-payout", amount_kobo: amountNaira * 100, payout_method: selectedMethod, status: "pending", reviewed_at: null, created_at: new Date().toISOString() }, ...payouts]);
      setMessage("Local preview payout requested. No production data changed.");
      setBusy(false);
      form.reset();
      return;
    }
    const { error } = await supabase.rpc("request_contributor_payout", { p_amount_kobo: Math.round(amountNaira * 100), p_payout_method: selectedMethod, p_payout_destination: destination });
    setMessage(error ? friendlyError(error.message) : "Payout requested. You can track it below.");
    setBusy(false);
    if (!error) { form.reset(); await load(); }
  }

  if (!checked) return <section className="contributions-loading" role="status">Checking your contributor account…</section>;

  if (!session && !fixtureMode) return <section className="contributions-gateway">
    <div>
      <span className="eyebrow">Contributor account</span>
      <h1>Track every contribution and reward.</h1>
      <p>Use the same email you used for your rewarded submission. We will send a secure sign-in link—no password needed.</p>
    </div>
    <form onSubmit={sendSignIn}>
      <label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
      <button className="primary-button" disabled={busy}>{busy ? "Sending…" : "Email me a secure sign-in link"}</button>
      <p role="status">{message}</p>
    </form>
  </section>;

  const payoutBlocked = wallet.pending_payout_kobo > 0 || wallet.available_to_request_kobo < wallet.minimum_payout_kobo;
  const selectedMethod = wallet.allowed_payout_methods.includes(method) ? method : (wallet.allowed_payout_methods[0] ?? "airtime");

  return <section className="contributions-dashboard">
    <header>
      <div><span className="eyebrow">My contributions</span><h1>Rewards and review status</h1><p>{fixtureMode ? "ozichi@salarysabi.com" : session?.user.email}</p></div>
      {!fixtureMode && <button onClick={() => void supabase.auth.signOut()}>Sign out</button>}
    </header>
    <p className="contributions-status" role="status">{message}</p>

    <section className="contribution-wallet" aria-labelledby="contribution-wallet-title">
      <div><WalletCards aria-hidden="true" /><span><small>{wallet.contributor_level} contributor · Reward balance</small><strong id="contribution-wallet-title">{money(wallet.balance_kobo)}</strong></span></div>
      <dl>
        <div><dt>Awaiting review</dt><dd>{money(wallet.pending_kobo)}</dd></div>
        <div><dt>Safety hold</dt><dd>{money(wallet.cooling_kobo)}</dd></div>
        <div><dt>Payout processing</dt><dd>{money(wallet.pending_payout_kobo)}</dd></div>
      </dl>
    </section>
    {wallet.cooling_kobo > 0 && <p className="contribution-cooling-note"><Clock3 aria-hidden="true" /><span><strong>{money(wallet.cooling_kobo)} is approved and protected by a short first-payout hold.</strong>{wallet.next_available_at ? ` Available from ${date(wallet.next_available_at)} if no review issue is found.` : " It will unlock automatically."}</span></p>}

    <div className="contributions-layout">
      <section className="contribution-history" aria-labelledby="contribution-history-title">
        <div className="contribution-section-heading"><span className="eyebrow">Submission history</span><h2 id="contribution-history-title">Your contributions</h2></div>
        {claims.length === 0 ? <div className="contribution-empty"><strong>No rewarded contributions yet.</strong><span>Choose an active offer to make your first contribution.</span><Link href="/contributors">View funded offers</Link></div> : <div className="contribution-claim-list">
          {claims.map((claim) => {
            const status = claimStatus[claim.status];
            const StatusIcon = status.icon;
            return <article className={`contribution-claim is-${claim.status}`} key={claim.claim_id}>
              <header><span><StatusIcon aria-hidden="true" />{status.label}</span><strong>{money(claim.reward_kobo)}</strong></header>
              <h3>{claim.contribution_type === "salary_report" ? "Anonymous salary report" : "Verified job lead"}</h3>
              <p>{claim.campaign_title} · Submitted {date(claim.submitted_at)}</p>
              {claim.review_note && <div className="contribution-review-note"><strong>Review note</strong><span>{claim.review_note}</span></div>}
              {claim.status === "pending" && <small>Pilot target: reviewed within 5 business days.</small>}
              {claim.status === "rejected" && <div className="contribution-recovery"><Link href={claim.contribution_type === "salary_report" ? "/contributors" : "/contributors/job-sourcing"}>Review the rules and try again</Link><a href="mailto:hello@salarysabi.com?subject=Contribution%20review%20question">Ask about this decision</a></div>}
            </article>;
          })}
        </div>}
      </section>

      <aside className="contribution-payout" aria-labelledby="contribution-payout-title">
        <span className="eyebrow">Withdraw rewards</span>
        <h2 id="contribution-payout-title">Request a payout</h2>
        <p>Minimum {money(wallet.minimum_payout_kobo)}. Pilot target: processed within 3 business days after your request.</p>
        {wallet.pending_payout_kobo > 0 ? <div className="payout-blocked"><Clock3 aria-hidden="true" /><span><strong>A payout is already processing.</strong>Submit another after this one is completed.</span></div> : wallet.balance_kobo < wallet.minimum_payout_kobo ? <div className="payout-blocked"><CircleDollarSign aria-hidden="true" /><span><strong>Your balance is below the minimum.</strong>Approved rewards will appear here automatically.</span></div> : null}
        <form onSubmit={requestPayout}>
          <label>Amount in naira<input defaultValue={wallet.available_to_request_kobo / 100 || ""} disabled={payoutBlocked} inputMode="numeric" max={wallet.available_to_request_kobo / 100} min={wallet.minimum_payout_kobo / 100} name="amount" required type="number" /></label>
          <label>Payout method<select disabled={payoutBlocked} name="method" onChange={(event) => setMethod(event.target.value as typeof method)} value={selectedMethod}>{wallet.allowed_payout_methods.includes("airtime") && <option value="airtime">Airtime</option>}{wallet.allowed_payout_methods.includes("bank_transfer") && <option value="bank_transfer">Bank transfer</option>}</select></label>
          {selectedMethod === "airtime" ? <label>Mobile number<input autoComplete="tel" disabled={payoutBlocked} inputMode="tel" minLength={10} name="mobile_number" pattern="[0-9+ ]{10,16}" placeholder="e.g. 08012345678" required /></label> : <>
            <label>Bank name<input autoComplete="off" disabled={payoutBlocked} maxLength={80} name="bank_name" placeholder="e.g. GTBank" required /></label>
            <label>10-digit account number<input autoComplete="off" disabled={payoutBlocked} inputMode="numeric" maxLength={10} minLength={10} name="account_number" pattern="[0-9]{10}" placeholder="e.g. 0123456789" required /></label>
            <label>Account name<input autoComplete="name" disabled={payoutBlocked} maxLength={120} name="account_name" placeholder="e.g. Ada Okafor" required /></label>
          </>}
          <label className="payout-confirmation"><input disabled={payoutBlocked} required type="checkbox" /><span>I checked these payout details. Incorrect details can delay payment.</span></label>
          <button className="primary-button" disabled={payoutBlocked || busy}>{busy ? "Requesting…" : "Request payout"}</button>
        </form>
        {wallet.contributor_level === "new" && <small>New contributors use airtime for the first payout. Bank transfer unlocks after a consistent approval history.</small>}
        <small>Payout information stays private and is used only to process and protect rewards. <Link href="/privacy">Privacy details</Link></small>
      </aside>
    </div>

    <section className="payout-history" aria-labelledby="payout-history-title">
      <h2 id="payout-history-title">Payout history</h2>
      {payouts.length === 0 ? <p>No payout requests yet.</p> : payouts.map((payout) => <article key={payout.id}><span><strong>{money(payout.amount_kobo)}</strong><small>{payout.payout_method === "bank_transfer" ? "Bank transfer" : "Airtime"} · Requested {date(payout.created_at)}</small></span><b className={`payout-status is-${payout.status}`}>{payout.status === "processing" ? "Processing" : payout.status === "paid" ? "Paid" : payout.status === "rejected" ? "Not paid" : "Requested"}</b></article>)}
    </section>
  </section>;
}
