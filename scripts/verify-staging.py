"""Real Auth + PostgREST checks against the explicitly allowlisted staging project."""
from staging_supabase import REF, ROOT, management, query, verify_target
import datetime as dt
import json
import secrets
import urllib.request
import urllib.error

verify_target()
keys = management('/api-keys')
ANON = next(k['api_key'] for k in keys if k['name']=='anon')
SERVICE = next(k['api_key'] for k in keys if k['name']=='service_role')
URL = f'https://{REF}.supabase.co'
management('/config/auth','PATCH',{'site_url':'http://localhost:3001','uri_allow_list':'http://localhost:3001/**,http://localhost:3002/**'})
(ROOT/'supabase/.temp/staging-public.json').write_text(json.dumps({'url':URL,'key':ANON}))

def api(path, method='GET', data=None, bearer=None, admin=False, fail=False):
    key = SERVICE if admin else ANON
    request = urllib.request.Request(URL+path,method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'apikey':key,'Authorization':'Bearer '+(bearer or key),'Content-Type':'application/json','Prefer':'return=representation'})
    try:
        with urllib.request.urlopen(request,timeout=40) as response:
            raw=response.read()
            result=json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        details=error.read().decode()
        if fail:
            assert error.code in (400,401,403,409,422), (error.code,details)
            return details
        raise RuntimeError(f'{method} {path}: HTTP {error.code}: {details}') from None
    if fail: raise AssertionError('Expected denial: '+path)
    return result

def rpc(name,data=None,bearer=None,fail=False):
    return api('/rest/v1/rpc/'+name,'POST',data or {},bearer,fail=fail)

stamp=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%d%H%M%S')
accounts={}
for role in ('alice','bob','admin'):
    email=f'salarysabi-qa-{role}-{stamp}@example.com'
    password=secrets.token_urlsafe(28)
    # Generates a real signup confirmation token without sending mail to any recipient.
    link=api('/auth/v1/admin/generate_link','POST',{'type':'signup','email':email,'password':password},admin=True)
    session=api('/auth/v1/verify','POST',{'token_hash':link['hashed_token'],'type':'signup'})
    signed=api('/auth/v1/token?grant_type=password','POST',{'email':email,'password':password})
    assert signed['user']['email_confirmed_at']
    accounts[role]={'id':signed['user']['id'],'email':email,'password':password,'token':signed['access_token']}
query("insert into public.admin_users(user_id) values ('"+accounts['admin']['id']+"')")
alice,bob,admin=(accounts[x]['token'] for x in ('alice','bob','admin'))
print('PASS real signup-token confirmation and password sign-in for 3 isolated test accounts',flush=True)

today=dt.date.today()
month=today.replace(day=1).isoformat()
payload={'contact_email':accounts['alice']['email'],'title':'TEST ONLY Connected engineer '+stamp,'company_name':'SalarySabi QA - not a vacancy','location':'Lagos','work_mode':'onsite','employment_type':'Full time','description':'Staging verification only. This is a fabricated test vacancy and must never be copied to the live SalarySabi job board.','salary_min':200000,'salary_max':300000,'salary_period':'monthly','salary_type':'gross','salary_currency':'NGN','engagement_type':'employee','submitter_type':'employer','no_candidate_fees_confirmed':True,'application_url':'https://example.com/staging-only','expires_at':(today+dt.timedelta(days=30)).isoformat(),'consented_at':dt.datetime.now(dt.timezone.utc).isoformat()}
# Insert without requesting private rows back; owners read the narrow RPC.
def insert_submission(data,bearer=None):
    req=urllib.request.Request(URL+'/rest/v1/job_submissions',data=json.dumps(data).encode(),method='POST',headers={'apikey':ANON,'Authorization':'Bearer '+(bearer or ANON),'Content-Type':'application/json','Prefer':'return=minimal'})
    with urllib.request.urlopen(req,timeout=40) as r: assert r.status==201
insert_submission(payload,alice)
api('/rest/v1/job_submissions','POST',{**payload,'owner_user_id':accounts['bob']['id']},fail=True)
api('/rest/v1/job_submissions','POST',{**payload,'owner_user_id':accounts['bob']['id']},alice,fail=True)
records=rpc('employer_hiring_records',bearer=alice)
assert len(records)==1
sid=records[0]['id']
assert rpc('employer_hiring_records',bearer=bob)==[]
assert api('/rest/v1/job_submissions?select=id',bearer=bob)==[]
api('/rest/v1/job_submissions?id=eq.'+sid,'PATCH',{'review_status':'approved'},alice)
assert rpc('employer_hiring_records',bearer=alice)[0]['review_status']=='pending'
checks={'p_submission_id':sid,'p_application_confirmed':True,'p_salary_confirmed':True,'p_source_confirmed':True}
rpc('approve_verified_job_submission',checks,bob,fail=True)
rpc('approve_verified_job_submission',{**checks,'p_salary_confirmed':False},admin,fail=True)
rpc('approve_job_submission',{'p_submission_id':sid},admin,fail=True)
assert not any(row['title']==payload['title'] for row in api('/rest/v1/jobs?select=title'))
jid=rpc('approve_verified_job_submission',checks,admin)
job=api('/rest/v1/jobs?id=eq.'+jid)[0]
assert job['salary_min']==200000
assert rpc('employer_hiring_records',bearer=alice)[0]['job_slug']==job['slug']
assert rpc('employer_hiring_records',bearer=bob)==[]
print('PASS employer ownership, cross-account isolation, guarded admin publication and public listing visibility',flush=True)

