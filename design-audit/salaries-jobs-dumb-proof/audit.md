# Salaries & jobs dumb-proof audit

Date: 2026-08-19

## Scope

Can a first-time visitor quickly choose between comparing salaries and finding a salary-transparent job on `/salaries-and-jobs` at desktop and mobile widths?

## Evidence

1. [Desktop](./01-desktop.png) — healthy layout, but the three equal paths blur the two primary user goals.
2. [Mobile](./02-mobile.png) — technically clean and readable, but descriptions disappear and make the job workspace path less self-explanatory.

## Verdict

Not 100% dumb-proof yet. The page is polished and functional, and all five visible destinations return successfully, but a new visitor still has to interpret marketing language and choose among three equally weighted paths.

## Strengths

- The two main actions—compare salaries and find jobs—are visible without scrolling on desktop.
- Cards and buttons have large click targets and clear visual boundaries.
- Mobile reflow is clean; no clipping or horizontal scrolling is visible.
- All primary and contribution destinations respond successfully.

## Highest-impact issues

1. `Know your worth before your next move` is memorable, but less literal than `Compare salaries or find jobs with pay`.
2. Three equal cards imply three equally important starting choices. `Keep track of your search` is a secondary/account feature and should follow the jobs path rather than compete with it.
3. Mobile removes every card description. `Open your job workspace` then asks a first-time user to understand a feature that has not been explained.
4. CTA language is longer and less consistent than the card titles: `Explore salary benchmarks` and `Browse salary-transparent jobs` introduce new terminology instead of repeating `Compare salaries` and `Find jobs with salaries`.
5. The contribution banner becomes a large second decision area before the footer. It competes with the page's primary goal and can be reduced to one short prompt or moved after useful salary/job content.

## Accessibility risks

- Visible contrast and reflow look acceptable in these screenshots.
- Keyboard focus, screen-reader names, semantic heading order, and zoom behavior cannot be confirmed from screenshots alone and still require interactive testing.

## Recommended structure

- Heading: `Compare salaries or find jobs with pay`
- Two primary cards only: `Compare salaries` and `Find jobs with salaries`
- Buttons: `Compare salaries` and `Find jobs`
- Place `Track my applications` as a smaller link under the jobs card.
- Keep one short contribution prompt below the main choices.
