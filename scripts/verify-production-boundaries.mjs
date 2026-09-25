// Public reads and deliberately rejected analytics requests only; never creates records.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser=await chromium.launch();const results=[];
const record=(test,passed,details={})=>{const r={test,passed,...details};results.push(r);console.log(JSON.stringify(r));};
const origin='https://salarysabi.com';
try{
 const context=await browser.newContext();
 const page=await context.newPage();
 await page.route('**/api/analytics',r=>r.fulfill({status:204}));
 await page.goto(origin,{waitUntil:'networkidle'});
 await page.keyboard.press('Tab');
 const skip=await page.locator(':focus').textContent();
 await page.keyboard.press('Enter');
 record('Keyboard skip link reaches main content',/skip/i.test(skip||'')&&await page.evaluate(()=>document.activeElement?.id==='main-content'));
 for(const query of ['limit=1','limit=999999','page=-1','page=abc','page=9007199254740991']){
  const r=await context.request.get(origin+'/api/jobs?'+query);let body;try{body=await r.json();}catch{body={};}
  const acceptable=r.status()===200&&Array.isArray(body.data)&&body.data.length<=50||r.status()===400;
  record('Jobs API boundary '+query,acceptable,{status:r.status(),returned:body.data?.length,pagination:body.pagination});
 }
 const cases=[
  ['Missing Origin',{},JSON.stringify({event:'paye_calculated',pagePath:'/calculator'}),403],
  ['Cross-site Origin',{origin:'https://example.com'},JSON.stringify({event:'paye_calculated',pagePath:'/calculator'}),403],
  ['Unexpected salary field',{origin},JSON.stringify({event:'paye_calculated',pagePath:'/calculator',salary:123456}),400],
  ['Malformed JSON',{origin},'{broken',400],
  ['Oversized body',{origin},'x'.repeat(1100),413],
 ];
 for(const [name,headers,body,status] of cases){const r=await context.request.post(origin+'/api/analytics',{headers:{'content-type':'application/json','user-agent':'Mozilla/5.0 SalarySabiAudit',...headers},data:body});record('Analytics rejects '+name,r.status()===status,{status:r.status(),expected:status});}
 for(const path of ['/e2e-fixtures/workspace','/jobs/salarysabi-nonexistent-audit-job']){
  const r=await context.request.get(origin+path);record('Unavailable route '+path,r.status()===404,{status:r.status()});
 }
}finally{await browser.close();writeFileSync('supabase/.temp/production-boundary-results.json',JSON.stringify(results,null,2));}
if(results.some(r=>!r.passed))process.exitCode=1;
