# SalarySabi product design audit and implementation tracker

**Document role:** Canonical source of truth  
**Last reconciled:** 7 August 2026  
**Status vocabulary:** Complete, Partial, Not started, Needs verification, Superseded

This document combines the original site-wide audit, the later holistic audit, subsequent page redesigns, implementation work, and known production feedback. Update this file whenever a listed finding changes status. Supporting audit folders contain evidence, not competing status records.

## Current verdict

SalarySabi has a distinctive rectangular visual identity, clear Nigerian PAYE positioning, and substantially improved public pages. The original seven recommendations are mostly implemented, and the release-blocking disclaimer collision has been fixed. The product is not yet finished as one coherent system: jobs still has a reported real-world loading problem, accessibility needs interactive verification, several mobile journeys need refinement, and the accumulated CSS and page patterns need consolidation.

## Status summary

Of the original seven recommendations, five are complete or superseded by a stronger solution and two are partially complete. The later holistic findings are tracked individually below because several span multiple routes and should not be reduced to a misleading completion count. A completed code path can still require verification in authenticated, data-dependent, mobile, or assistive-technology states.

## Original audit recommendations

| Finding | Status | Current implementation | Remaining work |
| --- | --- | --- | --- |
| Jobs needs retryable loading and error handling that preserves filters | **Partial** | Loading, cached, error and ready states exist. Retry preserves filters, requests have an eight-second timeout, loading no longer reports zero jobs, and sorting is disabled while unavailable. | A user has still reported that `/jobs` does not load or is slow. Direct production page and Supabase checks were fast, so the browser hydration and client request path still needs diagnosis and real-browser verification. |
| Calculator example can be mistaken for a personal result | **Superseded / Complete** | The guided homepage hides the result until the visitor calculates instead of relying on a stronger example label. | Verify announcements and focus when the result appears. |
| Employer form exposes too much at once | **Complete** | `/post-a-job` is divided into Role, Pay and Application steps. | Improve mobile sequencing and clarify save-and-return expectations. |
| Account entry choices and trust information are unequal | **Complete** | Sign-in and account creation have equal treatment, supporting instructions, privacy reassurance, workspace preview, shared footer and bounded session fallback. | Verify authenticated, expired-session, failure and recovery states. |
| Navigation lacks current-page state | **Complete** | Shared route-aware navigation exposes current location visually and with `aria-current`. | Improve section taxonomy and child-page location cues. |
| Long guidance and policy pages need compact navigation | **Partial** | Methodology and deductions have strong structured navigation and anchored relationships. | Make privacy, disclaimer and tax-band navigation equally predictable and create a PAYE guide index. |
| Contrast, focus treatment and mobile stacking need strengthening | **Complete for sampled public routes** | Playwright verification covered 15 representative desktop and mobile states. Confirmed issues were fixed: helper and footer contrast, dark-panel accents, compact targets and mobile employer sequencing. Final samples had visible focus, named controls, valid heading order, no horizontal overflow and no detected normal-text contrast failures. | Test real assistive technologies, native 200% and 400% zoom, authenticated states and complete submission/recovery flows. |

## Page and journey tracker

### Homepage and calculator

**Status: Complete with verification remaining**

- Implemented the guided Pay Journey homepage with Calculate PAYE, Check the payslip and Understand the result stages.
- Removed the oversized pre-calculation result from the guided homepage.
- Added guide relationships and a separate jobs pathway.
- Optional deductions link to matching sections of the deductions guide.
- Calculator values now remain in browser-local storage, salary carries into the payslip checker, and deduction-guide returns restore the originating field and focus.
- Remaining: verify dynamic result accessibility with assistive technology.

### Payslip checker

**Status: Partial, core public accessibility checks complete**

- Implemented a clearer two-panel comparison and more useful empty state.
- Remaining: clarify treatment of unusual payslip items, reconsider deduction controls appearing after the primary action, reduce empty-state weight where needed, and verify result announcements.

### Jobs discovery

**Status: Partial, production verification required**

