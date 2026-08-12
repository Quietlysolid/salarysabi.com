"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Benchmark = { role:string; industry:string; location:string; experience_band:string; sample_size:number; median_monthly_gross:number; low_monthly_gross:number; high_monthly_gross:number };
const money = new Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN", maximumFractionDigits:0 });

export function SalaryBenchmarks(){
  const [benchmarks,setBenchmarks]=useState<Benchmark[]>([]);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [step,setStep]=useState<1|2>(1);
  const [campaignId,setCampaignId]=useState("");
  const [campaignReward,setCampaignReward]=useState(0);
  const supabase=useMemo(()=>createBrowserSupabaseClient(),[]);
  const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  useEffect(()=>{if(!endpoint||!key)return; fetch(`${endpoint}/rest/v1/rpc/public_salary_benchmarks`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:"{}"}).then(async r=>r.ok?await r.json() as Benchmark[]:[]).then(setBenchmarks).catch(()=>setBenchmarks([])); const requested=new URLSearchParams(window.location.search).get("campaign")||""; if(requested){supabase.rpc("public_active_contribution_campaigns").then(({data})=>{const campaign=(data??[]).find((item:{id:string;contribution_type:string})=>item.id===requested&&item.contribution_type==="salary_report"); if(campaign){setCampaignId(campaign.id);setCampaignReward(Number(campaign.reward_kobo));}});}},[endpoint,key,supabase]);

  function continueToPay(event: MouseEvent<HTMLButtonElement>){
    const fields=event.currentTarget.form?.querySelectorAll<HTMLInputElement>(".benchmark-form-step.active input");
    const invalid=fields ? Array.from(fields).find((field)=>!field.checkValidity()) : undefined;
    if(invalid){invalid.reportValidity();return;}
    setStep(2);
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!endpoint||!key){setMessage("Salary reporting is not connected yet.");return;}
    setBusy(true);
    const form=event.currentTarget;
    const data=new FormData(form);
    const payload={p_role:data.get("role"),p_industry:data.get("industry"),p_location:data.get("location"),p_experience_band:data.get("experience"),p_company_size:data.get("size"),p_monthly_gross:Number(data.get("gross")),p_pay_reliability:data.get("reliability")};
    const session=campaignId?(await supabase.auth.getSession()).data.session:null;
    if(campaignId&&!session){setBusy(false);setMessage("Sign in through the contributor programme before claiming a campaign reward.");return;}
    const functionName=campaignId?"submit_rewarded_salary_report":"submit_salary_report";
    const response=await fetch(`${endpoint}/rest/v1/rpc/${functionName}`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${session?.access_token||key}`,"Content-Type":"application/json"},body:JSON.stringify(campaignId?{p_campaign_id:campaignId,...payload}:payload)});
    setBusy(false);
    if(response.ok){form.reset();setStep(1);setMessage(campaignId?"Submitted. Your report and reward claim are awaiting independent review.":"Thank you. Your report is awaiting moderation. It will only appear inside an anonymous group of at least five similar reports.");}
    else setMessage("We could not save that report. Check the fields and try again.");
  }

  return <main className="salary-benchmark">
    <header><span className="eyebrow">Anonymous salary reports</span><h1>Know what people doing similar work earn.</h1><p>SalarySabi publishes ranges, never individual submissions. A group needs at least five approved reports before it appears.</p></header>
    {benchmarks.length > 0 && <aside className="benchmark-launch-status"><strong>{benchmarks.length}</strong><span>{benchmarks.length === 1 ? "public benchmark group" : "public benchmark groups"} available</span></aside>}
    <div className="benchmark-layout">
      <section><div className="benchmark-section-heading"><h2>Current benchmarks</h2><span>Real approved reports only</span></div>{benchmarks.length?<div className="benchmark-list">{benchmarks.map(item=><article key={`${item.role}-${item.industry}-${item.location}-${item.experience_band}`}><span>{item.role} · {item.location}</span><strong>{money.format(item.median_monthly_gross)} monthly</strong><p>{money.format(item.low_monthly_gross)}–{money.format(item.high_monthly_gross)} middle range</p><small>{item.industry} · {item.experience_band} years · {item.sample_size} reports</small></article>)}</div>:<div className="benchmark-empty"><strong>No group has reached the five-report privacy threshold yet.</strong><p>We will not invent salary figures or expose early contributors. Once five similar approved reports arrive, this area will show the median, middle range and sample size.</p><div className="benchmark-preview" aria-label="Example of the benchmark format"><span>Example format—not salary data</span><b>Role · Location</b><small>Median pay · Middle range · Number of reports</small></div></div>}</section>
      <form onSubmit={submit}>
        {campaignId&&<aside className="reward-campaign-note"><strong>Contributor campaign · {money.format(campaignReward/100)} after approval</strong><span>Your salary amount does not affect the reward. <Link href="/contributors">View programme rules</Link></span></aside>}
        <div className="benchmark-form-heading"><div><span className="eyebrow">Step {step} of 2</span><h2>Share your salary anonymously</h2></div><small>No name, employer or email</small></div>
        <p>Your report helps unlock a private group benchmark. You will be able to return and compare it once enough similar reports are approved.</p>
        <div className={step===1?"benchmark-form-step active":"benchmark-form-step"} aria-hidden={step!==1}>
          <label>Role<input name="role" minLength={2} maxLength={80} required /></label><label>Industry<input name="industry" minLength={2} maxLength={80} required /></label><label>Location<input name="location" minLength={2} maxLength={80} required /></label>
        </div>
        <div className={step===2?"benchmark-form-step active":"benchmark-form-step"} aria-hidden={step!==2}>
          <label>Experience<select name="experience" required><option value="0-2">0–2 years</option><option value="3-5">3–5 years</option><option value="6-9">6–9 years</option><option value="10+">10+ years</option></select></label><label>Company size<select name="size" required><option value="1-10">1–10</option><option value="11-50">11–50</option><option value="51-200">51–200</option><option value="201+">201+</option></select></label><label>Monthly gross salary<input name="gross" type="number" min="1000" max="100000000" required /></label><label>Pay reliability<select name="reliability" required><option value="on-time">Usually on time</option><option value="sometimes-late">Sometimes late</option><option value="frequently-late">Frequently late</option></select></label>
        </div>
        <div className="benchmark-form-actions">{step===2&&<button className="secondary-button" onClick={()=>setStep(1)} type="button">Back</button>}{step===1?<button className="primary-button" onClick={continueToPay} type="button">Continue</button>:<button className="primary-button" disabled={busy} type="submit">{busy?"Submitting…":"Submit anonymous report"}</button>}</div>
        <p className="benchmark-privacy-note">Reports are moderated and only published as grouped statistics. Do not enter identifying information.</p><p role="status">{message}</p>
      </form>
    </div>
  </main>;
}
