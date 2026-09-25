import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/api/analytics',r=>r.fulfill({status:204}));
 // Production smoke test: block database/auth mutations and emails.
 await context.route('https://*.supabase.co/**',r=>['GET','HEAD','OPTIONS'].includes(r.request().method()) || r.request().url().endsWith('/rpc/public_recent_salary_benchmarks') ? r.continue() : r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/','/individuals','/employers','/hiring','/account','/payroll','/salaries','/post-a-job','/company-tax','/privacy','/terms','/accessibility']) {
  const response=await page.goto('https://salarysabi.com'+path,{waitUntil:'networkidle',timeout:60000});
  assert.equal(response.status(),200,path);
  await expect(page.locator('h1').first()).toBeVisible();
  assert(!await page.getByText('Staging - Test data only',{exact:true}).count());
  assert(!await page.locator('body').innerText().then(t=>t.includes('Application error:')));
  console.log('PASS',path);
 }
 await page.goto('https://salarysabi.com/talent',{waitUntil:'networkidle'});
 assert(new URL(page.url()).pathname==='/individuals','Legacy talent redirect');
 await page.goto('https://salarysabi.com/post-a-job',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Next: Salary details'}).click();
 await expect(page.locator('.wizard-error-summary')).toBeVisible();
 await page.goto('https://salarysabi.com/hiring',{waitUntil:'networkidle'});
 await expect(page.getByRole('heading',{name:'Sign in to see your listings'})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/individuals','/hiring','/post-a-job']){
  await page.goto('https://salarysabi.com'+path,{waitUntil:'networkidle'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow '+path);
 }
 const api=await context.request.get('https://salarysabi.com/api/jobs?limit=1');assert.equal(api.status(),200);assert(Array.isArray((await api.json()).data));
 assert.deepEqual(errors,[]);
 console.log('PASS live redirect, form validation, hiring sign-in, mobile layout, jobs API and no browser exceptions. No production data submitted.');
} finally {await browser.close();}