- Implemented loading, ready, cached and error states, retry, timeout, filter preservation and honest result messaging.
- Moved initial listings from a browser-only cross-origin request into the server-rendered `/jobs` response with five-minute revalidation.
- Routed client retries through the same-origin `/api/jobs` endpoint while retaining local cached fallback.
- Verified locally that the endpoint returns listings and the initial page HTML contains job cards before hydration.
- Collapsed mobile filters behind an accessible rectangular `Filter jobs` control.
- Remaining: deploy and verify the original loading report across production browsers, then connect empty/error states more directly to the two job-submission actions.

### Post a job

**Status: Partial**

- Implemented the Role, Pay and Application wizard structure.
- The active form now appears before guidance on mobile, and native required-field validation focuses the first invalid input.
- Remaining: make disabled navigation unmistakable, explain save-and-return behavior, and test complete submission and server-recovery states.

### Send us a job

**Status: Partial**

- The short community-submission flow is focused and usable.
- Remaining: align it with the employer-flow shell, clarify required and optional fields, explain review timing and duplicates, and distinguish its audience and outcome from `Post a job`.

### Account and job workspace

**Status: Partial**

- Implemented a balanced account gateway, trust copy, preview, footer and time-bounded session loading fallback.
- Extracted the authenticated workspace into a data-independent UI component and exercised populated saved-job, application and alert states plus removal and status-change transitions through a guarded local-only browser fixture.
- Remaining: verify expired real Supabase sessions, permission failures and recovery against a dedicated non-production test project.

### PAYE methodology

**Status: Complete with refinement remaining**

- Implemented the worked-example ledger as the main explanation of how PAYE is calculated.
- Deductions are summarized and linked to the focused deductions guide.
- Remaining: strengthen the connection to a visitor's own result, ensure the rule rail is not missed, and centralize the authoritative rent-relief formula on one page.

### Eligible deductions

**Status: Complete with refinement remaining**

- Implemented a practical reference table with anchors for pension, NHF, NHIS, mortgage interest, life assurance and rent relief.
- Calculator inputs link directly to relevant anchors, and the guide returns users to the PAYE calculation.
- Returning users now regain the exact browser-local calculator state and originating field focus.
- Remaining: reduce long-scan burden and distinguish source information from eligibility confidence.

### Tax bands

**Status: Complete with verification remaining**

- Connected the page to the shared PAYE guide system and guide index.
- Added a worked ₦6 million chargeable-income example that divides income proportionally across the 0%, 15% and 18% bands, shows the arithmetic and distinguishes marginal rate from effective rate.
- Defined `maximum tax in band`, added explicit income ranges and made the reference table scan cleanly on mobile.
- Remaining: verify the example with assistive technology and keep the displayed bands synchronized with the calculator ruleset.

### Privacy

**Status: Complete with verification remaining**

- Preserved the selected rectangular ledger while adding a three-link page index and a four-answer plain-language path before the complete policy.
- Separated the complete reference with a clear heading, shortened repeated mobile labels, strengthened row grouping and reduced mobile padding.
- Made the privacy request the primary bottom action and the calculator return a secondary path.
- Remaining: verify the mail action in deployed environments and review the full policy with legal counsel when service providers change.

### Disclaimer

**Status: Complete with refinement remaining**

- Implemented the selected estimate-evidence ledger.
- Fixed the release-blocking shared `.evidence-row` collision by separating methodology styling.
- Verified the repaired layout at desktop and mobile sizes.
- Remaining: consider a more immediately understandable title and keep regression coverage for shared CSS selectors.

### Administrator entry

**Status: Complete locally with authenticated verification remaining**

- Implemented a branded restricted-workspace entry, clear internal-purpose and access messaging, secure-session reassurance, public-site escape path, session checking, sign-in progress, generic credential failure copy and dashboard retry or account-switch recovery.
- The authenticated dashboard now identifies the signed-in account and warns that changes affect public listings.
- Added a privacy-first product analytics foundation: aggregated 30-day activity, exact account totals, comparison periods, daily activity, top pages and referral sources appear in the restricted workspace after the local migration. Optional PostHog forwarding supports deeper funnels without autocapture, replay, cookies or persistent visitor identifiers.
- Remaining: exercise authorized, forbidden, expired-session and partial-data failure states against a dedicated non-production administrator account.

## Cross-product tracker

### Product architecture and navigation

