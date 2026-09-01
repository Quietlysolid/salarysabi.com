"use client";

import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/components/analytics";
import { JourneyNextSteps } from "@/components/journey-next-steps";
import { contributorDeviceId, TurnstileCheck } from "@/components/turnstile-check";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Benchmark = { role:string; industry:string; location:string; experience_band:string; sample_size:number; median_monthly_gross:number; low_monthly_gross:number; high_monthly_gross:number };
const money = new Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN", maximumFractionDigits:0 });

export function SalaryBenchmarks(){
  const [benchmarks,setBenchmarks]=useState<Benchmark[]>([]);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [step,setStep]=useState<1|2>(1);
  const [campaignId,setCampaignId]=useState("");
  const [rewardSessionReady,setRewardSessionReady]=useState(false);
  const [rewardEmail,setRewardEmail]=useState("");
  const [draft,setDraft]=useState({role:"",industry:"",location:""});
  const [showUnpaidForm,setShowUnpaidForm]=useState(false);
  const [rewardSubmitted,setRewardSubmitted]=useState(false);
  const [humanToken,setHumanToken]=useState("");
  const [humanReset,setHumanReset]=useState(0);
  const stepHeadingRef=useRef<HTMLSpanElement>(null);
  const supabase=useMemo(()=>createBrowserSupabaseClient(),[]);
  const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const receiveHumanToken=useCallback((token:string)=>setHumanToken(token),[]);

  useEffect(()=>{if(!endpoint||!key)return; fetch(`${endpoint}/rest/v1/rpc/public_salary_benchmarks`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:"{}"}).then(async r=>r.ok?await r.json() as Benchmark[]:[]).then(setBenchmarks).catch(()=>setBenchmarks([])); const requested=new URLSearchParams(window.location.search).get("campaign")||""; if(requested){supabase.rpc("public_active_contribution_campaigns").then(({data})=>{const campaign=(data??[]).find((item:{id:string;slug:string;contribution_type:string})=>item.slug===requested&&item.contribution_type==="salary_report"); if(campaign){setCampaignId(campaign.id);}});supabase.auth.getSession().then(({data})=>setRewardSessionReady(Boolean(data.session)));const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setRewardSessionReady(Boolean(session)));return()=>listener.subscription.unsubscribe();}},[endpoint,key,supabase]);

  useEffect(()=>{if(showUnpaidForm)requestAnimationFrame(()=>stepHeadingRef.current?.focus());},[showUnpaidForm]);

  async function sendRewardSignIn(){
    if(!rewardEmail.trim()){setMessage("Enter your email to receive a secure sign-in link.");return;}
    const {error}=await supabase.auth.signInWithOtp({email:rewardEmail.trim().toLowerCase(),options:{emailRedirectTo:`${window.location.origin}/salaries?campaign=salary-pilot-2026#salary-report`}});
    setMessage(error?"We could not send the sign-in link. Try again.":"Check your email for a secure sign-in link, then return to submit your report.");
  }

  function continueToPay(event: MouseEvent<HTMLButtonElement>){
    event.preventDefault();
    const fields=event.currentTarget.form?.querySelectorAll<HTMLInputElement>(".benchmark-form-step.active input");
    const invalid=fields ? Array.from(fields).find((field)=>!field.checkValidity()) : undefined;
    if(invalid){invalid.reportValidity();return;}
    const form=event.currentTarget.form;
    if(form){
      const data=new FormData(form);
      setDraft({role:String(data.get("role")||""),industry:String(data.get("industry")||""),location:String(data.get("location")||"")});
    }
    setStep(2);
    stepHeadingRef.current?.focus();
  }

  function returnToJobDetails(){setStep(1);stepHeadingRef.current?.focus();}

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!endpoint||!key){setMessage("Salary reporting is not connected yet.");return;}
    setBusy(true);
    const form=event.currentTarget;
    const data=new FormData(form);
    const payload={p_role:data.get("role"),p_industry:data.get("industry"),p_location:data.get("location"),p_experience_band:data.get("experience"),p_company_size:data.get("size"),p_monthly_gross:Number(data.get("gross")),p_pay_reliability:data.get("reliability")};
    const session=campaignId?(await supabase.auth.getSession()).data.session:null;
    if(campaignId&&!session){setBusy(false);setMessage("Sign in through the contributor programme before claiming a campaign reward.");return;}
    if(campaignId&&!humanToken){setBusy(false);setMessage("Complete the human verification before submitting.");return;}
    setRewardSubmitted(false);
    if(campaignId)track("reward_submission_started");
    const response=campaignId
      ? await fetch(`${endpoint.replace(/\/$/,"")}/functions/v1/submit-rewarded-contribution`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${session?.access_token}`,"Content-Type":"application/json","x-salarysabi-device":contributorDeviceId()},body:JSON.stringify({type:"salary_report",campaignId,turnstileToken:humanToken,payload:{role:payload.p_role,industry:payload.p_industry,location:payload.p_location,experienceBand:payload.p_experience_band,companySize:payload.p_company_size,monthlyGross:payload.p_monthly_gross,payReliability:payload.p_pay_reliability}})})
      : await fetch(`${endpoint}/rest/v1/rpc/submit_salary_report`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    setBusy(false);
    if(response.ok){form.reset();setStep(1);setRewardSubmitted(Boolean(campaignId));setHumanToken("");setHumanReset((value)=>value+1);setMessage(campaignId?"Submitted. Your reward claim is awaiting review. The salary data stays quarantined until a separate publication check.":"Thank you. Your report is awaiting moderation. It will only appear inside an anonymous group of at least five similar reports.");}
    else {const errorBody=await response.json().catch(()=>null) as {error?:string;message?:string}|null;setMessage(errorBody?.error||errorBody?.message||"We could not save that report. Check the fields and try again.");}
  }

  const showForm=showUnpaidForm||Boolean(campaignId);

  return <div className="salary-benchmark">
    <header className="salary-benchmark-hero">
      <span className="eyebrow">Compare salaries</span>
      <h1>Know what your work is worth.</h1>
      <p>See verified salary ranges for roles like yours.</p>
    </header>
    {benchmarks.length > 0 && <aside className="benchmark-launch-status"><strong>{benchmarks.length}</strong><span>{benchmarks.length === 1 ? "public benchmark group" : "public benchmark groups"} available</span></aside>}
    <div className={benchmarks.length?"benchmark-layout":"benchmark-layout benchmark-layout--empty"}>
      {benchmarks.length>0&&<section><div className="benchmark-section-heading"><span>Approved reports only</span></div><div className="benchmark-list">{benchmarks.map(item=><article key={`${item.role}-${item.industry}-${item.location}-${item.experience_band}`}><span>{item.role} · {item.location}</span><strong>{money.format(item.median_monthly_gross)} monthly</strong><p>{money.format(item.low_monthly_gross)}–{money.format(item.high_monthly_gross)} typical range</p><small>{item.industry} · {item.experience_band} years · Based on {item.sample_size} reports</small></article>)}</div></section>}
      {!benchmarks.length&&!showForm&&<section className="benchmark-empty" aria-labelledby="benchmark-empty-title"><h2 id="benchmark-empty-title">Help unlock comparisons.</h2><p>Comparisons appear after five similar, anonymous reports are approved.</p><button className="primary-button" onClick={()=>setShowUnpaidForm(true)} type="button">Share my salary</button><small>Your individual salary is never published.</small><Link href="/jobs">Browse jobs with published pay <span aria-hidden="true">→</span></Link></section>}
      {benchmarks.length>0&&!showForm&&<section className="benchmark-contribution-choice"><span className="eyebrow">Keep ranges useful</span><h2>Add your salary anonymously</h2><p>SalarySabi reviews each report before it can join a public comparison.</p><div><button onClick={()=>setShowUnpaidForm(true)} type="button">Share my salary</button><Link href="/contributors">See funded offers</Link></div></section>}
      {showForm&&<form id="salary-report" onSubmit={submit}>
        {campaignId&&<aside className="reward-campaign-note"><strong>Earn ₦1,000 after approval</strong><span>One reward per person. <Link href="/contributors">View eligibility rules</Link></span>{!rewardSessionReady&&<div className="reward-signin"><label>Email for secure sign-in and reward payment<input autoComplete="email" onChange={event=>setRewardEmail(event.target.value)} placeholder="you@example.com" type="email" value={rewardEmail} /></label><p>Your email is kept separate from the salary information used in public benchmarks. <Link href="/privacy">How we protect your data</Link></p><button onClick={sendRewardSignIn} type="button">Continue by email</button></div>}</aside>}
        {(!campaignId||rewardSessionReady)&&<>
        <div className="benchmark-form-heading"><div><span className="eyebrow" ref={stepHeadingRef} tabIndex={-1}>Step {step} of 2</span></div></div>
        {step===2&&<p>Check your job details, then add your pay.</p>}
        <div className={step===1?"benchmark-form-step active":"benchmark-form-step"} aria-hidden={step!==1}>
          <label>Job title<input autoComplete="organization-title" list="salary-role-options" name="role" placeholder="e.g. Product Designer" minLength={2} maxLength={80} required /></label><label>Industry<input list="salary-industry-options" name="industry" placeholder="e.g. Technology" minLength={2} maxLength={80} required /></label><label>Work location<input autoComplete="address-level2" list="salary-location-options" name="location" placeholder="e.g. Lagos" minLength={2} maxLength={80} required /></label>
          <datalist id="salary-role-options"><option value="Accountant"/><option value="Customer Support Specialist"/><option value="Data Analyst"/><option value="Product Designer"/><option value="Software Engineer"/></datalist>
          <datalist id="salary-industry-options"><option value="Banking and Finance"/><option value="Education"/><option value="Healthcare"/><option value="Retail"/><option value="Technology"/></datalist>
          <datalist id="salary-location-options"><option value="Abuja"/><option value="Lagos"/><option value="Port Harcourt"/><option value="Remote in Nigeria"/></datalist>
        </div>
        <div className={step===2?"benchmark-form-step active":"benchmark-form-step"} aria-hidden={step!==2}>
          <div className="benchmark-draft-summary"><span>Your job details</span><strong>{draft.role}</strong><small>{draft.industry} · {draft.location}</small><button onClick={returnToJobDetails} type="button">Edit</button></div>
          <label>Years of experience<select name="experience" required><option value="0-2">0–2 years</option><option value="3-5">3–5 years</option><option value="6-9">6–9 years</option><option value="10+">10+ years</option></select></label><label>Company size<select name="size" required><option value="1-10">1–10 people</option><option value="11-50">11–50 people</option><option value="51-200">51–200 people</option><option value="201+">201+ people</option></select></label><label>Monthly salary before tax and deductions<div className="benchmark-money-input"><span aria-hidden="true">₦</span><input inputMode="numeric" name="gross" type="number" min="1000" max="100000000" placeholder="e.g. 500,000" required /></div></label><label>Are you usually paid on time?<select name="reliability" required><option value="on-time">Yes, usually on time</option><option value="sometimes-late">Sometimes late</option><option value="frequently-late">Often late</option></select></label>
        </div>
        {step===2&&campaignId&&<TurnstileCheck action="reward_salary" onToken={receiveHumanToken} resetSignal={humanReset} />}
        <div className="benchmark-form-actions">{step===2&&<button className="secondary-button" onClick={returnToJobDetails} type="button">Back</button>}{step===1?<button className="primary-button" onClick={continueToPay} type="button">Continue</button>:<button className="primary-button" disabled={busy||Boolean(campaignId&&!humanToken)} type="submit">{busy?"Submitting…":"Submit anonymous report"}</button>}</div>
        {step===2&&<p className="benchmark-privacy-note">Never enter your name or employer. We publish only grouped results.</p>}
        </>}<p role="status">{message}</p>{rewardSubmitted&&<Link className="submission-tracking-link" href="/contributions">Track this contribution and reward</Link>}
      </form>}
    </div>
    {benchmarks.length > 0 && <JourneyNextSteps
      title="Put the range to work"
      steps={[
        { href: "/payslip-checker", title: "Estimate take-home pay", description: "Turn a gross salary into PAYE and net pay." },
        { href: "/jobs", title: "Find jobs with published pay", description: "Compare current offers before applying." },
      ]}
    />}
  </div>;
}
