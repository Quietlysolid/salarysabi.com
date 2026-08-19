alter table public.jobs
  add column if not exists deadline_status text not null default 'employer_provided',
  add column if not exists transparency_score integer,
  add column if not exists transparency_notes text[] not null default '{}',
  add column if not exists verification_status text;

alter table public.jobs
  add constraint jobs_deadline_status_check
    check (deadline_status in ('employer_provided', 'verified', 'estimated', 'unknown', 'rolling')),
  add constraint jobs_transparency_score_check
    check (transparency_score is null or transparency_score between 0 and 100),
  add constraint jobs_verification_status_check
    check (verification_status in ('verified', 'pending', 'unverified'));

insert into public.jobs (
  slug, title, company_name, location, work_mode, employment_type, description,
  salary_min, salary_max, salary_period, salary_type, salary_currency,
  salary_source, application_url, source_url, canonical_url, employer_verified,
  source_verified_at, source_last_seen_at, source_kind, source_name,
  source_job_id, global_remote, engagement_type, published_at, expires_at, status,
  deadline_status, transparency_score, transparency_notes, verification_status
) values (
  'full-stack-developer-sigma-consulting-group-c3149656',
  'Full Stack Developer', 'Sigma Consulting Group', 'Lagos Island', 'remote', 'Full time',
  'Sigma Consulting Group is advertising a mid-level Full Stack Developer role supporting a financial-services platform. The work includes auditing and securing an existing codebase, building web and mobile features, integrating KYC/AML and payment services, and improving testing, CI/CD, monitoring and reliability. The listing asks for 3–5 years of experience, an HND or degree, and experience with React, React Native or Flutter plus Node.js/Express, Django or Laravel. Fintech, banking or transactional-systems experience is preferred. Applicants need stable internet and must attend biweekly virtual meetings.',
  500000, 700000, 'monthly', 'gross', 'NGN', 'source_reported',
  'https://ng.indeed.com/viewjob?jk=c3149656b9aa6080',
  'https://ng.indeed.com/viewjob?jk=c3149656b9aa6080',
  'https://ng.indeed.com/viewjob?jk=c3149656b9aa6080',
  false, '2026-08-10T12:00:00+01:00', '2026-08-10T12:00:00+01:00',
  'community_tip', 'Indeed', 'c3149656b9aa6080', false, 'employee', now(),
  '2026-08-24', 'published', 'unknown', 55,
  array[
    'Salary and remote arrangement are disclosed, but no application deadline is provided.',
    'Sigma Consulting Group appears to be recruiting for an unnamed financial-services client.',
    'The source contains an apparent “35 years” typo; the role overview states 3–5 years.',
    'The vacancy has not yet been independently confirmed with the recruiter.'
  ],
  'pending'
)
on conflict (source_name, source_job_id) where source_job_id is not null do update set
  source_verified_at = excluded.source_verified_at,
  source_last_seen_at = excluded.source_last_seen_at,
  transparency_score = excluded.transparency_score,
  transparency_notes = excluded.transparency_notes,
  verification_status = excluded.verification_status,
  deadline_status = excluded.deadline_status;

