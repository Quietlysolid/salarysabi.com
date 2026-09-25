from pathlib import Path
folder=Path('supabase/functions/verify-maintenance-runtime')
folder.mkdir(exist_ok=True)
for name,target in [('import-ats-jobs','ats'),('check-stale-jobs','freshness')]:
 s=Path(f'supabase/functions/{name}/index.ts').read_text(encoding='utf-8-sig')
 s=s.replace('Deno.serve(async request => {','export const handler = async (request: Request) => {')
 assert s.rstrip().endswith('});')
 s=s.rstrip()[:-3]+'};\n'
 (folder/f'{target}.ts').write_text(s)
(folder/'index.ts').write_text('''import { AsyncLocalStorage } from "node:async_hooks";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handler as ats } from "./ats.ts";
import { handler as freshness } from "./freshness.ts";
const url=Deno.env.get("SUPABASE_URL")!;
if(url!=="https://vcgqxlbhsbilxlkratbw.supabase.co")throw new Error("Staging only");
const realFetch=globalThis.fetch;
const db=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false},global:{fetch:realFetch}});
const context=new AsyncLocalStorage<{jobIds:string[];slow:boolean;payload:unknown}>();
globalThis.fetch=async(input,init={})=>{
 const c=context.getStore(); if(!c)return realFetch(input,init);
 const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(u.origin===url){
  if(u.pathname==='/rest/v1/rpc/claim_job_freshness')return realFetch(input,{...init,body:JSON.stringify({p_job_ids:c.jobIds})});
  return realFetch(input,init);
 }
 if(['boards-api.greenhouse.io','example.com'].includes(u.hostname)){
  if(c.slow)await new Promise((done,reject)=>{const t=setTimeout(done,65000);init.signal?.addEventListener('abort',()=>{clearTimeout(t);reject(new Error('Simulated timeout'));},{once:true});});
  return u.hostname==='example.com'?new Response('ok'):Response.json(c.payload);
 }
 throw new Error('Unexpected probe destination');
};
Deno.serve(async request=>{
 const authorized=await db.rpc('verify_job_alert_cron_secret',{p_secret:request.headers.get('x-cron-secret')||''});
 if(authorized.error||!authorized.data)return new Response('Unauthorized',{status:401});
 const body=await request.json(); const jobIds=body.jobIds||[];
 if(jobIds.length){
  const rows=await db.from('jobs').select('id,slug').in('id',jobIds);
  if(rows.error||rows.data.length!==jobIds.length||rows.data.some(j=>!j.slug.startsWith('edgeworkerqa')))return new Response('Fixture scope required',{status:400});
 }
 if(body.sourceId){
  const source=await db.from('job_import_sources').select('source_key').eq('id',body.sourceId).single();
  if(source.error||!source.data.source_key.startsWith('edgeworkerqa'))return new Response('Fixture source required',{status:400});
 }
 if(body.worker==='ats'&&!body.sourceId)return new Response('Source required',{status:400});
 return context.run({jobIds,slow:!!body.slow,payload:body.payload||{jobs:[]}},async()=>{
  const started=Date.now();
  const response=await (body.worker==='ats'?ats:freshness)(new Request(url,{method:'POST',headers:{'x-cron-secret':request.headers.get('x-cron-secret')!,'content-type':'application/json'},body:JSON.stringify({sourceId:body.sourceId})}));
  return Response.json({status:response.status,result:await response.json(),elapsed:Date.now()-started});
 });
});
''')
print('Generated staging-only runtime probe from current handlers')
