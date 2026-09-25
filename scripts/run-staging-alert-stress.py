"""Use existing CLI credentials; never print keys or run against production."""
import os
import subprocess
import sys
import staging_supabase as db

db.verify_target()
key = next(k['api_key'] for k in db.management('/api-keys') if k['name'] == 'service_role')
secret = db.query("select decrypted_secret from vault.decrypted_secrets where name='job_alert_cron_secret'")[0]['decrypted_secret']
script = sys.argv[1] if len(sys.argv)>1 else 'scripts/stress-staging-alerts.mjs'
assert script in ('scripts/stress-staging-alerts.mjs', 'scripts/verify-alert-edge-runtime.mjs', 'scripts/verify-scheduled-workers.mjs', 'scripts/verify-maintenance-edge.mjs')
subprocess.run(['node', '--experimental-strip-types', script],
    env=dict(os.environ, STAGING_ALERT_SERVICE_KEY=key, STAGING_ALERT_CRON_SECRET=secret), check=True)
