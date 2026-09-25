# SalarySabi authentication emails

`confirmation.html` and `recovery.html` are the live Supabase Auth templates, updated 24 September 2026. Rebuild both with `python scripts/build-auth-email-templates.py`.

Both use the existing SalarySabi wordmark (PNG captured from the site's rendered logo), inline email styles, presentation tables, one primary action, and a fallback link to that same action. Preserve both `{{ .ConfirmationURL }}` placeholders when editing. No tracking or marketing content is included.

The current source PNG is `public/email/salarysabi-logo-v2.png`. The export includes the transformed SVG bounds plus padding to preserve the full S curve; cropping to the wordmark's text container clipped the earlier export. Its new live URL avoids cached copies of the earlier image. It is hosted in the production Supabase `email-assets` public bucket; this bucket contains public branding, not user information. No public upload policy was added.

Deployment uses only these Auth configuration keys:

- `mailer_templates_confirmation_content`
- `mailer_templates_recovery_content`
- `mailer_subjects_confirmation`: Confirm your SalarySabi email
- `mailer_subjects_recovery`: Reset your SalarySabi password

Production settings were read back and matched the local templates. SMTP credentials, redirect rules and authentication behavior were unchanged. The previous templates are backed up locally under ignored `supabase/.temp`.

Validation: rendered both templates at 600px and 375px, checked logo loading and horizontal overflow, and inspected the mobile preview. Fresh confirmation (hello) and recovery (Gmail) samples arrived in the owner's inbox at 22:32 UTC; received HTML contains the new logo and button styling. The first confirmation sample retained the old subject while using the new body during configuration rollout. This is not an exhaustive Outlook/dark-mode email-client test.

Staging still uses Supabase's default email provider, which rejected custom templates on its free tier; its templates were not changed. Local previews cover layout without enabling staging email delivery.

Logo follow-up: the sample delivered at 22:35 UTC still embedded the old PNG URL despite the configuration read-back showing v2. The 22:43 UTC recovery email was inspected in Gmail and contains `salarysabi-logo-v2.png` with 195×45 display dimensions. The public image was downloaded and visually checked: the complete left S curve and surrounding padding are present. Verify received HTML after configuration propagation; immediate config read-back alone is insufficient.
