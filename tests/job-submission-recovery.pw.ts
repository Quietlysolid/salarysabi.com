import { test, expect, type Page } from "@playwright/test";
async function complete(page: Page, recruiter = false) {
 await page.goto('/post-a-job');
 await page.locator('[name=title]').fill('QA engineer');
 await page.locator('[name=company_name]').fill('Test employer');
 await page.locator('[name=location]').fill('Lagos');
 if (recruiter) {
  await page.getByLabel('Posting as').selectOption('recruiter');
  await page.getByRole('button',{name:'Next: Salary details'}).click();
  for(const field of ['recruiter_company','client_display_name','authority_confirmed']) await expect(page.locator(`[name=${field}]`)).toHaveAttribute('aria-invalid','true');
  await page.locator('[name=recruiter_company]').fill('Test agency');
  await page.locator('[name=client_display_name]').fill('Confidential employer');
  await page.locator('[name=authority_confirmed]').check();
 }
 await page.getByRole('button',{name:'Next: Salary details'}).click();
 await page.locator('[name=salary_min]').fill('250000');
 await page.locator('[name=salary_max]').fill('300000');
 await page.getByRole('button',{name:'Next: Application details'}).click();
 const date = new Date(); date.setDate(date.getDate()+14);
 await page.locator('[name=expires_at]').fill(date.toISOString().slice(0,10));
 await page.locator('[name=application_url]').fill('https://example.com/jobs/test');
 await page.locator('[name=contact_email]').fill('test@example.com');
 await page.locator('textarea[name=description]').fill('Staging test role describing responsibilities, requirements and the work involved. '.repeat(2));
 await page.locator('[name=no_candidate_fees_confirmed]').check();
 await page.waitForFunction(()=>performance.now()>1600);
}
for (const failure of ['network','server'] as const) test(`${failure} failure preserves entries and permits an explicit retry`,async({page})=>{
 let attempts=0;
 await page.route('**/rest/v1/job_submissions',async route=>{
  attempts++;
  if(attempts===1) { if(failure==='network') await route.abort('failed'); else await route.fulfill({status:503,body:'Unavailable'}); }
  else await route.fulfill({status:201,body:''});
 });
 await complete(page);
 await page.getByRole('button',{name:'Submit job for review'}).click();
 await expect(page.locator('.form-message')).toContainText('could not confirm');
 await expect(page.getByRole('heading',{name:'Job submitted for review'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Submit job for review'})).toBeEnabled();
 await expect(page.locator('[name=contact_email]')).toHaveValue('test@example.com');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.locator('[name=salary_min]')).toHaveValue('250000');
 await page.getByRole('button',{name:'Next: Application details'}).click();
 expect(attempts).toBe(1);
 await page.getByRole('button',{name:'Submit job for review'}).click();
 await expect(page.getByRole('heading',{name:'Job submitted for review'})).toBeVisible();
 expect(attempts).toBe(2);
});
test('recruiter requires authority, preserves fields on back navigation and submits recruiter metadata',async({page})=>{
 let payload: Record<string,unknown> = {};
 await page.route('**/rest/v1/job_submissions',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:201,body:''});});
 await complete(page,true);
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.locator('[name=recruiter_company]')).toHaveValue('Test agency');
 await expect(page.locator('[name=authority_confirmed]')).toBeChecked();
 await page.getByRole('button',{name:'Next: Salary details'}).click();
 await page.getByRole('button',{name:'Next: Application details'}).click();
 await page.getByRole('button',{name:'Submit job for review'}).click();
 await expect(page.getByRole('heading',{name:'Job submitted for review'})).toBeVisible();
 expect(payload).toMatchObject({submitter_type:'recruiter',recruiter_company:'Test agency',client_display_name:'Confidential employer',authority_confirmed:true,no_candidate_fees_confirmed:true});
 await expect(page.getByText('Submitted as a guest. This job is not linked to an account.')).toBeVisible();
});
test('switching to direct employer removes recruiter metadata',async({page})=>{
 let payload: Record<string,unknown> = {};
 await page.route('**/rest/v1/job_submissions',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:201,body:''});});
 await complete(page,true);
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByLabel('Posting as').selectOption('employer');
 await expect(page.locator('[name=recruiter_company]')).toHaveCount(0);
 await page.getByRole('button',{name:'Next: Salary details'}).click();
 await page.getByRole('button',{name:'Next: Application details'}).click();
 await page.getByRole('button',{name:'Submit job for review'}).click();
 await expect(page.getByRole('heading',{name:'Job submitted for review'})).toBeVisible();
 expect(payload).toMatchObject({submitter_type:'employer',recruiter_company:null,client_display_name:null,authority_confirmed:false});
});
test('pending submission prevents duplicate requests',async({page})=>{
 let attempts=0;
 let release!: ()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/rest/v1/job_submissions',async route=>{attempts++;await gate;await route.fulfill({status:201,body:''});});
 await complete(page);
 await page.getByRole('button',{name:'Submit job for review'}).click();
 await expect.poll(()=>attempts).toBe(1);
 await expect(page.locator('button[type=submit]')).toBeDisabled();
 await page.locator('form.job-wizard').evaluate(form=>(form as HTMLFormElement).requestSubmit());
 release();
 await expect(page.getByRole('heading',{name:'Job submitted for review'})).toBeVisible();
 expect(attempts).toBe(1);
});