insert into public.jobs (
  slug, title, company_name, location, work_mode, employment_type, description,
  salary_min, salary_max, salary_period, salary_type, salary_currency,
  salary_source, application_url, source_url, canonical_url, employer_verified,
  source_verified_at, source_last_seen_at, source_kind, source_name,
  source_job_id, global_remote, engagement_type, published_at, expires_at, status,
  deadline_status, transparency_score, transparency_notes, verification_status
) values (
  'relationship-manager-birdview-travels-f6ad1453',
  'Relationship Manager', 'Birdview Travels & Tours', 'Ikeja, Lagos', 'hybrid', 'Full time',
  'Birdview Travels & Tours is seeking a Relationship Manager to manage new and existing client relationships, understand customer needs, recommend appropriate services, support retention and contribute to business growth. Applicants should have a bachelor’s degree in a relevant discipline and at least two years of experience in relationship management, sales, customer service or business development. The listing emphasizes communication, negotiation, organisation, CRM familiarity and a results-driven approach. Applications are requested by email to recruitment@birdviewtravels.com.',
  300000, 400000, 'monthly', 'not_stated', 'NGN', 'source_reported',
  'https://ng.indeed.com/viewjob?jk=f6ad145315774a88',
  'https://ng.indeed.com/viewjob?jk=f6ad145315774a88',
  'https://ng.indeed.com/viewjob?jk=f6ad145315774a88',
  false, '2026-08-10T12:00:00+01:00', '2026-08-10T12:00:00+01:00',
  'community_tip', 'Indeed', 'f6ad145315774a88', false, 'employee', now(),
  '2026-08-24', 'published', 'unknown', 80,
  array[
    'The ₦300,000–₦400,000 monthly salary is stated in the source, but the gross or net basis is not specified.',
    'No application deadline is provided; SalarySabi will review the listing again within two weeks.',
    'The application email uses the employer’s birdviewtravels.com domain.',
    'The vacancy has not yet been confirmed directly with the employer.'
  ],
  'pending'
)
on conflict (source_name, source_job_id) where source_job_id is not null do update set
  source_verified_at = excluded.source_verified_at,
  source_last_seen_at = excluded.source_last_seen_at,
  transparency_score = excluded.transparency_score,
  transparency_notes = excluded.transparency_notes,
  verification_status = excluded.verification_status,
  deadline_status = excluded.deadline_status;

insert into public.jobs (
  slug, title, company_name, location, work_mode, employment_type, description,
  salary_min, salary_max, salary_period, salary_type, salary_currency,
  salary_source, application_url, source_url, canonical_url, employer_verified,
  source_verified_at, source_last_seen_at, source_kind, source_name,
  source_job_id, global_remote, engagement_type, published_at, expires_at, status,
  deadline_status, transparency_score, transparency_notes, verification_status
) values (
  'relationship-manager-tro-vest-capital-partners-325ae905',
  'Relationship Manager', 'Tro-Vest Capital Partners', 'Lagos', 'hybrid', 'Full time',
  'Tro-Vest Capital Partners is advertising a Relationship Manager role focused on acquiring and managing high-net-worth, corporate and institutional clients. Responsibilities include growing assets under management, recommending investment products, conducting portfolio reviews, meeting revenue targets and supporting KYC, AML and SEC compliance. The listing requests a relevant bachelor’s degree and at least three years of relationship-management, client-services or business-development experience in asset management or investment banking.',
  400000, 900000, 'monthly', 'not_stated', 'NGN', 'source_reported',
  'https://ng.indeed.com/viewjob?jk=325ae9057dde8d34',
  'https://ng.indeed.com/viewjob?jk=325ae9057dde8d34',
  'https://ng.indeed.com/viewjob?jk=325ae9057dde8d34',
  false, '2026-08-10T12:00:00+01:00', '2026-08-10T12:00:00+01:00',
  'community_tip', 'Indeed', '325ae9057dde8d34', false, 'employee', now(),
  '2026-08-24', 'draft', 'unknown', 50,
  array[
    'The ₦400,000–₦900,000 monthly salary is stated, but the gross or net basis is not specified.',
    'No application deadline or direct application instructions are provided.',
    'The source description retains a template placeholder: “Lagos, Nigeria (or [Location])”.',
    'The company website contains conflicting history claims and the vacancy requires direct employer confirmation.'
  ],
  'pending'
)
on conflict (source_name, source_job_id) where source_job_id is not null do update set
  source_verified_at = excluded.source_verified_at,
  source_last_seen_at = excluded.source_last_seen_at,
  transparency_score = excluded.transparency_score,
  transparency_notes = excluded.transparency_notes,
  verification_status = excluded.verification_status,
  deadline_status = excluded.deadline_status,
  status = excluded.status;

