// Read-only production route, responsive-layout, browser and automated accessibility checks.
import { chromium } from '@playwright/test';
import { readdirSync,existsSync,readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.AUDIT_ORIGIN||'https://salarysabi.com';
assert(['https://salarysabi.com','http://localhost:3002'].includes(origin));
const allRoutes=['/',...readdirSync('src/app',{withFileTypes:true}).filter(d=>d.isDirectory()&&!['api','e2e-fixtures'].includes(d.name)&&existsSync(`src/app/${d.name}/page.tsx`)).map(d=>'/'+d.name)];
const routes=process.env.AUDIT_ROUTE?allRoutes.filter(r=>r===process.env.AUDIT_ROUTE):allRoutes;
assert(routes.length);
const axe=readFileSync('supabase/.temp/axe-audit/package/axe.min.js','utf8');
const browser=await chromium.launch();const results=[];
mkdirSync('test-results/public-surface',{recursive:true});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.route('**/api/analytics',r=>r.fulfill({status:204}));
  await context.route('https://*.supabase.co/**',r=>['GET','HEAD','OPTIONS'].includes(r.request().method())||r.request().url().endsWith('/rpc/public_recent_salary_benchmarks')?r.continue():r.abort());
  const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of routes){
   errors=[];
   try{
    const response=await page.goto(origin+route,{waitUntil:'networkidle',timeout:60000});
    await page.locator('h1').first().waitFor({timeout:15000});
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(axe);
    const audit=await page.evaluate(async()=>{
     const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
     return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};
    });
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,lang:document.documentElement.lang}));
    const headers=response.headers();
    const security=['content-security-policy','x-content-type-options','strict-transport-security','referrer-policy'].filter(h=>!headers[h]);
    const result={route,width,status:response.status(),destination:new URL(page.url()).pathname,...layout,missingSecurityHeaders:security,errors:[...errors],...audit};
    result.passed=result.status===200&&!result.overflow&&result.h1===1&&result.main===1&&!!result.lang&&!security.length&&!errors.length&&!audit.violations.length;
    results.push(result);
    console.log(JSON.stringify({route,width,passed:result.passed,overflow:layout.overflow,violations:audit.violations.map(v=>v.id),errors}));
    if(!result.passed)await page.screenshot({path:`test-results/public-surface/${route.replaceAll('/','_')||'home'}-${width}.png`,fullPage:true});
   }catch(e){results.push({route,width,passed:false,error:e.message});console.log(JSON.stringify({route,width,error:e.message}));}
  }
  await context.close();
 }
}finally{await browser.close();writeFileSync('test-results/public-surface/results.json',JSON.stringify(results,null,2));}
assert(results.every(r=>r.passed),'Public-surface findings recorded in test-results/public-surface/results.json');
