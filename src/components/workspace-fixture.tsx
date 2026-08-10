"use client";

import { useState } from "react";
import { JobAccountActionBar } from "./job-actions";
import { JobWorkspace, type ApplicationJobRow, type JobAlertRow, type SavedJobRow } from "./job-workspace";

const savedFixture: SavedJobRow[] = [{ job_id: "fixture-product", jobs: { slug: "fixture-product-designer", title: "Product Designer", company_name: "SalarySabi Fixture", expires_at: "2026-09-01" } }];
const applicationFixture: ApplicationJobRow[] = [{ job_id: "fixture-analyst", status: "applied", jobs: { slug: "fixture-finance-analyst", title: "Finance Analyst", company_name: "SalarySabi Fixture" } }];
const alertFixture: JobAlertRow[] = [{ id: "fixture-alert", keywords: "Product design", location: "Lagos", work_mode: "hybrid", active: true }];

export function WorkspaceFixture() {
  const [saved, setSaved] = useState(savedFixture);
  const [applications, setApplications] = useState(applicationFixture);
  const [alerts, setAlerts] = useState(alertFixture);
  const [detailSaved, setDetailSaved] = useState(false);
  const [detailApplied, setDetailApplied] = useState(false);
  const [message, setMessage] = useState("Local fixture. No account or database is connected.");

  return <>
    <JobWorkspace email="workspace-fixture@salarysabi.test" saved={saved} applications={applications} alerts={alerts} message={message} onSignOut={() => setMessage("Sign-out action received.")} onRemoveSaved={(id) => setSaved((rows) => rows.filter((row) => row.job_id !== id))} onUpdateApplication={(id, status) => setApplications((rows) => rows.map((row) => row.job_id === id ? { ...row, status } : row))} onRemoveAlert={(id) => setAlerts((rows) => rows.filter((row) => row.id !== id))} />
    <section className="workspace-fixture-job-actions" aria-labelledby="fixture-job-actions-title"><h2 id="fixture-job-actions-title">Populated job-detail account actions</h2><JobAccountActionBar saved={detailSaved} applied={detailApplied} onToggleSave={() => setDetailSaved((value) => !value)} onMarkApplied={() => setDetailApplied(true)} /></section>
  </>;
}