| Work item | Status | Notes |
| --- | --- | --- |
| Establish clear Pay, Jobs, Guides and Account taxonomy | **Partial** | Shared navigation exists, but product relationships remain implicit. |
| Create a PAYE guide index | **Complete locally** | `/paye-guide` now explains the distinct purpose of methodology, deductions and tax bands. Global and mobile navigation point to the index, and every child route has a shared guide trail with current-page state. |
| Clarify `My jobs` | **Complete locally** | The destination is now `Job workspace` across primary, mobile, footer, job-detail and authenticated surfaces, matching saved jobs, applications and alerts. |
| Distinguish community submission from employer posting | **Complete locally** | Jobs CTAs identify job seekers versus employers, both routes explain ownership and review outcome, and each route links to the correct alternative path. |
| Add child-location cues for guide and legal routes | **Partial** | Route state exists; hierarchy remains weak. |

### Design system and engineering

| Work item | Status | Notes |
| --- | --- | --- |
| Apply rectangular geometry across public pages | **Complete** | This is now a recognizable SalarySabi trait. |
| Document the design system | **Complete** | See `docs/design-system.md`. |
| Unify widths, hero spacing, headings, buttons, dividers and footers | **Partial, core shell complete** | Homepage, jobs, account, employer/community entry, payslip checker, PAYE guide and shared information pages now use `PublicPageShell`, which owns the header/footer landmarks. Route-owned content widths and older hero generations still need incremental consolidation. |
| Scope shared CSS and remove duplicate page implementations | **Partial, critical collision protected** | The disclaimer ledger now uses a route-owned `disclaimer-ledger-` namespace. Source tests prevent reuse across methodology and privacy, browser tests protect desktop/mobile grids, and `audit:css` rejects the old generic evidence selectors and growth beyond current duplicate budgets. Legacy global duplication remains for incremental migration. |
| Create shared loading, empty, error and recovery patterns | **Complete for jobs and account** | `ProductState` now supplies consistent semantics, geometry, copy hierarchy, actions and recovery links for loading, empty, error and cached states. Remaining form submission messages stay field/workflow-specific. |
| Consolidate verification dates and trust language | **Complete locally** | Ruleset, verification and legal-content dates now come from named tokens in `src/lib/site.ts`; homepage, calculator, payslip checker, privacy and disclaimer consume that source. |

### Continuity and conversion

| Work item | Status | Notes |
| --- | --- | --- |
| Carry salary from calculator to payslip checker | **Complete locally** | A calculated monthly salary or annual salary converted to monthly is prefilled only when the visitor follows the explicit payslip-checker action. Imported context is disclosed and can be cleared. |
| Restore deduction context and focus after guide visits | **Complete locally** | Values, periods, open deduction groups and the originating field are restored from browser-local storage; focus returns to that field. |
| Connect methodology to a visitor's current result | **Not started** | Current worked example remains generic. |
| Present jobs, applications, alerts and saved jobs as one journey | **Complete locally** | `Job workspace` taxonomy is consistent and the populated authenticated UI, status changes, removal states and job-detail actions are covered by guarded browser fixtures. Real-backend failure verification remains separate. |

### Accessibility and content

| Work item | Status | Notes |
| --- | --- | --- |
| Improve visible labels, focus and contrast | **Complete for sampled routes** | Final automated pass found no detected normal-text failures or unlabeled visible controls; sampled focus indication was visible. |
| Test keyboard order and menus | **Partial** | Representative sequences and the mobile menu pass; full-route and assistive-technology traversal remains. |
| Test screen-reader announcements and reading order | **Partial** | Live-region and DOM structure checks pass; real screen-reader output remains unverified. |
| Test 200% zoom and reflow | **Partial** | Representative 500px reflow has no horizontal overflow; native 200% and 400% zoom remain. |
| Associate validation errors with fields | **Partial** | Native employer validation focuses the first invalid field; server and custom error announcements remain. |
| Define technical terms consistently | **Partial** | Terms such as annual emolument, chargeable income, JRB and maximum tax in band need consistent explanations. |
| Simplify dense legal and reference tables | **Complete for privacy and PAYE references** | Privacy now has a short answer path before its full ledger; deductions and tax bands use route-specific responsive references. Other long-form content remains subject to normal refinement. |

