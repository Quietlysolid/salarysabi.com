import json,urllib.request,urllib.error,datetime
from pathlib import Path
f=json.loads(Path('supabase/.temp/staging-verification.json').read_text());c=json.loads(Path('supabase/.temp/staging-public.json').read_text());assert c['url']=='https://vcgqxlbhsbilxlkratbw.supabase.co'
def call(path,method='GET',body=None,user='alice'):
 req=urllib.request.Request(c['url']+'/rest/v1/'+path,method=method,data=json.dumps(body).encode() if body is not None else None,headers={'apikey':c['key'],'Authorization':'Bearer '+(f['accounts'][user]['token'] if user else c['key']),'Content-Type':'application/json','Prefer':'return=minimal' if path=='job_reports' and method=='POST' else 'return=representation'})
 try:
  with urllib.request.urlopen(req) as r:return r.status,json.loads(r.read() or 'null')
 except urllib.error.HTTPError as e:return e.code,None
payload={'email':f['accounts']['alice']['email'],'user_id':f['accounts']['alice']['id'],'keywords':'QA private alert','location':'Lagos','work_mode':'all','consented_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
assert call('job_alerts','POST',payload,None)[0]>=400
assert call('job_alerts','POST',{**payload,'user_id':f['accounts']['bob']['id'],'email':f['accounts']['bob']['email']})[0]>=400
status,rows=call('job_alerts','POST',payload);assert status==201,status
alert=rows[0]
assert call('job_alerts?id=eq.'+alert['id'],user='bob')[1]==[]
assert call('job_alerts?id=eq.'+alert['id'],'PATCH',{'active':False},user='bob')[1]==[]
assert call('rpc/unsubscribe_job_alert','POST',{'p_token':alert['unsubscribe_token']},None)[1] is True
assert call('job_alerts?id=eq.'+alert['id'])[1][0]['active'] is False
assert call('job_alerts?id=eq.'+alert['id'],'DELETE')[0]<300
assert call('job_reports','POST',{'job_id':f['job']['id'],'reason':'other','details':'TEST ONLY staging report'},None)[0]==201
assert call('job_reports',user='bob')[1]==[]
assert call('job_reports',user='admin')[1]
print('PASS alert guest/forged-owner rejection, owner access, cross-account read/write isolation, token unsubscribe, delete; private reports visible only to admin.')
role='QA moderation '+datetime.datetime.now().strftime('%H%M%S')
report={'p_role':role,'p_industry':'Technology','p_location':'Lagos','p_experience_band':'3-5','p_company_size':'1-10','p_monthly_gross':250000,'p_pay_reliability':'on-time','p_observed_month':datetime.date.today().replace(day=1).isoformat()}
for gross in [250000,260000,270000,280000,290000]:assert call('rpc/submit_recent_salary_report','POST',{**report,'p_monthly_gross':gross},None)[0]<300
from urllib.parse import quote
rows=call('salary_reports?role=eq.'+quote(role),user='admin')[1];assert len(rows)==5
for i,row in enumerate(rows):
 decision={'p_report_id':row['id'],'p_publish':True,'p_note':'Staging moderation test only','p_checks_confirmed':True}
 assert call('rpc/review_community_salary_report','POST',decision,'bob')[0]>=400
 assert call('rpc/review_community_salary_report','POST',{**decision,'p_checks_confirmed':False},'admin')[0]>=400
 assert call('rpc/review_community_salary_report','POST',decision,'admin')[0]<300
 groups=call('rpc/public_recent_salary_benchmarks','POST',{},None)[1]
 matching=[g for g in groups if g['role']==role.lower()]
 assert bool(matching)==(i==4)
assert matching[0]['sample_size']==5 and matching[0]['median_monthly_gross']==270000
print('PASS ordinary salary moderation: non-admin denial, mandatory checks, five-report threshold and public median through real RPCs.')
