"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Campaign = { id:string; title:string; contribution_type:string; status:string; reward_kobo:number; budget_kobo:number; committed_kobo:number };
type Claim = { id:string; contribution_type:string; reward_kobo:number; created_at:string };
type Payout = { id:string; contributor_id:string; amount_kobo:number; payout_method:string; payout_destination:string; status:string };
const money=(kobo:number)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(kobo/100);

export function AdminContributorProgram(){
  const supabase=useMemo(()=>createBrowserSupabaseClient(),[]);
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [claims,setClaims]=useState<Claim[]>([]);
  const [payouts,setPayouts]=useState<Payout[]>([]);
  const [status,setStatus]=useState("Checking administrator access…");
  const load=useCallback(async()=>{
    const {data:isAdmin}=await supabase.rpc("is_current_user_admin");
    if(!isAdmin){setStatus("Administrator access required.");return;}
    const [campaignResult,claimResult,payoutResult]=await Promise.all([
      supabase.from("contribution_campaigns").select("*").order("created_at"),
      supabase.from("contribution_claims").select("*").eq("status","pending").order("created_at"),
      supabase.from("contributor_payout_requests").select("*").in("status",["pending","processing"]).order("created_at"),
    ]);
    if(campaignResult.error||claimResult.error||payoutResult.error){setStatus("Contributor programme data could not be loaded.");return;}
    setCampaigns(campaignResult.data as Campaign[]);setClaims(claimResult.data as Claim[]);setPayouts(payoutResult.data as Payout[]);setStatus("");
  },[supabase]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);
  async function setCampaign(id:string,next:string){setStatus("Updating campaign…");const {error}=await supabase.from("contribution_campaigns").update({status:next}).eq("id",id);setStatus(error?error.message:`Campaign ${next}.`);await load();}
  async function review(id:string,decision:"approved"|"rejected"){const note=decision==="rejected"?window.prompt("Reason for rejection")||"Did not pass verification":"Passed source and duplication checks";setStatus("Saving review…");const {error}=await supabase.rpc("admin_review_contribution_claim",{p_claim_id:id,p_decision:decision,p_note:note});setStatus(error?error.message:`Claim ${decision}.`);await load();}
  async function processPayout(id:string,decision:"processing"|"paid"|"rejected"){const reference=decision==="paid"?window.prompt("Payment reference")||"":"";if(decision==="paid"&&!reference)return;setStatus("Updating payout…");const {error}=await supabase.rpc("admin_complete_contributor_payout",{p_request_id:id,p_decision:decision,p_reference:reference});setStatus(error?error.message:`Payout marked ${decision}.`);await load();}
  return <main className="contributor-admin"><header><div><span className="eyebrow">Contributor programme control</span><h1>Budgets, campaigns and reward reviews</h1><p>Campaigns remain draft until you activate them. The database reserves each pending reward and stops accepting claims when the hard budget is reached.</p></div><Link href="/admin">Back to administration</Link></header><p role="status">{status}</p>
    <section><div className="contributor-section-heading"><span className="eyebrow">Campaign controls</span><h2>Founding pilots</h2></div><div className="admin-campaign-grid">{campaigns.map(c=><article key={c.id}><span>{c.contribution_type.replace("_"," ")} · {c.status}</span><h3>{c.title}</h3><dl><div><dt>Reward</dt><dd>{money(c.reward_kobo)}</dd></div><div><dt>Hard budget</dt><dd>{money(c.budget_kobo)}</dd></div><div><dt>Reserved</dt><dd>{money(c.committed_kobo)}</dd></div><div><dt>Available</dt><dd>{money(c.budget_kobo-c.committed_kobo)}</dd></div></dl><div>{c.status!=="active"&&<button className="primary-button" onClick={()=>setCampaign(c.id,"active")}>Activate</button>}{c.status==="active"&&<button onClick={()=>setCampaign(c.id,"paused")}>Pause</button>}{c.status!=="closed"&&<button onClick={()=>setCampaign(c.id,"closed")}>Close</button>}</div></article>)}</div></section>
    <section><div className="contributor-section-heading"><span className="eyebrow">Independent review</span><h2>Pending reward claims</h2></div>{claims.length?<div className="admin-claim-list">{claims.map(c=><article key={c.id}><div><strong>{c.contribution_type.replace("_"," ")}</strong><span>{money(c.reward_kobo)} reserved · {new Date(c.created_at).toLocaleString()}</span><small>Claim {c.id}</small></div><div><button onClick={()=>review(c.id,"rejected")}>Reject</button><button className="primary-button" onClick={()=>review(c.id,"approved")}>Approve reward</button></div></article>)}</div>:<p className="contributor-empty">No reward claims are waiting for review.</p>}</section>
    <section><div className="contributor-section-heading"><span className="eyebrow">Payout queue</span><h2>Contributor withdrawals</h2></div>{payouts.length?<div className="admin-claim-list">{payouts.map(p=><article key={p.id}><div><strong>{money(p.amount_kobo)} · {p.payout_method.replace("_"," ")}</strong><span>{p.payout_destination}</span><small>{p.status} · contributor {p.contributor_id}</small></div><div><button onClick={()=>processPayout(p.id,"rejected")}>Reject</button>{p.status==="pending"&&<button onClick={()=>processPayout(p.id,"processing")}>Start processing</button>}<button className="primary-button" onClick={()=>processPayout(p.id,"paid")}>Mark paid</button></div></article>)}</div>:<p className="contributor-empty">No payout requests are waiting.</p>}</section>
  </main>;
}
