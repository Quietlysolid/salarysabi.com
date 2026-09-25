"""Check legacy salary RPCs and server password policy with disposable staging data."""
import json, uuid, urllib.request, urllib.error
import staging_supabase as db

db.verify_target()
keys=db.management('/api-keys')
anon=next(k['api_key'] for k in keys if k['name']=='anon')
service=next(k['api_key'] for k in keys if k['name']=='service_role')
url='https://'+db.REF+'.supabase.co'
role='legacyqa'+uuid.uuid4().hex[:16]
results=[]
user_id=None

def call(path,body,key=anon,method='POST'):
    req=urllib.request.Request(url+path,method=method,data=json.dumps(body).encode() if body is not None else None,
        headers={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=20) as r: return r.status,json.loads(r.read() or 'null')
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read() or 'null')

def record(test,passed,**details):
    row=dict(test=test,passed=passed,**details);results.append(row);print(json.dumps(row),flush=True)

try:
    db.query(f"insert into salary_reports(role,industry,location,experience_band,company_size,monthly_gross,pay_reliability,approved,publication_status,observed_month) select '{role}','Technology','Lagos','3-5','1-10',200000,'on-time',true,'published',date_trunc('month',current_date)::date from generate_series(1,5)")
    status,old=call('/rest/v1/rpc/public_salary_benchmarks',{})
    status_new,new=call('/rest/v1/rpc/public_recent_salary_benchmarks',{})
    old_group=[r for r in old if r['role']==role] if status==200 else []
    new_group=[r for r in new if r['role']==role] if status_new==200 else []
    record('Current salary RPC suppresses five identical reports',status_new==200 and not new_group,groups=len(new_group))
    record('Legacy anonymous salary RPC also enforces distinct-report threshold',not old_group,http=status,groups=len(old_group),sample_size=old_group[0]['sample_size'] if old_group else None)
    status,link=call('/auth/v1/admin/generate_link',{'type':'signup','email':role+'@example.com','password':'Q7m!2x'},service)
    if status<300:
        user_id=link.get('id') or link.get('user',{}).get('id')
        assert user_id, 'Missing generated test account ID'
        verify_status,session=call('/auth/v1/verify',{'token_hash':link['hashed_token'],'type':'signup'})
        sign_status,_=call('/auth/v1/token?grant_type=password',{'email':role+'@example.com','password':'Q7m!2x'})
        record('Server enforces the UI eight-character password minimum',False,signup=status,confirmation=verify_status,sign_in=sign_status)
    else:
        record('Server enforces the UI eight-character password minimum',status in [400,422],signup=status)
finally:
    db.query(f"delete from salary_reports where role='{role}'")
    if user_id: call('/auth/v1/admin/users/'+user_id,None,service,'DELETE')
    (db.ROOT/'supabase/.temp/legacy-surface-results.json').write_text(json.dumps(results,indent=2))
    print('Disposable reports and account removed; no email sent.')

if any(not r['passed'] for r in results): raise SystemExit(1)
