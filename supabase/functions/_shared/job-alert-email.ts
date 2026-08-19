export type AlertEmailJob = {
  slug: string; title: string; company_name: string; location: string;
  salary_currency: string; salary_min: number; salary_max: number;
  salary_type: string; salary_period: string;
};

export const escapeEmailHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);

export function buildJobAlertEmail({ alertId, recipient, keywords, jobs, unsubscribeUrl, date }: { alertId: string; recipient: string; keywords: string; jobs: AlertEmailJob[]; unsubscribeUrl: string; date: string }) {
  const items = jobs.slice(0, 20).map((job) => `<li style="margin-bottom:16px"><a href="https://salarysabi.com/jobs/${encodeURIComponent(job.slug)}" style="font-weight:700;color:#075c46">${escapeEmailHtml(job.title)}</a><br>${escapeEmailHtml(job.company_name)} · ${escapeEmailHtml(job.location)}<br>${escapeEmailHtml(job.salary_currency)} ${Number(job.salary_min).toLocaleString()}–${Number(job.salary_max).toLocaleString()} ${escapeEmailHtml(job.salary_type)} / ${escapeEmailHtml(job.salary_period)}</li>`).join("");
  return {
    to: [recipient],
    subject: `${jobs.length} new SalarySabi ${jobs.length === 1 ? "job" : "jobs"} matching “${keywords}”`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1 style="color:#12352b">New jobs matching your alert</h1><p>You asked SalarySabi to watch for <strong>${escapeEmailHtml(keywords)}</strong>.</p><ul style="padding-left:20px">${items}</ul><p><a href="https://salarysabi.com/jobs">Search all jobs</a></p><hr><p style="font-size:12px;color:#66736e">You received this because you created a job alert. <a href="${escapeEmailHtml(unsubscribeUrl)}">Unsubscribe from this alert</a>.</p></div>`,
    idempotencyKey: `alert-${alertId}-${date}`,
  };
}