insert into public.jobs (
  slug, title, company_name, location, work_mode, employment_type, description,
  salary_min, salary_max, salary_period, salary_type, salary_currency,
  salary_source, application_url, source_url, canonical_url, employer_verified,
  source_verified_at, source_last_seen_at, source_kind, source_name,
  source_job_id, global_remote, engagement_type, published_at, expires_at, status,
  deadline_status, transparency_score, transparency_notes, verification_status
) values (
  'operations-associate-doheney-services-a9d40319',
  'Operations Associate', 'Doheney Services', 'Gbagada, Lagos', 'onsite', 'Full time',
  'Doheney Services is advertising an Operations Associate position for an unnamed premium dessert brand. The role coordinates procurement, suppliers, production schedules, inventory, quality checks and final-mile delivery. Candidates should have two to three years of operations, logistics or supply-chain experience, preferably in food or hospitality, with strong attention to detail, problem-solving and vendor-management skills.',
  150000, 180000, 'monthly', 'net', 'NGN', 'source_reported',
  'https://ng.indeed.com/viewjob?jk=a9d40319124b76d4',
  'https://ng.indeed.com/viewjob?jk=a9d40319124b76d4',
  'https://ng.indeed.com/viewjob?jk=a9d40319124b76d4',
  false, '2026-08-10T12:00:00+01:00', '2026-08-10T12:00:00+01:00',
  'community_tip', 'Indeed', 'a9d40319124b76d4', false, 'employee', now(),
  '2026-08-17', 'draft', 'unknown', 50,
  array[
    'A matching Doheney advert reported ₦150,000–₦180,000 net monthly plus a weekly transport allowance.',
    'The end client is described only as a premium dessert brand and is not named.',
    'An earlier matching recruitment round closed on 15 May 2026; the current Indeed entry provides no replacement deadline.',
    'Doheney must confirm that the vacancy has reopened and that the reported compensation remains current.'
  ],
  'pending'
)
on conflict (source_name, source_job_id) where source_job_id is not null do update set
  source_verified_at = excluded.source_verified_at,
  source_last_seen_at = excluded.source_last_seen_at,
  transparency_score = excluded.transparency_score,
  transparency_notes = excluded.transparency_notes,
  verification_status = excluded.verification_status,
  deadline_status = excluded.deadline_status,
  status = excluded.status;

insert into public.jobs (
  slug, title, company_name, location, work_mode, employment_type, description,
  salary_min, salary_max, salary_period, salary_type, salary_currency,
  salary_source, application_url, source_url, canonical_url, employer_verified,
  source_verified_at, source_last_seen_at, source_kind, source_name,
  source_job_id, global_remote, engagement_type, published_at, expires_at, status,
  deadline_status, transparency_score, transparency_notes, verification_status
) values (
  'general-manager-chiluck-investment-b42435a3',
  'General Manager', 'Chiluck Investment', 'Port Harcourt, Rivers', 'onsite', 'Full time',
  'Chiluck Investment is advertising a General Manager position responsible for leading its real-estate operations, revenue growth and business performance. The role covers company strategy, sales, budgets, profitability, operational standards, team leadership, compliance and stakeholder relationships. Applicants should have a relevant bachelor’s degree, seven to ten years of progressive experience and at least three to five years in senior management, preferably with knowledge of the Nigerian real-estate market.',
  400000, 500000, 'monthly', 'not_stated', 'NGN', 'source_reported',
  'https://ng.indeed.com/viewjob?jk=b42435a341e0c636',
  'https://ng.indeed.com/viewjob?jk=b42435a341e0c636',
  'https://ng.indeed.com/viewjob?jk=b42435a341e0c636',
  false, '2026-08-10T12:00:00+01:00', '2026-08-10T12:00:00+01:00',
  'community_tip', 'Indeed', 'b42435a341e0c636', false, 'employee', now(),
  '2026-08-17', 'draft', 'unknown', 50,
  array[
    'The ₦400,000–₦500,000 monthly salary is stated, but the gross or net basis is not specified.',
    'Citybird Group appears as the advertiser while Chiluck Investment is named as the employer; their recruiting relationship is not explained.',
    'No application deadline is provided and applications are directed to a generic Gmail address.',
    'The description contains generic inserted reference text, so the vacancy requires direct confirmation.'
  ],
  'pending'
)
on conflict (source_name, source_job_id) where source_job_id is not null do update set
  source_verified_at = excluded.source_verified_at,
  source_last_seen_at = excluded.source_last_seen_at,
  transparency_score = excluded.transparency_score,
  transparency_notes = excluded.transparency_notes,
  verification_status = excluded.verification_status,
  deadline_status = excluded.deadline_status,
  status = excluded.status;

notify pgrst, 'reload schema';
