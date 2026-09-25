import { buildJobAlertEmail, type AlertEmailJob } from "./job-alert-email.ts";

export type Delivery = { id: string; alert_id: string; claim_token: string; payload: { recipient: string; keywords: string; unsubscribe_token: string; jobs: AlertEmailJob[] } };
export type Outcome = "sent" | "retry" | "uncertain";
type Dependencies = {
  claim: () => Promise<{ checked: number; delivery: Delivery | null }>;
  begin: (delivery: Delivery) => Promise<boolean>;
  finish: (delivery: Delivery, outcome: Outcome, messageId: string | null, error: string | null) => Promise<void>;
  send: (email: ReturnType<typeof buildJobAlertEmail>, signal: AbortSignal) => Promise<Response>;
  unsubscribeBase: string;
};

export async function runJobAlertBatch(deps: Dependencies) {
  const started = Date.now();
  const result = { alerts_processed: 0, emails_sent: 0, retryable: 0, uncertain: 0, cancelled: 0, batches: 0, complete: false };
  // Leave headroom for claim/begin/send/finish and an uncertainty write if persistence fails.
  for (let i = 0; i < 30 && Date.now() - started < 22000; i++) {
    const { checked, delivery } = await deps.claim();
    result.alerts_processed += checked;
    result.batches++;
    if (!delivery) {
      if (checked < 50) { result.complete = true; break; }
      continue;
    }
    if (!await deps.begin(delivery)) { result.cancelled++; continue; }
    const email = buildJobAlertEmail({ alertId: delivery.alert_id, recipient: delivery.payload.recipient,
      keywords: delivery.payload.keywords, jobs: delivery.payload.jobs,
      unsubscribeUrl: `${deps.unsubscribeBase}?unsubscribe=${encodeURIComponent(delivery.payload.unsubscribe_token)}`,
      date: new Date().toISOString().slice(0, 10) });
    let outcome: Outcome = "uncertain", messageId: string | null = null, reason: string | null = null;
    try {
      const response = await deps.send(email, AbortSignal.timeout(8000));
      if ([400, 401, 403, 422, 429].includes(response.status)) {
        outcome = "retry"; reason = `provider_rejected_${response.status}`;
      } else if (!response.ok) {
        reason = `provider_ambiguous_${response.status}`;
      } else {
        const body = await response.json();
        if (body.success === true && typeof body.result?.message_id === "string" && body.result.message_id.length) {
          outcome = "sent"; messageId = body.result.message_id;
        } else reason = "provider_acceptance_not_confirmed";
      }
    } catch { reason = "provider_timeout_or_network_error"; }
    try {
      await deps.finish(delivery, outcome, messageId, reason);
    } catch {
      // Do not resend. The durable sending state also becomes uncertain when its lease expires.
      console.error("Job alert outcome persistence failed", { delivery_id: delivery.id, provider_message_id: messageId });
      result.uncertain++;
      try { await deps.finish(delivery, "uncertain", messageId, "outcome_persistence_failed"); } catch { /* durable sending lease remains */ }
      break;
    }
    if (outcome === "sent") result.emails_sent++;
    else if (outcome === "retry") result.retryable++;
    else result.uncertain++;
  }
  return { ...result, elapsed_ms: Date.now() - started };
}