org=api('/rest/v1/payroll_organisations','POST',{'owner_user_id':accounts['alice']['id'],'name':'QA Staging Payroll'},alice)[0]
employee=api('/rest/v1/payroll_employees','POST',{'organisation_id':org['id'],'employee_number':'QA-001','full_name':'Test Employee','monthly_gross':200000},alice)[0]
assert api('/rest/v1/payroll_employees?select=id',bearer=bob)==[]
item={'employee_id':employee['id'],'monthly_gross':200000,'monthly_paye':20000,'monthly_statutory_deductions':0,'monthly_other_deductions':0,'monthly_net_pay':180000}
args={'p_organisation_id':org['id'],'p_pay_period':month,'p_ruleset_version':'2026.1','p_items':[item]}
rpc('finalise_payroll_run',args,bob,fail=True)
rpc('finalise_payroll_run',{**args,'p_items':[{**item,'monthly_net_pay':1}]},alice,fail=True)
rpc('finalise_payroll_run',{**args,'p_items':None},alice,fail=True)
rpc('finalise_payroll_run_internal',args,alice,fail=True)
run=rpc('finalise_payroll_run',args,alice)
assert run['total_net']==180000
rpc('finalise_payroll_run',args,alice,fail=True)
olditem=api('/rest/v1/payroll_run_items?run_id=eq.'+run['id'],bearer=alice)[0]
api('/rest/v1/payroll_runs?id=eq.'+run['id'],'PATCH',{'total_net':1},alice,fail=True)
api('/rest/v1/payroll_run_items?id=eq.'+olditem['id'],'PATCH',{'monthly_net_pay':1},alice,fail=True)
amended={k:v for k,v in item.items() if k!='employee_id'}
amended.update(original_item_id=olditem['id'],monthly_other_deductions=1000,monthly_net_pay=179000)
amendargs={'p_run_id':run['id'],'p_correction_note':'Test correction only','p_items':[amended]}
rpc('amend_payroll_run',amendargs,bob,fail=True)
revision=rpc('amend_payroll_run',amendargs,alice)
assert revision['revision_number']==2 and revision['total_net']==179000
assert api('/rest/v1/payroll_runs?id=eq.'+run['id'],bearer=alice)[0]['status']=='superseded'
assert api('/rest/v1/payroll_run_items?id=eq.'+olditem['id'],bearer=alice)[0]['monthly_net_pay']==180000
assert api('/rest/v1/payroll_employees?id=eq.'+employee['id'],bearer=alice)[0]['monthly_other_deductions']==0
print('PASS payroll finalisation, duplicate prevention, ownership and immutable snapshot amendment',flush=True)

report={'p_role':'QA Engineer '+stamp,'p_industry':'Technology','p_location':'Lagos','p_experience_band':'3-5','p_company_size':'1-10','p_monthly_gross':200000,'p_pay_reliability':'on-time','p_observed_month':month}
def cohort():
    return [row for row in rpc('public_recent_salary_benchmarks') if row['role']==report['p_role'].lower()]
rpc('submit_recent_salary_report',{**report,'p_observed_month':(today+dt.timedelta(days=65)).replace(day=1).isoformat()},fail=True)
for gross in (200000,210000,220000,230000): rpc('submit_recent_salary_report',{**report,'p_monthly_gross':gross})
assert cohort()==[]
query(f"update salary_reports set approved=true,publication_status='published' where role='{report['p_role']}'")
assert cohort()==[]
rpc('submit_recent_salary_report',{**report,'p_monthly_gross':240000})
assert cohort()==[]
query(f"update salary_reports set approved=true,publication_status='published' where role='{report['p_role']}'")
rpc('submit_recent_salary_report',{**report,'p_monthly_gross':240000})
query(f"update salary_reports set approved=true,publication_status='published' where role='{report['p_role']}'")
query(f"insert into salary_reports(role,industry,location,experience_band,company_size,monthly_gross,pay_reliability,approved,publication_status,observed_month) values ('{report['p_role']}','Technology','Lagos','3-5','1-10',900000,'on-time',true,'published',null),('{report['p_role']}','Technology','Lagos','3-5','1-10',800000,'on-time',true,'published',(date_trunc('month',current_date)-interval '13 months')::date)")
ranges=cohort()
assert len(ranges)==1 and ranges[0]['sample_size']==5 and ranges[0]['median_monthly_gross']==220000
assert ranges[0]['period_start']==month and ranges[0]['period_end']==month
assert api('/rest/v1/salary_reports?select=id')==[]
print('PASS salary recency validation, moderation, minimum cohort, exact duplicate suppression and private row protection',flush=True)

assert query('select count(*)::int n from cron.job where active')[0]['n']==0
fixture={'accounts':accounts,'job':job,'organisation':org,'run':run,'revision':revision,'salary_role':report['p_role']}
(ROOT/'supabase/.temp/staging-verification.json').write_text(json.dumps(fixture))
print('PASS staging API checks complete; fixture credentials saved only under ignored supabase/.temp',flush=True)
