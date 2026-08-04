select net.http_post(
  url := 'https://npiujcemzypvuuvnxfem.supabase.co/functions/v1/import-startup-jobs',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'job_alert_cron_secret')
  ),
  body := '{}'::jsonb
);
