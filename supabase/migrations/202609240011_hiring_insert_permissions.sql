-- Supabase default table grants are broader than column grants: revoke the table
-- INSERT grant before granting only the employer-supplied fields.
revoke insert on public.job_submissions from anon, authenticated;
grant insert (contact_email,title,company_name,location,work_mode,employment_type,
  description,salary_min,salary_max,salary_period,salary_type,salary_currency,
  engagement_type,submitter_type,recruiter_company,client_display_name,
  authority_confirmed,no_candidate_fees_confirmed,application_url,expires_at,consented_at)
on public.job_submissions to anon,authenticated;
alter policy "allow anonymous job submission" on public.job_submissions
with check (review_status='pending' and owner_user_id is null
  and published_job_id is null and expires_at >= current_date);


notify pgrst, 'reload schema';
