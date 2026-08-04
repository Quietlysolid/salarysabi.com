"use client";

import { FormEvent, useState } from "react";
import { track } from "./analytics";

export function JobSubmissionForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [submitterType, setSubmitterType] = useState<"employer" | "recruiter">(
    "employer",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
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
      contact_email: String(data.get("contact_email") || "")
        .trim()
        .toLowerCase(),
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
      recruiter_company:
        String(data.get("recruiter_company") || "").trim() || null,
      client_display_name:
        String(data.get("client_display_name") || "").trim() || null,
      authority_confirmed: data.get("authority_confirmed") === "on",
      no_candidate_fees_confirmed:
        data.get("no_candidate_fees_confirmed") === "on",
      application_url: String(data.get("application_url") || "").trim(),
      expires_at: data.get("expires_at"),
      consented_at: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/job_submissions`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Submission failed");
      form.reset();
      setStatus("success");
      setMessage(
        "Submitted for review. We will check the employer, salary and application link before publishing it.",
      );
      track("job_submission_succeeded");
    } catch {
      setStatus("error");
      setMessage(
        "We could not save this job. Please check the details and try again.",
      );
    }
  }

  return (
    <form className="job-submit-form" onSubmit={submit}>
      <div className="job-form-grid">
        <label>
          Submitting as
          <select
            name="submitter_type"
            required
            value={submitterType}
            onChange={(event) =>
              setSubmitterType(event.target.value as "employer" | "recruiter")
            }
          >
            <option value="employer">Direct employer</option>
            <option value="recruiter">Recruiter or agency</option>
          </select>
        </label>
        {submitterType === "recruiter" && (
          <>
            <label>
              Recruiting company
              <input
                name="recruiter_company"
                required
                minLength={2}
                maxLength={120}
              />
            </label>
            <label>
              Client shown publicly
              <input
                name="client_display_name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Client name or Confidential employer"
              />
            </label>
            <label className="admin-check wide">
              <input name="authority_confirmed" type="checkbox" required />I
              confirm that we have written authority to recruit for this
              position.
            </label>
          </>
        )}
        <label>
          Job title
          <input name="title" required minLength={3} maxLength={120} />
        </label>
        <label>
          Company name
          <input name="company_name" required minLength={2} maxLength={120} />
        </label>
        <label>
          Location
          <input
            name="location"
            required
            placeholder="Lagos or Nigeria"
            maxLength={120}
          />
        </label>
        <label>
          Work arrangement
          <select name="work_mode" required>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </label>
        <label>
          Employment type
          <select name="employment_type" required>
            <option>Full time</option>
            <option>Part time</option>
            <option>Contract</option>
            <option>Internship</option>
          </select>
        </label>
        <label>
          Salary is
          <select name="salary_type" required>
            <option value="gross">Gross, before deductions</option>
            <option value="net">Net, after deductions</option>
          </select>
        </label>
        <label>
          Salary currency
          <select name="salary_currency" required>
            <option value="NGN">NGN, Nigerian naira</option>
            <option value="USD">USD, US dollar</option>
            <option value="GBP">GBP, British pound</option>
            <option value="EUR">EUR, euro</option>
          </select>
        </label>
        <label>
          Engagement
          <select name="engagement_type" required>
            <option value="employee">Employee</option>
            <option value="contractor">Independent contractor</option>
            <option value="unknown">Not confirmed</option>
          </select>
        </label>
        <label>
          Minimum salary
          <input name="salary_min" type="number" min="1" step="1" required />
        </label>
        <label>
          Maximum salary
          <input name="salary_max" type="number" min="1" step="1" required />
        </label>
        <label>
          Salary period
          <select name="salary_period" required>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </label>
        <label>
          Application deadline
          <input name="expires_at" type="date" required />
        </label>
        <label className="wide">
          Application link
          <input
            name="application_url"
            type="url"
            required
            placeholder="https://company.com/careers/..."
          />
        </label>
        <label className="wide">
          Contact email
          <input
            name="contact_email"
            type="email"
            required
            placeholder="work@company.com"
          />
        </label>
        <label className="wide">
          Full job description
          <textarea
            name="description"
            required
            minLength={80}
            maxLength={8000}
            rows={8}
          />
        </label>
        <label className="admin-check wide">
          <input name="no_candidate_fees_confirmed" type="checkbox" required />I
          confirm that candidates will not be charged any application, placement
          or processing fee.
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="job-form-note">
        Salary disclosure is required. Recruitment fees, referral schemes and
        jobs without a working application link are not accepted.
      </p>
      <button
        className="primary-button"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Submitting..." : "Submit job for review"}
      </button>
      <p
        className={status === "error" ? "form-message error" : "form-message"}
        role="status"
      >
        {message}
      </p>
    </form>
  );
}
