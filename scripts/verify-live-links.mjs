import { chromium } from '@playwright/test';
import { readFileSync,writeFileSync } from 'node:fs';
const routes=[...new Set(JSON.parse(readFileSync('test-results/public-surface/results.json','utf8')).map(r=>r.route))];
const browser=await chromium.launch();const results=[],links=new Map();
try{
 const context=await browser.newContext();
 await context.route('**/api/analytics',r=>r.fulfill({status:204}));
 await context.route('https://*.supabase.co/**',r=>['GET','HEAD','OPTIONS'].includes(r.request().method())||r.request().url().endsWith('/rpc/public_recent_salary_benchmarks')?r.continue():r.abort());
 const page=await context.newPage();
 for(const path of routes){
  await page.goto('https://salarysabi.com'+path,{waitUntil:'domcontentloaded',timeout:60000});
  for(const href of await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))){
   if(href.startsWith('/')&&!href.startsWith('//'))links.set(href,path);
  }
 }
 for(const [href,source] of links){
  const r=await context.request.get('https://salarysabi.com'+href.split('#')[0]);
  const hash=href.split('#')[1];let anchor=true;
  if(hash){await page.goto(r.url(),{waitUntil:'domcontentloaded'});anchor=await page.evaluate(id=>!!document.getElementById(id),decodeURIComponent(hash));}
  results.push({test:'Internal link',source,href,status:r.status(),destination:r.url(),anchor,passed:r.status()<400&&anchor});
 }
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const [name,destination] of [['Salary or wages','/calculator'],['Freelance or creator income','/freelancer-tax'],['Foreign income','/foreign-income-tax'],['Company tax','/company-tax'],['Investment income','/investment-tax']]){
   await page.goto('https://salarysabi.com/tax-tools',{waitUntil:'networkidle'});
   await page.getByRole('link',{name:new RegExp(name)}).click({timeout:30000});
   await page.waitForURL('**'+destination,{timeout:30000});
   results.push({test:'Tax tool card',name,width,destination,passed:true});
  }
 }
 console.log(JSON.stringify({links:links.size,cardClicks:10,failures:results.filter(r=>!r.passed)}));
}finally{await browser.close();writeFileSync('supabase/.temp/live-link-results.json',JSON.stringify(results,null,2));}
if(results.some(r=>!r.passed))process.exitCode=1;
