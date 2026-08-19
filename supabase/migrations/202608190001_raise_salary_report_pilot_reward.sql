-- Make the founding offer meaningful enough to justify review and payout friction.
update public.contribution_campaigns
set reward_kobo = 100000,
    budget_kobo = 2000000,
    target_approved = 20,
    title = 'Founding salary-report pilot',
    description = 'Earn NGN 1,000 after a two-minute anonymous salary report is approved.',
    eligibility_note = 'First 20 approved reports. One paid report per person.'
where slug = 'salary-pilot-2026';
