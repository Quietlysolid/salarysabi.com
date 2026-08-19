alter table public.jobs drop constraint if exists jobs_salary_type_check;
alter table public.jobs add constraint jobs_salary_type_check
check (salary_type in ('gross', 'net', 'not_stated'));

insert into public.jobs (
  slug, title, company_name, location, work_mode, employment_type, description,
  salary_min, salary_max, salary_period, salary_type, salary_currency,
  salary_source, application_url, source_url, canonical_url, employer_verified,
  source_verified_at, source_last_seen_at, source_kind, source_name,
  source_job_id, global_remote, engagement_type, published_at, expires_at, status
) values
(
  'emerging-voices-exchanges-coordinator-us-embassy-abuja-2026-016',
  'Emerging Voices Exchanges Coordinator', 'U.S. Embassy Abuja', 'Abuja',
  'onsite', 'Full time',
  'The U.S. Embassy Abuja is hiring a Public Engagement Assistant to coordinate its Emerging Voices exchange work. This permanent, on-site role is open to all interested candidates. Read the official announcement for the duties, qualifications and application instructions.',
  25357, 25357, 'annual', 'not_stated', 'USD', 'employer_disclosed',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76240&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76240&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76240&orgId=87',
  false, now(), now(), 'official_page', 'U.S. Mission Nigeria', 'Abuja-2026-016', false, 'employee', now(), '2026-08-05', 'published'
),
(
  'procurement-agent-us-embassy-abuja-2026-014',
  'Procurement Agent', 'U.S. Embassy Abuja', 'Abuja',
  'onsite', 'Full time',
  'The U.S. Embassy Abuja is hiring two Procurement Agents in its General Services Office. These permanent, on-site roles are open to all interested candidates. Read the official announcement for the duties, qualifications and application instructions.',
  19951, 19951, 'annual', 'not_stated', 'USD', 'employer_disclosed',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76247&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76247&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76247&orgId=87',
  false, now(), now(), 'official_page', 'U.S. Mission Nigeria', 'Abuja-2026-014', false, 'employee', now(), '2026-08-05', 'published'
),
(
  'surveillance-detection-coordinator-us-embassy-abuja-2026-015',
  'Surveillance Detection Coordinator', 'U.S. Embassy Abuja', 'Abuja',
  'onsite', 'Full time',
  'The U.S. Embassy Abuja is hiring a Surveillance Detection Coordinator in its Regional Security Office. This permanent, on-site role is open to all interested candidates. Read the official announcement for the duties, qualifications and application instructions.',
  19951, 19951, 'annual', 'not_stated', 'USD', 'employer_disclosed',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76294&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76294&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76294&orgId=87',
  false, now(), now(), 'official_page', 'U.S. Mission Nigeria', 'Abuja-2026-015', false, 'employee', now(), '2026-08-05', 'published'
),
(
  'accounts-payable-technician-alternate-cashier-us-consulate-lagos-2026-017',
  'Accounts Payable Technician/Alternate Cashier', 'U.S. Consulate General Lagos', 'Lagos',
  'onsite', 'Full time',
  'The U.S. Consulate General Lagos is hiring an Accounts Payable Technician and Alternate Cashier in its Financial Management Center. This permanent, on-site role is open to all interested candidates. Read the official announcement for the duties, qualifications and application instructions.',
  19951, 19951, 'annual', 'not_stated', 'USD', 'employer_disclosed',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76160&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76160&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76160&orgId=87',
  false, now(), now(), 'official_page', 'U.S. Mission Nigeria', 'Lagos-2026-017', false, 'employee', now(), '2026-08-07', 'published'
),
(
  'economic-commercial-assistant-us-embassy-abuja-2026-018',
  'Economic & Commercial Assistant', 'U.S. Embassy Abuja', 'Abuja',
  'onsite', 'Full time',
  'The U.S. Embassy Abuja is hiring an Economic and Commercial Assistant in its Economic Office. This permanent, on-site role is open to all interested candidates. Read the official announcement for the duties, qualifications and application instructions.',
  31771, 31771, 'annual', 'not_stated', 'USD', 'employer_disclosed',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76399&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76399&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76399&orgId=87',
  false, now(), now(), 'official_page', 'U.S. Mission Nigeria', 'Abuja-2026-018', false, 'employee', now(), '2026-08-13', 'published'
),
(
  'protocol-assistant-us-consulate-lagos-2026-019',
  'Protocol Assistant', 'U.S. Consulate General Lagos', 'Lagos',
  'onsite', 'Full time',
  'The U.S. Consulate General Lagos is hiring a Protocol Assistant in its Executive Office. This permanent, on-site role is open to all interested candidates. Read the official announcement for the duties, qualifications and application instructions.',
  25357, 25357, 'annual', 'not_stated', 'USD', 'employer_disclosed',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76468&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76468&orgId=87',
  'https://erajobs.state.gov/dos-era/vacancy/viewVacancyDetail.hms?jnum=76468&orgId=87',
  false, now(), now(), 'official_page', 'U.S. Mission Nigeria', 'Lagos-2026-019', false, 'employee', now(), '2026-08-13', 'published'
)
on conflict (source_name, source_job_id) where source_job_id is not null do nothing;
