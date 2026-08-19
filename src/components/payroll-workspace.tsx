"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { buildPayrollCsv, calculatePayrollLine, downloadPayrollPayslip, parsePayrollCsv, payrollCsvTemplate, payrollTotals, type PayrollEmployeeInput, type PayrollImportRow } from "@/lib/payroll";
import { rulesetVersion } from "@/lib/site";

type Organisation = { id: string; name: string; contact_email: string | null };
type EmployeeRow = {
  id: string; employee_number: string; full_name: string; email: string | null;
  monthly_gross: number; monthly_pension: number; monthly_nhf: number; monthly_nhis: number;
  monthly_mortgage_interest: number; monthly_life_insurance: number; monthly_rent: number;
  monthly_other_deductions: number; active: boolean;
};
type RunRow = { id: string; pay_period: string; status: "draft" | "finalised" | "superseded"; revision_number: number; supersedes_run_id: string | null; correction_note: string | null; total_gross: number; total_paye: number; total_net: number; ruleset_version: string };

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const number = (value: FormDataEntryValue | null) => Math.max(0, Number(value) || 0);
const monthValue = () => new Date().toISOString().slice(0, 7);

function toInput(row: EmployeeRow): PayrollEmployeeInput {
  return {
    id: row.id, employeeNumber: row.employee_number, fullName: row.full_name, email: row.email ?? undefined,
    monthlyGross: Number(row.monthly_gross), monthlyPension: Number(row.monthly_pension), monthlyNhf: Number(row.monthly_nhf),
    monthlyNhis: Number(row.monthly_nhis), monthlyMortgageInterest: Number(row.monthly_mortgage_interest),
    monthlyLifeInsurance: Number(row.monthly_life_insurance), monthlyRent: Number(row.monthly_rent),
    monthlyOtherDeductions: Number(row.monthly_other_deductions),
  };
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

function EmployeeFields({ employee }: { employee?: EmployeeRow | null }) {
  return <div className="payroll-form-grid">
    <label>Employee number<input name="employee_number" defaultValue={employee?.employee_number} required /></label>
    <label>Full name<input name="full_name" defaultValue={employee?.full_name} required /></label>
    <label>Email, optional<input name="email" type="email" defaultValue={employee?.email ?? ""} /></label>
    <label>Monthly gross pay<input name="monthly_gross" type="number" min="0" step="0.01" defaultValue={employee?.monthly_gross} required /></label>
    <label>Monthly pension<input name="monthly_pension" type="number" min="0" step="0.01" defaultValue={employee?.monthly_pension ?? 0} /></label>
    <label>Monthly NHF<input name="monthly_nhf" type="number" min="0" step="0.01" defaultValue={employee?.monthly_nhf ?? 0} /></label>
    <label>Monthly NHIS<input name="monthly_nhis" type="number" min="0" step="0.01" defaultValue={employee?.monthly_nhis ?? 0} /></label>
    <label>Mortgage interest<input name="monthly_mortgage_interest" type="number" min="0" step="0.01" defaultValue={employee?.monthly_mortgage_interest ?? 0} /></label>
    <label>Life assurance premium<input name="monthly_life_insurance" type="number" min="0" step="0.01" defaultValue={employee?.monthly_life_insurance ?? 0} /></label>
    <label>Monthly residential rent<input name="monthly_rent" type="number" min="0" step="0.01" defaultValue={employee?.monthly_rent ?? 0} /></label>
    <label>Other payroll deductions<input name="monthly_other_deductions" type="number" min="0" step="0.01" defaultValue={employee?.monthly_other_deductions ?? 0} /></label>
  </div>;
}

export function PayrollWorkspace() {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [checked, setChecked] = useState(false);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [period, setPeriod] = useState(monthValue());
  const [view, setView] = useState<"team" | "run" | "history">("run");
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [importRows, setImportRows] = useState<PayrollImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [amendingRun, setAmendingRun] = useState<RunRow | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => employees.filter((employee) => employee.active).map(toInput).map(calculatePayrollLine), [employees]);
  const totals = useMemo(() => payrollTotals(lines), [lines]);

  const load = useCallback(async (userId: string) => {
    const organisationResult = await supabase.from("payroll_organisations").select("id,name,contact_email").eq("owner_user_id", userId).maybeSingle();
    if (organisationResult.error) {
      setMessage(organisationResult.error.code === "42P01" ? "Payroll setup is not active yet. Apply the payroll database migration first." : organisationResult.error.message);
      return;
    }
    const nextOrganisation = organisationResult.data as Organisation | null;
    setOrganisation(nextOrganisation);
    if (!nextOrganisation) return;
    const [employeeResult, runResult] = await Promise.all([
      supabase.from("payroll_employees").select("*").eq("organisation_id", nextOrganisation.id).order("created_at"),
      supabase.from("payroll_runs").select("id,pay_period,status,revision_number,supersedes_run_id,correction_note,total_gross,total_paye,total_net,ruleset_version").eq("organisation_id", nextOrganisation.id).order("pay_period", { ascending: false }).order("revision_number", { ascending: false }),
    ]);
    setEmployees((employeeResult.data ?? []) as EmployeeRow[]);
    setRuns((runResult.data ?? []) as RunRow[]);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecked(true); if (data.session) void load(data.session.user.id); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setChecked(true); if (next) void load(next.user.id); });
    return () => data.subscription.unsubscribe();
  }, [load, supabase]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const credentials = { email: String(data.get("email") || "").trim(), password: String(data.get("password") || "") };
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/payroll` } })
      : await supabase.auth.signInWithPassword(credentials);
    setMessage(result.error ? result.error.message : authMode === "signup" ? "Check your email to confirm your account." : "Signed in."); setBusy(false);
  }

  async function createOrganisation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session) return; setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const result = await supabase.from("payroll_organisations").insert({ owner_user_id: session.user.id, name: String(data.get("name") || "").trim(), contact_email: session.user.email }).select("id,name,contact_email").single();
    if (result.error) setMessage(result.error.message); else { setOrganisation(result.data as Organisation); setMessage("Payroll workspace created."); }
    setBusy(false);
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!organisation) return; setBusy(true); setMessage("");
    const form = event.currentTarget; const data = new FormData(form);
    const payload = {
      organisation_id: organisation.id, employee_number: String(data.get("employee_number") || "").trim(), full_name: String(data.get("full_name") || "").trim(),
      email: String(data.get("email") || "").trim() || null, monthly_gross: number(data.get("monthly_gross")), monthly_pension: number(data.get("monthly_pension")),
      monthly_nhf: number(data.get("monthly_nhf")), monthly_nhis: number(data.get("monthly_nhis")), monthly_mortgage_interest: number(data.get("monthly_mortgage_interest")),
      monthly_life_insurance: number(data.get("monthly_life_insurance")), monthly_rent: number(data.get("monthly_rent")), monthly_other_deductions: number(data.get("monthly_other_deductions")),
    };
    const result = await supabase.from("payroll_employees").insert(payload).select("*").single();
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => [...current, result.data as EmployeeRow]); form.reset(); setMessage("Employee added."); setView("run"); }
    setBusy(false);
  }

  async function updateEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingEmployee) return; setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const changes = { employee_number: String(data.get("employee_number") || "").trim(), full_name: String(data.get("full_name") || "").trim(), email: String(data.get("email") || "").trim() || null, monthly_gross: number(data.get("monthly_gross")), monthly_pension: number(data.get("monthly_pension")), monthly_nhf: number(data.get("monthly_nhf")), monthly_nhis: number(data.get("monthly_nhis")), monthly_mortgage_interest: number(data.get("monthly_mortgage_interest")), monthly_life_insurance: number(data.get("monthly_life_insurance")), monthly_rent: number(data.get("monthly_rent")), monthly_other_deductions: number(data.get("monthly_other_deductions")), updated_at: new Date().toISOString() };
    const result = await supabase.from("payroll_employees").update(changes).eq("id", editingEmployee.id).select("*").single();
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => current.map((employee) => employee.id === editingEmployee.id ? result.data as EmployeeRow : employee)); setEditingEmployee(null); setMessage("Employee updated."); }
    setBusy(false);
  }

  async function setEmployeeActive(employee: EmployeeRow, active: boolean) {
    const result = await supabase.from("payroll_employees").update({ active, updated_at: new Date().toISOString() }).eq("id", employee.id).select("*").single();
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => current.map((item) => item.id === employee.id ? result.data as EmployeeRow : item)); setMessage(active ? "Employee restored to payroll." : "Employee removed from future payroll runs."); }
  }

  async function readImport(file: File | undefined) {
    if (!file) return;
    const result = parsePayrollCsv(await file.text());
    const existing = new Set(employees.map((employee) => employee.employee_number));
    const duplicateErrors = result.rows.filter((row) => existing.has(row.employeeNumber)).map((row) => `Row ${row.rowNumber}: employee number ${row.employeeNumber} already exists.`);
    setImportRows(result.rows); setImportErrors([...result.errors, ...duplicateErrors]);
  }

  function downloadImportTemplate() {
    download("salarysabi-employee-import-template.csv", payrollCsvTemplate(), "text/csv;charset=utf-8");
  }

  async function importEmployees() {
    if (!organisation || !importRows.length || importErrors.length) return; setBusy(true); setMessage("");
    const payload = importRows.map((row) => ({ organisation_id: organisation.id, employee_number: row.employeeNumber, full_name: row.fullName, email: row.email ?? null, monthly_gross: row.monthlyGross, monthly_pension: row.monthlyPension, monthly_nhf: row.monthlyNhf, monthly_nhis: row.monthlyNhis, monthly_mortgage_interest: row.monthlyMortgageInterest, monthly_life_insurance: row.monthlyLifeInsurance, monthly_rent: row.monthlyRent, monthly_other_deductions: row.monthlyOtherDeductions }));
    const result = await supabase.from("payroll_employees").insert(payload).select("*");
    if (result.error) setMessage(result.error.message); else { setEmployees((current) => [...current, ...result.data as EmployeeRow[]]); setImportRows([]); setImportErrors([]); setMessage(`${result.data.length} employees imported.`); setView("run"); }
    setBusy(false);
  }

  async function finaliseRun() {
    if (!organisation || !lines.length) return; setBusy(true); setMessage("");
    const payPeriod = `${period}-01`;
    if (amendingRun && correctionNote.trim().length < 3) { setMessage("Add a correction note before finalising an amended run."); setBusy(false); return; }
    const items = lines.map((line) => ({ employee_id: line.id, monthly_gross: line.monthlyGross, monthly_paye: line.monthlyPaye, monthly_statutory_deductions: line.monthlyStatutoryDeductions, monthly_other_deductions: line.monthlyOtherDeductions, monthly_net_pay: line.monthlyNetPay }));
    const runResult = await supabase.rpc("finalise_payroll_run", { p_organisation_id: organisation.id, p_pay_period: payPeriod, p_ruleset_version: rulesetVersion, p_items: items, p_supersedes_run_id: amendingRun?.id ?? null, p_correction_note: amendingRun ? correctionNote.trim() : null });
    if (runResult.error) { setMessage(runResult.error.code === "23505" ? "A payroll run already exists for this month." : runResult.error.message); setBusy(false); return; }
    setRuns((current) => [runResult.data as RunRow, ...current.map((run) => run.id === amendingRun?.id ? { ...run, status: "superseded" as const } : run)]);
    setMessage(amendingRun ? "Amended payroll finalised. The original remains in history." : "Payroll finalised and saved."); setAmendingRun(null); setCorrectionNote(""); setView("history");
    setBusy(false);
  }

  function exportSchedule() {
    if (!organisation) return;
    download(`salarysabi-payroll-${period}.csv`, buildPayrollCsv(period, organisation.name, lines), "text/csv;charset=utf-8");
  }

  function beginAmendment(run: RunRow) {
    setPeriod(run.pay_period.slice(0, 7)); setAmendingRun(run); setCorrectionNote(""); setView("run"); setMessage("Review current employee figures, explain the correction and finalise a new revision.");
  }

  async function savePayslip(line: ReturnType<typeof calculatePayrollLine>) {
    if (!organisation) return;
    await downloadPayrollPayslip(organisation.name, period, line);
  }

  if (!checked) return <section className="payroll-shell"><p>Checking your account…</p></section>;
  if (!session) return <section className="payroll-shell payroll-access payroll-entry">
    <div className="payroll-entry-intro"><h1>Small-team payroll</h1><p>Calculate PAYE and create payslips for up to 20 employees.</p>
      <ul className="payroll-feature-preview"><li>Add employees</li><li>Review payroll</li><li>Export records</li></ul>
      <aside className="payroll-boundary">SalarySabi does not make payments or remit taxes.</aside>
    </div>
    <div className="payroll-auth-panel"><div className="payroll-auth-toggle"><button className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")} type="button">Sign in</button><button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")} type="button">Create account</button></div><form onSubmit={authenticate}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={8} required /></label><button className="primary-button" disabled={busy} type="submit">{authMode === "signup" ? "Create account" : "Sign in"}</button><small>Your payroll records are private.</small></form><p className="payroll-message" role="status">{message}</p></div>
  </section>;
  if (!organisation) return <section className="payroll-shell payroll-access payroll-onboarding"><span className="eyebrow">Set up payroll</span><h1>Create your employer workspace.</h1><p>Start with the business name that should appear on payroll schedules and payslips.</p><ol className="payroll-onboarding-steps" aria-label="Payroll setup steps"><li className="active"><span>01</span><strong>Create workspace</strong></li><li><span>02</span><strong>Add employees</strong></li><li><span>03</span><strong>Run payroll</strong></li></ol><form onSubmit={createOrganisation}><label>Business name<input name="name" minLength={2} maxLength={120} required /></label><button className="primary-button" disabled={busy} type="submit">Create workspace</button><p className="payroll-private-note"><strong>Private to your account.</strong> Your business and payroll records are available only inside your employer workspace.</p></form><p className="payroll-message" role="status">{message}</p></section>;

  return <section className="payroll-shell">
    <header className="payroll-header"><div><span className="eyebrow">Small-team payroll · Ruleset {rulesetVersion}</span><h1>{organisation.name}</h1><p>Calculate PAYE, prepare a schedule and issue payslips. SalarySabi does not move or remit funds.</p></div><button onClick={() => supabase.auth.signOut()} type="button">Sign out</button></header>
    <nav className="payroll-tabs" aria-label="Payroll sections"><button className={view === "run" ? "active" : ""} onClick={() => setView("run")} type="button">Run payroll</button><button className={view === "team" ? "active" : ""} onClick={() => setView("team")} type="button">Team <span>{employees.length}</span></button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")} type="button">History <span>{runs.length}</span></button></nav>
    <p className="payroll-message" role="status">{message}</p>
    {view === "run" && <div className="payroll-run">
      {amendingRun && <aside className="payroll-amendment"><div><strong>Preparing amendment {amendingRun.revision_number + 1}</strong><span>The original run will remain in history as superseded.</span></div><label>Correction note<textarea value={correctionNote} onChange={(event) => setCorrectionNote(event.target.value)} maxLength={500} required /></label><button onClick={() => { setAmendingRun(null); setCorrectionNote(""); }} type="button">Cancel amendment</button></aside>}
      <div className="payroll-run-bar"><label>Pay period<input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} disabled={Boolean(amendingRun)} /></label><div><button disabled={!lines.length} onClick={exportSchedule} type="button">Download CSV register</button><button className="primary-button" disabled={busy || !lines.length} onClick={finaliseRun} type="button">{amendingRun ? "Finalise amendment" : "Finalise payroll"}</button></div></div>
      {lines.length ? <><div className="payroll-totals"><div><span>Gross payroll</span><strong>{money.format(totals.gross)}</strong></div><div><span>PAYE</span><strong>{money.format(totals.paye)}</strong></div><div><span>Total deductions</span><strong>{money.format(totals.deductions)}</strong></div><div><span>Net payroll</span><strong>{money.format(totals.net)}</strong></div></div><div className="payroll-table" role="table" aria-label="Payroll preview"><div className="payroll-table-head" role="row"><span>Employee</span><span>Gross</span><span>PAYE</span><span>Deductions</span><span>Net pay</span><span>Payslip</span></div>{lines.map((line) => <div role="row" key={line.id}><span><strong>{line.fullName}</strong><small>{line.employeeNumber}</small></span><span>{money.format(line.monthlyGross)}</span><span>{money.format(line.monthlyPaye)}</span><span>{money.format(line.monthlyStatutoryDeductions + line.monthlyOtherDeductions)}</span><strong>{money.format(line.monthlyNetPay)}</strong><button onClick={() => void savePayslip(line)} type="button">PDF</button></div>)}</div></> : <div className="payroll-empty"><h2>Add your first employee</h2><p>Your payroll preview will appear here before anything is saved.</p><button className="primary-button" onClick={() => setView("team")} type="button">Add employee</button></div>}
    </div>}
    {view === "team" && <div className="payroll-team-page">
      <section className="payroll-import"><div><span className="eyebrow">Bulk onboarding</span><h2>Import employees from CSV</h2><p>Use the SalarySabi template so every pay and deduction field maps correctly.</p></div><div className="payroll-import-actions"><button onClick={downloadImportTemplate} type="button">Download template</button><label>Choose CSV<input accept=".csv,text/csv" type="file" onChange={(event) => void readImport(event.target.files?.[0])} /></label></div>{importRows.length > 0 && <div className="payroll-import-preview"><strong>{importRows.length} rows ready to review</strong>{importErrors.map((error) => <p key={error}>{error}</p>)}<button className="primary-button" disabled={busy || importErrors.length > 0} onClick={importEmployees} type="button">Import {importRows.length} employees</button></div>}</section>
      <div className="payroll-team"><form className="payroll-employee-form" onSubmit={editingEmployee ? updateEmployee : addEmployee}><div><span className="eyebrow">{editingEmployee ? "Edit employee" : "New employee"}</span><h2>{editingEmployee ? `Update ${editingEmployee.full_name}` : "Add monthly payroll figures"}</h2><p>Use amounts you can support with employment and deduction records.</p></div><EmployeeFields employee={editingEmployee} /><div className="payroll-form-actions"><button className="primary-button" disabled={busy} type="submit">{editingEmployee ? "Save changes" : "Add employee"}</button>{editingEmployee && <button onClick={() => setEditingEmployee(null)} type="button">Cancel</button>}</div></form>{employees.length > 0 && <div className="payroll-team-list"><h2>Current team</h2>{employees.map((employee) => <article className={employee.active ? "" : "inactive"} key={employee.id}><div><strong>{employee.full_name}</strong><span>{employee.employee_number} · {employee.active ? "Active" : "Inactive"}</span></div><strong>{money.format(Number(employee.monthly_gross))} monthly</strong><div className="payroll-employee-actions"><button onClick={() => setEditingEmployee(employee)} type="button">Edit</button><button onClick={() => void setEmployeeActive(employee, !employee.active)} type="button">{employee.active ? "Deactivate" : "Restore"}</button></div></article>)}</div>}</div>
    </div>}
    {view === "history" && <div className="payroll-history"><h2>Finalised payroll runs</h2>{runs.length ? runs.map((run) => <article className={run.status === "superseded" ? "superseded" : ""} key={run.id}><time>{run.pay_period.slice(0, 7)} <small>Revision {run.revision_number}</small></time><div><span>Gross</span><strong>{money.format(Number(run.total_gross))}</strong></div><div><span>PAYE</span><strong>{money.format(Number(run.total_paye))}</strong></div><div><span>Net</span><strong>{money.format(Number(run.total_net))}</strong></div><div className="payroll-run-status"><small>{run.status === "superseded" ? "Superseded" : `Ruleset ${run.ruleset_version}`}</small>{run.correction_note && <span>{run.correction_note}</span>}</div>{run.status === "finalised" && <button onClick={() => beginAmendment(run)} type="button">Create amendment</button>}</article>) : <div className="payroll-empty"><h2>No finalised runs yet</h2><p>Review the current month and finalise it when the figures are correct.</p></div>}</div>}
  </section>;
}
