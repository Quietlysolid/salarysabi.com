import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const fixture=JSON.parse(readFileSync('supabase/.temp/staging-verification.json','utf8'));
const config=JSON.parse(readFileSync('supabase/.temp/staging-public.json','utf8'));
assert.equal(config.url,'https://vcgqxlbhsbilxlkratbw.supabase.co');
const browser=await chromium.launch();
try {
 const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
 await context.route('https://*.supabase.co/**',r=>new URL(r.request().url()).origin===config.url?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(60000);
 await page.goto('http://localhost:3002/payroll');
 await page.getByLabel('Email',{exact:true}).fill(fixture.accounts.alice.email);
 await page.getByLabel('Password',{exact:true}).fill(fixture.accounts.alice.password);
 await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();
 await page.locator('.payroll-workspace').waitFor();
 const auth=await page.evaluate(()=>JSON.parse(localStorage.getItem('sb-vcgqxlbhsbilxlkratbw-auth-token')));
 const headers={apikey:config.key,Authorization:`Bearer ${auth.access_token}`,'Content-Type':'application/json'};
 const api=async(path,method='GET',body)=>fetch(config.url+'/rest/v1/'+path,{method,headers,body:body?JSON.stringify(body):undefined});
 const runs=await (await api('payroll_runs?select=pay_period')).json();
 const period=Array.from({length:12},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`).find(p=>!runs.some(r=>r.pay_period.startsWith(p)));assert(period,'No unused test month');
 await page.getByLabel('Pay period',{exact:true}).fill(period);
 const pdfWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download draft payslip for Test Employee',exact:true}).click();const pdf=await pdfWait;
 assert(pdf.suggestedFilename().includes('draft'));assert(readFileSync(await pdf.path()).toString('latin1').includes('DRAFT'));
 const csvWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download draft CSV',exact:true}).click();const csv=await csvWait;assert(readFileSync(await csv.path(),'utf8').includes('Status,Draft'));
 let payload;page.on('request',r=>{if(r.url().endsWith('/rpc/finalise_payroll_run'))payload=r.postDataJSON();});
 await page.getByRole('button',{name:'Finalise payroll',exact:true}).click();await page.getByRole('dialog').waitFor();
 await page.getByRole('button',{name:'Back to draft',exact:true}).click();assert.equal(payload,undefined);
 await page.getByRole('button',{name:'Finalise payroll',exact:true}).click();await page.getByRole('button',{name:'Confirm and save',exact:true}).click();
 await page.getByText('Payroll finalised and saved.',{exact:true}).waitFor();assert(payload);
 const saved=await (await api(`payroll_runs?pay_period=eq.${period}-01`)).json();assert.equal(saved.length,1);
 const duplicate=await api('rpc/finalise_payroll_run','POST',payload);assert(!duplicate.ok,'Duplicate accepted');
 await page.reload();await page.getByRole('button',{name:/^History/}).click();
 const card=page.locator('.payroll-history > article').filter({has:page.locator(`time[datetime="${period}"]`)});
 await card.getByRole('button',{name:'View saved exports'}).click();
 const savedCsvWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download saved CSV',exact:true}).click();const savedCsv=await savedCsvWait;const original=readFileSync(await savedCsv.path(),'utf8');assert(original.includes('Status,Finalised'));assert(original.includes('Revision,1'));
 const savedPdfWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download saved payslip for Test Employee',exact:true}).click();const savedPdf=await savedPdfWait;assert(readFileSync(await savedPdf.path()).toString('latin1').includes('FINALISED'));
 const employees=await (await api('payroll_employees?select=id,monthly_gross')).json();const employee=employees[0];assert(employee);
 try {
  assert((await api(`payroll_employees?id=eq.${employee.id}`,'PATCH',{monthly_gross:Number(employee.monthly_gross)+10000})).ok);
  await page.reload();await page.getByRole('button',{name:/^History/}).click();await card.getByRole('button',{name:'View saved exports'}).click();
  const checkWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download saved CSV',exact:true}).click();const check=await checkWait;assert.equal(readFileSync(await check.path(),'utf8'),original);
 } finally {await api(`payroll_employees?id=eq.${employee.id}`,'PATCH',{monthly_gross:employee.monthly_gross});}
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'test-results/staging/payroll-saved-exports-mobile.png',fullPage:true});
 console.log('PASS: draft CSV/PDF labels, cancel without save, confirmed persistence, duplicate rejection, saved PDF/CSV, immutable exports after employee edit, mobile layout. Staging only.');
} finally {await browser.close();}
