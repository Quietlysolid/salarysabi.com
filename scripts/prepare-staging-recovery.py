import json
import urllib.request
from staging_supabase import REF, ROOT, management, verify_target
verify_target()
fixture=json.loads((ROOT/'supabase/.temp/staging-verification.json').read_text())
key=next(k['api_key'] for k in management('/api-keys') if k['name']=='service_role')
request=urllib.request.Request(f'https://{REF}.supabase.co/auth/v1/admin/generate_link',method='POST',data=json.dumps({'type':'recovery','email':fixture['accounts']['bob']['email'],'redirect_to':'http://localhost:3002/account?recovery=1'}).encode(),headers={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'})
with urllib.request.urlopen(request) as response: link=json.load(response)
(ROOT/'supabase/.temp/staging-recovery.json').write_text(json.dumps({'link':link['action_link']}))
print('Prepared a staging recovery link; no email sent.')
