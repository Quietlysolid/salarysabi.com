"use client";

import { FormEvent, useRef, useState } from "react";
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
};

type FormErrors = Record<string, string>;

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
};

function money(value: number) {
  return value > 0 ? `₦${value.toLocaleString("en-NG")}` : "Not set";
}

export function JobSubmissionForm() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submitterType, setSubmitterType] = useState<"employer" | "recruiter">("employer");
  const [preview, setPreview] = useState<Preview>(initialPreview);
  const [errors, setErrors] = useState<FormErrors>({});
  const errorSummaryRef = useRef<HTMLDivElement>(null);

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
    });
  }

  function validateStep(form: HTMLFormElement, activeStep: number) {
    const fields = Array.from(
      form.querySelectorAll<HTMLElement>(`[data-step="${activeStep}"] input, [data-step="${activeStep}"] select, [data-step="${activeStep}"] textarea`),
    );
    const nextErrors: FormErrors = {};
    for (const field of fields) {
      const input = field as HTMLInputElement;
      if (!input.name || input.checkValidity()) continue;
      nextErrors[input.name] = input.validationMessage;
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
    const name = (target as HTMLInputElement).name;
    if (name && errors[name]) setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  }

  function goNext(form: HTMLFormElement) {
    if (validateStep(form, step)) {
      setStep((current) => Math.min(3, current + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateStep(form, 3)) return;
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
      const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/job_submissions`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Submission failed");
      setStatus("success");
      setMessage("Submitted for review. We normally review listings within 1–2 business days and will contact you at the private email provided.");
      track("job_submission_succeeded");
    } catch {
      setStatus("error");
      setMessage("We could not save this job. Please check the highlighted details and try again.");
    }
  }

  const salaryLine = `${money(preview.salaryMin)}–${money(preview.salaryMax)} per ${preview.salaryPeriod === "annual" ? "year" : "month"}`;

  return (
    <form className="job-wizard" noValidate onInput={(event) => handleInput(event.currentTarget, event.target as EventTarget & HTMLElement)} onSubmit={submit}>
      <nav className="wizard-progress" aria-label="Job submission progress">
        {["Role", "Pay", "Application"].map((label, index) => {
          const number = index + 1;
          return <button className={step === number ? "current" : step > number ? "complete" : ""} key={label} onClick={() => number < step && setStep(number)} type="button"><span>{step > number ? <Check aria-hidden="true" /> : number}</span><strong>{label}</strong></button>;
        })}
      </nav>

      <div className="wizard-layout wizard-layout--simple">
        <section className="wizard-panel">
          {Object.keys(errors).length > 0 && <div className="wizard-error-summary" ref={errorSummaryRef} role="alert" tabIndex={-1}><strong>Check the highlighted fields.</strong><span>{Object.keys(errors).length} {Object.keys(errors).length === 1 ? "answer needs" : "answers need"} your attention.</span></div>}
          <div data-step="1" hidden={step !== 1}>
            <p className="wizard-required-note">All fields are required.</p>
            <div className="wizard-fields">
              <label>I am a<select name="submitter_type" required value={submitterType} onChange={(event) => setSubmitterType(event.target.value as "employer" | "recruiter")}><option value="employer">Direct employer</option><option value="recruiter">Recruiter or agency</option></select></label>
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
              <label>Minimum salary<span className="wizard-money"><b>NGN</b><input name="salary_min" type="number" min="1" step="1" required {...errorProps("salary_min")} /></span>{fieldError("salary_min")}<small>The lowest amount you will pay.</small></label>
              <label>Maximum salary<span className="wizard-money"><b>NGN</b><input name="salary_max" type="number" min="1" step="1" required {...errorProps("salary_max")} onChange={(event) => event.currentTarget.setCustomValidity("")} /></span>{fieldError("salary_max")}<small>Must be equal to or greater than minimum.</small></label>
              <label>Salary period<select name="salary_period" required><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
              <label>Engagement<select name="engagement_type" required><option value="employee">Employee</option><option value="contractor">Independent contractor</option></select></label>
              <div className="salary-preview wide"><span>How this appears to candidates</span><strong>{salaryLine}</strong><small>{preview.salaryType === "net" ? "Net, after deductions" : "Gross, before deductions"}</small></div>
            </div>
          </div>

          <div data-step="3" hidden={step !== 3}>
            <p className="wizard-required-note">All fields are required.</p>
            <div className="wizard-fields">
              <label>Application deadline<input name="expires_at" type="date" min="2026-08-06" required {...errorProps("expires_at")} />{fieldError("expires_at")}<small>Must be after 5 August 2026.</small></label>
              <label>Application link<input name="application_url" type="url" required placeholder="https://company.com/careers/..." {...errorProps("application_url")} />{fieldError("application_url")}</label>
              <label className="wide">Contact email<input name="contact_email" type="email" required placeholder="work@company.com" {...errorProps("contact_email")} />{fieldError("contact_email")}<small>This stays private. Candidates will never see it.</small></label>
              <label className="wide">Full job description<textarea name="description" required minLength={80} maxLength={8000} rows={8} placeholder="Describe responsibilities, requirements and what success looks like." {...errorProps("description")} />{fieldError("description")}<small>Minimum 80 characters. Be specific about the work, tools and impact.</small></label>
              <label className="wizard-check wide"><input name="no_candidate_fees_confirmed" type="checkbox" required {...errorProps("no_candidate_fees_confirmed")} />I confirm that candidates will not be charged any application, placement or processing fee.{fieldError("no_candidate_fees_confirmed")}</label>
              <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
          </div>

          <div className="wizard-actions">
            {step > 1 && <button onClick={() => setStep((current) => Math.max(1, current - 1))} type="button">Back</button>}
            {step < 3 ? <button className="primary-button" onClick={(event) => goNext(event.currentTarget.form!)} type="button">Continue to {step === 1 ? "pay" : "application"}</button> : <button className="primary-button" disabled={status === "submitting"} type="submit">{status === "submitting" ? "Submitting…" : "Submit job for review"}</button>}
          </div>
          <p className={`form-message ${status === "error" ? "error" : status === "success" ? "success" : ""}`} role="status">{message}</p>
        </section>

      </div>
    </form>
  );
}
