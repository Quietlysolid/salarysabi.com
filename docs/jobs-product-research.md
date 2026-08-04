# SalarySabi Jobs: parity plus differentiation

Research checked 4 August 2026. Observations below describe publicly visible
product behaviour; they are not claims about user demand.

## What established platforms already provide

| Capability | Public evidence | SalarySabi requirement |
| --- | --- | --- |
| Keyword and location discovery | Jobberman and MyJobMag expose search and location/category pages | Match |
| Remote-job discovery | Jobberman and MyJobMag maintain dedicated remote-job pages | Match |
| Employment and experience filters | Jobberman exposes work type and experience level filters | Match |
| Salary information on some roles | Jobberman, MyJobMag and HotNigerianJobs display pay on some listings | Match, then require it |
| Alerts | Jobberman and MyJobMag advertise job notifications/alerts | Match |
| Employer posting and applications | Jobberman and Fuzu provide employer recruitment products | Match incrementally |
| Career/profile tools | Fuzu offers profiles, matching and a learning hub | Later parity, not initial launch |

## Observable openings

These are differences demonstrated by the public pages reviewed, not proof that
users will choose SalarySabi because of them.

1. Salary disclosure is inconsistent across the market. Public result pages mix
   jobs with numeric salary ranges and jobs without them. SalarySabi will require
   a minimum and maximum for every published role.
2. Salary basis is inconsistent. Listings may say gross, net or give a number
   without a basis. SalarySabi will require `gross` or `net` and a monthly or
   annual period.
3. No reviewed platform connected a disclosed gross salary to a transparent
   Nigerian PAYE preview on the job card. SalarySabi can do this with its existing
   calculation engine.
4. Freshness is important for both users and search engines. SalarySabi will show
   the last source-check date and application deadline and will hide expired jobs.
5. Verification language can be more precise. SalarySabi distinguishes a checked
   source from a verified employer instead of using one undifferentiated trust mark.
6. Direct application provenance can be explicit. SalarySabi will show that the
   user is leaving for an employer-controlled application route.

## Current MVP

- Keyword, location, work-mode and employment-type search
- Minimum-salary filter and newest/highest-pay sorting
- Required salary range, basis and period
- PAYE preview for gross salaries
- Source-check, employer-verification and expiry indicators
- External application link
- Email job-alert capture
- Employer job-submission form
- Private moderation queue and public approved-jobs table
- Aggregate apply, alert and submission analytics

## Required parity roadmap

1. Individual, indexable job-detail pages with `JobPosting` structured data
2. Pagination and server-side full-text search
3. Job seeker accounts, saved jobs and application tracking
4. Employer accounts, company pages and job-management dashboard
5. Email verification, alert delivery and unsubscribe flow
6. Automated expiry checks, broken-link monitoring and duplicate detection
7. Employer-domain verification and abuse-reporting workflow
8. CV/profile tools and matching after the listing marketplace has supply

## Source and policy notes

- Jobberman remote listings and filters: https://www.jobberman.com/jobs/remote
- MyJobMag remote listings: https://www.myjobmag.com/jobs-by-type/remote
- HotNigerianJobs current listings: https://www.hotnigerianjobs.com/alljobs/0/latest-nigerian-jobs
- Fuzu Nigeria product: https://www.fuzu.com/nigeria
- Jobberman prohibits scraping without prior written approval:
  https://www.jobberman.com/terms
- Google job-posting requirements, including complete detail pages and expired-job
  handling:
  https://developers.google.com/search/docs/appearance/structured-data/job-posting

Do not republish third-party job-board data without permission. Initial supply
should come from employer submissions, licensed feeds or employer career pages
where republication is authorized.
