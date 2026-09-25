import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const url='https://vcgqxlbhsbilxlkratbw.supabase.co';
const secret=process.env.STAGING_ALERT_CRON_SECRET;
const db=createClient(url,process.env.STAGING_ALERT_SERVICE_KEY,{auth:{persistSession:false}});
const check=r=>{if(r.error)throw r.error;return r.data;};
const stamp='edgeworkerqa'+crypto.randomUUID().replaceAll('-','').slice(0,10),results=[];let sourceId;
const record=(test,details)=>{results.push({test,...details});console.log(JSON.stringify(results.at(-1)));};
async function invoke(body){const r=await fetch(url+'/functions/v1/verify-maintenance-runtime',{method:'POST',headers:{'x-cron-secret':secret,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(55000)});assert.equal(r.status,200,await r.clone().text());return r.json();}
let template;
async function seed(n){
 check(await db.from('jobs').delete().like('slug',stamp+'%'));
 const ids=[];
 for(let i=0;i<n;i+=100){const rows=Array.from({length:Math.min(100,n-i)},(_,k)=>({...template,slug:stamp+'-'+(i+k),source_job_id:'greenhouse:'+stamp+':'+(i+k),source_name:stamp,application_url:'https://example.com/'+stamp+'/'+(i+k),stale_check_failures:0,last_availability_check_at:null,expires_at:'2099-12-31'}));ids.push(...check(await db.from('jobs').insert(rows).select('id')).map(j=>j.id));}
 return ids;
}
try{
 template=check(await db.from('jobs').select('*').eq('status','published').limit(1))[0];assert(template);
 for(const k of ['id','created_at','updated_at'])delete template[k];
 let ids=await seed(1);
 const runs=await Promise.all(Array.from({length:10},()=>invoke({jobIds:ids})));
 assert.equal(runs.reduce((sum,r)=>sum+r.result.checked,0),1);record('Edge: ten overlapping freshness checks',{observations:1});
 ids=await seed(260);let checked=0,maxMs=0;
 for(let n=0;n<20&&checked<260;n++){const r=await invoke({jobIds:ids});assert(r.status<400,JSON.stringify(r));checked+=r.result.checked;maxMs=Math.max(maxMs,r.elapsed);}
 assert.equal(checked,260);assert(maxMs<50000);record('Edge: freshness backlog drains',{checked,maxMs});
 ids=await seed(6);const slow=await invoke({jobIds:ids,slow:true});assert(slow.elapsed<50000);assert.equal(slow.status,202);record('Edge: slow freshness pages preserve batch deadline',{elapsed:slow.elapsed,checked:slow.result.checked});
 sourceId=check(await db.from('job_import_sources').insert({provider:'greenhouse',source_key:stamp,company_name:stamp,active:true,nigeria_only:true}).select('id').single()).id;
 check(await db.from('jobs').delete().like('slug',stamp+'%'));
 const description='NGN 500,000 - 700,000 monthly. This is a staging verification fixture only, not an available role. Do not publish or apply.';
 const payload={jobs:Array.from({length:1005},(_,i)=>({id:i+1,title:stamp+' engineer '+i,location:{name:'Lagos, Nigeria'},content:description,absolute_url:'https://example.com/'+stamp+'/'+i}))};
 const imports=await Promise.all(Array.from({length:10},()=>invoke({worker:'ats',sourceId,payload})));
 assert(imports.every(r=>r.status<400),JSON.stringify(imports));
 for(let n=0;n<10;n++){const work=check(await db.from('ats_import_work').select('phase').eq('source_id',sourceId).single());if(work.phase==='fetch')break;const r=await invoke({worker:'ats',sourceId,payload:{error:'changed'}});assert(r.status<400,JSON.stringify(r));}
 const count=await db.from('jobs').select('id',{count:'exact',head:true}).like('source_job_id','greenhouse:'+stamp+':%');check(count);assert.equal(count.count,1005);record('Edge: overlapping imports resume a 1,005-job snapshot',{records:count.count,maxMs:Math.max(...imports.map(r=>r.elapsed))});
 check(await db.from('ats_import_work').delete().eq('source_id',sourceId));check(await db.from('job_import_sources').update({last_sync_at:null}).eq('id',sourceId));
 const timeout=await invoke({worker:'ats',sourceId,slow:true});assert.equal(timeout.status,503);assert(timeout.elapsed<15000);record('Edge: stalled ATS provider aborts safely',{elapsed:timeout.elapsed,http:timeout.status});
}finally{
 check(await db.from('jobs').delete().like('slug',stamp+'%'));
 check(await db.from('jobs').delete().like('source_job_id','greenhouse:'+stamp+':%'));
 if(sourceId)check(await db.from('job_import_sources').delete().eq('id',sourceId));
 writeFileSync('supabase/.temp/maintenance-edge-results.json',JSON.stringify(results,null,2));
 console.log('Edge fixtures removed; no real provider or email requests.');
}
