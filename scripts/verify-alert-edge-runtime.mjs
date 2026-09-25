import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const url='https://vcgqxlbhsbilxlkratbw.supabase.co';
const db=createClient(url,process.env.STAGING_ALERT_SERVICE_KEY,{auth:{persistSession:false}});
const secret=process.env.STAGING_ALERT_CRON_SECRET;assert(secret);
const check=r=>{if(r.error)throw r.error;return r.data;};
const stamp='edgealert'+crypto.randomUUID().replaceAll('-','').slice(0,12),email=stamp+'@example.com';
let uid,jid;const results=[];
async function alerts(n,match){check(await db.from('job_alerts').delete().eq('user_id',uid));const ids=Array.from({length:n},()=>crypto.randomUUID());for(let i=0;i<n;i+=200)check(await db.from('job_alerts').insert(ids.slice(i,i+200).map((id,k)=>({id,user_id:uid,email,keywords:stamp+(match?' '.repeat(k+1):' absent '+(i+k)),work_mode:'all',consented_at:new Date().toISOString()}))));return ids;}
async function invoke(ids,slow=false){const r=await fetch(url+'/functions/v1/verify-alert-edge-runtime',{method:'POST',headers:{'Content-Type':'application/json','x-cron-secret':secret},body:JSON.stringify({alert_ids:ids,slow}),signal:AbortSignal.timeout(55000)});assert.equal(r.status,200);return r.json();}
const log=(test,details)=>{const r={test,...details};results.push(r);console.log(JSON.stringify(r));};
try{
 uid=check(await db.auth.admin.createUser({email,password:crypto.randomUUID(),email_confirm:true})).user.id;
 const job=check(await db.from('jobs').select('*').eq('status','published').limit(1))[0];assert(job);for(const k of ['id','created_at','updated_at'])delete job[k];
 jid=check(await db.from('jobs').insert({...job,slug:stamp,title:'TEST ONLY '+stamp,dedupe_key:stamp,source_job_id:null,expires_at:'2099-12-31'}).select('id').single()).id;
 let ids=await alerts(1,true);
 const overlap=await Promise.all(Array.from({length:10},()=>invoke(ids)));
 assert.equal(overlap.reduce((n,r)=>n+r.emails_sent,0),1);log('Edge: 10 overlapping requests',{emails_sent:1});
 ids=await alerts(1005,false);let processed=0,rounds=0,maxMs=0;
 for(;rounds<10;rounds++){const r=await invoke(ids);processed+=r.alerts_processed;maxMs=Math.max(maxMs,r.elapsed_ms);if(r.complete)break;}
 assert.equal(processed,1005);assert(maxMs<50000);log('Edge: all 1,005 alerts processed',{processed,rounds:rounds+1,max_ms:maxMs});
 ids=await alerts(7,true);maxMs=0;let uncertain=0;
 for(let i=0;i<5;i++){const r=await invoke(ids,true);maxMs=Math.max(maxMs,r.elapsed_ms);uncertain+=r.uncertain;assert.equal(r.emails_sent,0);if(r.complete)break;}
 assert.equal(uncertain,7);assert(maxMs<50000);log('Edge: 7 slow provider calls bounded and held',{uncertain,max_ms:maxMs});
 const again=await invoke(ids);assert.equal(again.emails_sent,0);log('Edge: uncertain deliveries not resent',{emails_sent:0});
}finally{
 if(uid)check(await db.from('job_alerts').delete().eq('user_id',uid));
 if(jid)check(await db.from('jobs').delete().eq('id',jid));
 if(uid)check(await db.auth.admin.deleteUser(uid));
 writeFileSync('supabase/.temp/alert-edge-results.json',JSON.stringify(results,null,2));
 console.log('Edge fixtures removed; no real mail was sent.');
}