## Prioritized remaining work

### P1: Resolve before calling the experience finished

1. Deploy and production-verify the server-rendered `/jobs` loading fix across representative browsers.
2. Complete real assistive-technology, native zoom, authenticated-state and submission-recovery verification.
3. Continue incremental CSS extraction beyond the now-protected disclaimer, methodology and privacy ledger families.
4. Verify mobile jobs filter disclosure, keyboard behavior and result announcements.
5. Put the post-a-job form before supporting guidance on mobile.

### P2: Product coherence

6. **Complete locally:** the tax-band page now explains marginal taxation visually within the connected guide system.
7. **Complete locally:** calculator context now carries into the payslip checker and returns from deduction guidance with field focus restored.
8. **Complete locally for core public surfaces:** shared page shell, product-state patterns and central trust metadata now cover the active pay, guide, jobs, account and posting journeys. Older route-owned content grids remain an incremental CSS task rather than separate system contracts.
9. **Complete locally:** navigation now names the private `Job workspace`; job seekers share existing official listings while employers and recruiters post their own roles, with audience and outcome stated across entry points.
10. **Complete locally:** privacy now provides a short plain-language route, compact mobile labels, clearer reference hierarchy and a primary privacy-request action while retaining the complete ledger.

### P3: Verification and refinement

11. **Complete locally without production mutations:** populated job details use live read-only listings; authenticated saved-job, application, alert and job-action states are exercised through real UI components in a fixture route that is 404 unless the test environment explicitly enables it.
12. **Complete locally without external side effects:** PDF and spreadsheet downloads, multi-step employer validation and success, community submission validation, success, failure and input-preserving recovery pass in desktop/mobile browsers. Job-alert email construction is covered for recipients, escaping, unsubscribe content and idempotency; a real provider delivery remains a post-deployment smoke test using an approved test inbox.
13. **Complete locally:** raised key interface labels to a readable 12px minimum, made inline and index links persistently identifiable, consolidated the homepage's repeated trust rail into one assurance line, and tightened excessive page-end and section spacing without changing the rectangular visual system.
14. **Complete locally:** brought the administrator entry into a branded internal-product pattern with restricted-access context, session reassurance, clear public-site escape, sign-in progress and authenticated recovery actions.
15. **Complete locally:** resolved the August whole-app responsive findings. Disclaimer actions remain visible on mobile; the authenticated workspace stacks its identity and full-width sign-out action; methodology and deduction endings use matched rectangular controls; the calculated homepage restores a balanced two-column result workspace; job actions meet the 44px touch-target floor; footer wordmarks do not wrap; mobile tax bands use labeled cards; long reference routes use compact sticky section navigation; and meaningful supporting labels use a 12px mobile minimum.

## Strengths to preserve

- Distinctive square and rectangular visual language.
- Strong dark-green palette and lime accent.
- Clear positioning around Nigerian PAYE and salary transparency.
- Plain-language headings and visible form labels.
- Strong methodology transparency, source material and verification dates.
- Privacy reassurance that calculator values remain in the browser.
- Clear separation between PAYE methodology and practical deduction guidance.

## Scope and evidence limits

The combined audit covers the public navigation, homepage and calculator, payslip checker, jobs, account entry, employer and community-submission flows, PAYE methodology, deductions, tax bands, privacy, disclaimer and administrator entry. Evidence includes local desktop and representative mobile screenshots plus targeted source and production checks.

Authenticated account content, populated job-detail and job-workspace states, submitted forms, validation failures, exports, email delivery, persistent real-network recovery, complete keyboard navigation and screen-reader output have not all been exercised. Screenshot review does not establish WCAG compliance.

## Supporting evidence

- Original captures: `design-audit/`
- Revised initial-audit captures: `design-audit/fixed/`
- Holistic captures and historical audit: `design-audit/holistic-current/`
- Current interactive accessibility evidence: `design-audit/accessibility-current/`
- August responsive-fix evidence: `design-audit/whole-app-current/fixes-*.png`
- Design-system reference: `docs/design-system.md`
- CSS ownership and migration rules: `docs/css-ownership.md`

The historical holistic audit is retained for provenance. Its statuses are superseded by this document.
