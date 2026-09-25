"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Check } from "lucide-react";
import { track } from "./analytics";

type Preview = {
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentType: string;
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: string;
  salaryType: string;
  currency: string;
  client: string;
};

type FormErrors = Record<string, string>;

const draftKey = "salarysabi:job-draft:v1";

const initialPreview: Preview = {
  title: "Your job title",
  company: "Your company",
  location: "Lagos, Nigeria",
  workMode: "On-site",
  employmentType: "Full time",
  salaryMin: 0,
  salaryMax: 0,
  salaryPeriod: "monthly",
  salaryType: "gross",
  currency: "NGN",
  client: "",
};

function money(value: number, currency: string) {
  return value > 0 ? new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value) : "Not set";
}
function tomorrow() {
  const date = new Date(); date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function JobSubmissionForm() {
  const [accountState, setAccountState] = useState<"checking" | "signed-in" | "guest">("checking");
  const [submittedWithAccount, setSubmittedWithAccount] = useState(false);
  useEffect(() => {
    const { data } = createBrowserSupabaseClient().auth.onAuthStateChange((_event, session) => setAccountState(session ? "signed-in" : "guest"));
    return () => data.subscription.unsubscribe();
  }, []);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submitterType, setSubmitterType] = useState<"employer" | "recruiter">("employer");
  const [preview, setPreview] = useState<Preview>(initialPreview);
  const [errors, setErrors] = useState<FormErrors>({});
  const submittingRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const draftReady = useRef(false);
  const [restoredDraft, setRestoredDraft] = useState<{ fields: Record<string, unknown> } | null>(null);
  const [draftNotice, setDraftNotice] = useState("");

  function saveDraft(form: HTMLFormElement, activeStep = step) {
    if (!draftReady.current) return;
    const fields: Record<string, string | boolean> = {};
    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) || !element.name || element.name === "website") continue;
      fields[element.name] = element instanceof HTMLInputElement && element.type === "checkbox" ? element.checked : element.value;
    }
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ step: activeStep, fields }));
      setDraftNotice("Draft saved in this browser tab.");
    } catch { setDraftNotice("Draft could not be saved. Keep this page open to retain your entries."); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
        if (draft && [1, 2, 3].includes(draft.step) && draft.fields && typeof draft.fields === "object") {
          setSubmitterType(draft.fields.submitter_type === "recruiter" ? "recruiter" : "employer");
          setStep(draft.step);
          setRestoredDraft(draft);
          return;
        }
      } catch { /* Invalid or unavailable storage must not block posting. */ }
      draftReady.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!restoredDraft) return;
    // Conditional recruiter fields must be mounted before restoring their values.
    const timer = window.setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      for (const element of Array.from(form.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) || element.name === "website") continue;
        const value = restoredDraft.fields[element.name];
        if (element instanceof HTMLInputElement && element.type === "checkbox") element.checked = value === true;
        else if (typeof value === "string") element.value = value;
      }
      updatePreview(form);
      setDraftNotice("Your draft has been restored in this browser tab.");
      draftReady.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [restoredDraft]);

  useEffect(() => {
    if (formRef.current && draftReady.current) saveDraft(formRef.current, step);
    // Save navigation independently of input events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function discardDraft() {
    try { sessionStorage.removeItem(draftKey); } catch { /* Form can still be reset. */ }
    draftReady.current = false;
    formRef.current?.reset();
    setSubmitterType("employer"); setPreview(initialPreview); setStep(1); setErrors({}); setMessage(""); setStatus("idle");
    setDraftNotice("Draft discarded.");
    requestAnimationFrame(() => { draftReady.current = true; panelRef.current?.focus(); });
  }

  function updatePreview(form: HTMLFormElement) {
    const data = new FormData(form);
    const label = (name: string) => {
      const select = form.elements.namedItem(name) as HTMLSelectElement | null;
      return select?.selectedOptions[0]?.text || "";
    };
    setPreview({
      title: String(data.get("title") || "") || initialPreview.title,
      company: String(data.get("company_name") || "") || initialPreview.company,
      location: String(data.get("location") || "") || initialPreview.location,
      workMode: label("work_mode") || initialPreview.workMode,
      employmentType: label("employment_type") || initialPreview.employmentType,
      salaryMin: Number(data.get("salary_min")) || 0,
      salaryMax: Number(data.get("salary_max")) || 0,
      salaryPeriod: String(data.get("salary_period") || "monthly"),
      salaryType: String(data.get("salary_type") || "gross"),
      currency: String(data.get("salary_currency") || "NGN"),
      client: String(data.get("client_display_name") || ""),
    });
  }

  function validateStep(form: HTMLFormElement, activeStep: number) {
    const fields = Array.from(
      form.querySelectorAll<HTMLElement>(`[data-step="${activeStep}"] input, [data-step="${activeStep}"] select, [data-step="${activeStep}"] textarea`),
    );
    const nextErrors: FormErrors = {};
    (form.elements.namedItem("salary_max") as HTMLInputElement)?.setCustomValidity("");
    for (const field of fields) {
      const input = field as HTMLInputElement;
      if (!input.name || input.checkValidity()) continue;
      nextErrors[input.name] = input.validationMessage;
    }
    if (activeStep === 3) {
      const deadline = form.elements.namedItem("expires_at") as HTMLInputElement;
      deadline.min = tomorrow();
      if (!deadline.checkValidity()) nextErrors.expires_at = "Choose a future application deadline.";
    }
    if (activeStep === 2) {
      const min = Number(new FormData(form).get("salary_min"));
      const maxInput = form.elements.namedItem("salary_max") as HTMLInputElement;
      const max = Number(maxInput.value);
      maxInput.setCustomValidity(max < min ? "Maximum salary must be equal to or greater than minimum salary." : "");
      if (!maxInput.checkValidity()) nextErrors.salary_max = maxInput.validationMessage;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return false;
    }
    return true;
  }

  function fieldError(name: string) {
    return errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null;
  }

  function errorProps(name: string) {
    return { "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined };
  }

  function handleInput(form: HTMLFormElement, target: EventTarget & HTMLElement) {
    updatePreview(form);
    saveDraft(form);
    const name = (target as HTMLInputElement).name;
    if (name && errors[name]) setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  }

  function goNext(form: HTMLFormElement) {
    if (validateStep(form, step)) {
      setStep((current) => Math.min(3, current + 1));
      window.requestAnimationFrame(() => panelRef.current?.focus());
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (submittingRef.current || status === "success") return;
    if (step < 3) { goNext(form); return; }
    for (const part of [1, 2, 3]) { if (!validateStep(form, part)) { setStep(part); return; } }
    const data = new FormData(form);
    if (data.get("website")) return setStatus("success");
    if (event.timeStamp < 1500) {
      setStatus("error");
      setMessage("Please wait a moment and try again.");
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setStatus("error");
      setMessage("Job submissions are temporarily unavailable.");
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");
    setMessage("");
    track("job_submission_started");
    const payload = {
      contact_email: String(data.get("contact_email") || "").trim().toLowerCase(),
      title: String(data.get("title") || "").trim(),
      company_name: String(data.get("company_name") || "").trim(),
      location: String(data.get("location") || "").trim(),
      work_mode: data.get("work_mode"),
      employment_type: String(data.get("employment_type") || "").trim(),
      description: String(data.get("description") || "").trim(),
      salary_min: Number(data.get("salary_min")),
      salary_max: Number(data.get("salary_max")),
      salary_period: data.get("salary_period"),
      salary_type: data.get("salary_type"),
      salary_currency: data.get("salary_currency"),
      engagement_type: data.get("engagement_type"),
      submitter_type: data.get("submitter_type"),
      recruiter_company: String(data.get("recruiter_company") || "").trim() || null,
      client_display_name: String(data.get("client_display_name") || "").trim() || null,
      authority_confirmed: data.get("authority_confirmed") === "on",
      no_candidate_fees_confirmed: data.get("no_candidate_fees_confirmed") === "on",
      application_url: String(data.get("application_url") || "").trim(),
      expires_at: data.get("expires_at"),
      consented_at: new Date().toISOString(),
    };

    try {
      const { data: { session } } = await createBrowserSupabaseClient().auth.getSession();
      const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/job_submissions`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${session?.access_token ?? key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Submission failed");
      try { sessionStorage.removeItem(draftKey); } catch {}
      setSubmittedWithAccount(Boolean(session));
      setStatus("success");
      setMessage("Submitted for review. We normally review listings within 1–2 business days and will contact you at the private email provided.");
      track("job_submission_succeeded");
    } catch {
      setStatus("error");
      setMessage("We could not confirm whether this job was saved. Your entries are still here. Check with support before retrying to avoid a duplicate.");
    } finally { submittingRef.current = false; }
  }

  const validSalary = Number.isSafeInteger(preview.salaryMin) && Number.isSafeInteger(preview.salaryMax) && preview.salaryMin > 0 && preview.salaryMax >= preview.salaryMin;
  const salaryLine = validSalary ? `${money(preview.salaryMin, preview.currency)}–${money(preview.salaryMax, preview.currency)} per ${preview.salaryPeriod === "annual" ? "year" : "month"}` : "Enter a valid minimum and maximum salary to preview the range.";

  function editStep(nextStep: number) {
    setErrors({}); setStep(nextStep);
    window.requestAnimationFrame(() => panelRef.current?.focus());
  }

  if (status === "success") return <section className="wizard-panel" role="status"><h2>Job submitted for review</h2><p>{message || "Your submission has been received."}</p><p>It will appear on the job board only after approval.</p><nav className="connected-next" aria-label="Employer next steps">{submittedWithAccount ? <Link href="/hiring">Manage my listings</Link> : <span>Submitted as a guest. This job is not linked to an account.</span>}<Link href="/jobs">Browse jobs</Link></nav></section>;

  return (
    <form ref={formRef} className="job-wizard" noValidate onInput={(event) => handleInput(event.currentTarget, event.target as EventTarget & HTMLElement)} onSubmit={submit}>
      <p className="wizard-account-note" role="status">{accountState === "checking" ? "Checking sign-in..." : accountState === "signed-in" ? <>Signed in. Track this submission in <Link href="/hiring">Manage my listings</Link>.</> : <>Posting as a guest. <Link href="/hiring?from=post-a-job">Sign in to track your listing</Link>.</>}</p>
      <div className="wizard-draft-note"><p role="status">{draftNotice || "Your draft is saved in this browser tab as you type."}</p><button type="button" disabled={status === "submitting"} onClick={discardDraft}>Discard draft</button></div>
      <nav className="wizard-progress" aria-label="Job submission progress">
        {["Role", "Salary", "Application"].map((label, index) => {
          const number = index + 1;
          return <button aria-current={step === number ? "step" : undefined} disabled={number > step} className={step === number ? "current" : step > number ? "complete" : ""} key={label} onClick={() => number < step && (setErrors({}), setStep(number), window.requestAnimationFrame(() => panelRef.current?.focus()))} type="button"><span>{step > number ? <Check aria-hidden="true" /> : number}</span><strong>{label}</strong></button>;
        })}
      </nav>

      <div className="wizard-layout wizard-layout--simple">
        <section className="wizard-panel" ref={panelRef} tabIndex={-1} aria-label={`Step ${step} of 3`}>
          {Object.keys(errors).length > 0 && <div className="wizard-error-summary" ref={errorSummaryRef} role="alert" tabIndex={-1}><strong>Check the highlighted fields.</strong><span>{Object.keys(errors).length} {Object.keys(errors).length === 1 ? "answer needs" : "answers need"} your attention.</span></div>}
          <div data-step="1" hidden={step !== 1}>
            <p className="wizard-required-note">All fields are required.</p>
            <div className="wizard-fields">
              <label>Posting as<select name="submitter_type" required value={submitterType} onChange={(event) => setSubmitterType(event.target.value as "employer" | "recruiter")}><option value="employer">Direct employer</option><option value="recruiter">Recruiter or agency</option></select></label>
              <label>Job title<input name="title" required minLength={3} maxLength={120} {...errorProps("title")} />{fieldError("title")}</label>
              {submitterType === "recruiter" && <><label>Recruiting company<input name="recruiter_company" required minLength={2} maxLength={120} {...errorProps("recruiter_company")} />{fieldError("recruiter_company")}</label><label>Client shown publicly<input name="client_display_name" required minLength={2} maxLength={120} placeholder="Client name or Confidential employer" {...errorProps("client_display_name")} />{fieldError("client_display_name")}</label><label className="wizard-check wide"><input name="authority_confirmed" type="checkbox" required {...errorProps("authority_confirmed")} />I confirm that we have written authority to recruit for this position.{fieldError("authority_confirmed")}</label></>}
              <label>Company name<input name="company_name" required minLength={2} maxLength={120} {...errorProps("company_name")} />{fieldError("company_name")}</label>
              <label>Location<input name="location" required placeholder="Lagos, Nigeria" maxLength={120} {...errorProps("location")} />{fieldError("location")}</label>
              <label>Work arrangement<select name="work_mode" required><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
              <label>Employment type<select name="employment_type" required><option>Full time</option><option>Part time</option><option>Contract</option><option>Internship</option></select></label>
            </div>
          </div>

          <div data-step="2" hidden={step !== 2}>
            <p className="wizard-required-note">All fields are required.</p>
            <div className="wizard-fields">
              <label>Salary type<select name="salary_type" required><option value="gross">Gross, before deductions</option><option value="net">Net, after deductions</option></select><small>Gross includes PAYE, pension and other deductions.</small></label>
              <label>Salary currency<select name="salary_currency" required><option value="NGN">NGN, Nigerian naira</option><option value="USD">USD, US dollar</option><option value="GBP">GBP, British pound</option><option value="EUR">EUR, euro</option></select></label>
              <label>Minimum salary<span className="wizard-money"><b>{preview.currency}</b><input name="salary_min" type="number" min="1" step="1" required {...errorProps("salary_min")} /></span>{fieldError("salary_min")}<small>The lowest amount you will pay.</small></label>
              <label>Maximum salary<span className="wizard-money"><b>{preview.currency}</b><input name="salary_max" type="number" min="1" step="1" required {...errorProps("salary_max")} onChange={(event) => event.currentTarget.setCustomValidity("")} /></span>{fieldError("salary_max")}<small>Must be equal to or greater than minimum.</small></label>
              <label>Salary period<select name="salary_period" required><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
              <label>Engagement<select name="engagement_type" required><option value="employee">Employee</option><option value="contractor">Independent contractor</option></select></label>
              <div className="salary-preview wide"><span>How this appears to candidates</span><strong>{salaryLine}</strong>{validSalary && <small>{preview.salaryType === "net" ? "Net, after deductions" : "Gross, before deductions"}</small>}</div>
            </div>
          </div>

          <div data-step="3" hidden={step !== 3}>
            <p className="wizard-required-note">All fields are required.</p>
            <div className="wizard-fields">
              <label>Application deadline<input name="expires_at" type="date" min={tomorrow()} required {...errorProps("expires_at")} />{fieldError("expires_at")}<small>Choose a future date.</small></label>
              <label>Application link<input name="application_url" type="url" required placeholder="https://company.com/careers/..." {...errorProps("application_url")} />{fieldError("application_url")}</label>
              <label className="wide">Contact email<input name="contact_email" type="email" required placeholder="work@company.com" {...errorProps("contact_email")} />{fieldError("contact_email")}<small>Used to contact you about this submission; not displayed on the listing.</small></label>
              <label className="wide">Full job description<textarea name="description" required minLength={80} maxLength={8000} rows={8} placeholder="Describe responsibilities, requirements and what success looks like." {...errorProps("description")} />{fieldError("description")}<small>Minimum 80 characters. Be specific about the work, tools and impact.</small></label>
              <label className="wizard-check wide"><input name="no_candidate_fees_confirmed" type="checkbox" required {...errorProps("no_candidate_fees_confirmed")} />I confirm that candidates will not be charged any application, placement or processing fee.{fieldError("no_candidate_fees_confirmed")}</label>
              <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <section className="job-review" aria-labelledby="job-review-title">
              <h2 id="job-review-title">Review your listing</h2>
              <div><dl><dt>Role and company</dt><dd><strong>{preview.title}</strong><br />{preview.company}{submitterType === "recruiter" && preview.client && <><br />Client: {preview.client}</>}<br />{preview.location} · {preview.workMode} · {preview.employmentType}</dd></dl><button type="button" onClick={() => editStep(1)}>Edit role</button></div>
              <div><dl><dt>Salary</dt><dd><strong>{salaryLine}</strong>{validSalary && <><br />{preview.salaryType === "net" ? "Net, after deductions" : "Gross, before deductions"}</>}</dd></dl><button type="button" onClick={() => editStep(2)}>Edit salary</button></div>
            </section>
          </div>

          <div className="wizard-actions">
            {step > 1 && <button onClick={() => { setErrors({}); setStep((current) => Math.max(1, current - 1)); window.requestAnimationFrame(() => panelRef.current?.focus()); }} type="button">Back</button>}
            {step < 3 ? <button className="primary-button" onClick={(event) => { event.preventDefault(); goNext(event.currentTarget.form!); }} type="button">Next: {step === 1 ? "Salary details" : "Application details"}</button> : <button className="primary-button" disabled={status === "submitting"} type="submit">{status === "submitting" ? "Submitting…" : "Submit job for review"}</button>}
          </div>
          <p className={`form-message ${status === "error" ? "error" : ""}`} role="status">{message}</p>
        </section>

      </div>
    </form>
  );
}
