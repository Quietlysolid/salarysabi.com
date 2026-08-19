import { describe, expect, it } from "vitest";
import { buildJobAlertEmail } from "./job-alert-email";

describe("job alert email delivery contract", () => {
  it("builds an escaped, unsubscribable and idempotent message", () => {
    const email = buildJobAlertEmail({
      alertId: "alert-1", recipient: "fixture@salarysabi.test", keywords: "design <script>",
      unsubscribeUrl: "https://example.test/unsubscribe?token=a&b=1", date: "2026-08-07",
      jobs: [{ slug: "product-designer", title: "Product <Designer>", company_name: "A&B", location: "Lagos", salary_currency: "NGN", salary_min: 300000, salary_max: 400000, salary_type: "gross", salary_period: "monthly" }],
    });
    expect(email.to).toEqual(["fixture@salarysabi.test"]);
    expect(email.subject).toContain("1 new SalarySabi job");
    expect(email.html).toContain("Product &lt;Designer&gt;");
    expect(email.html).toContain("A&amp;B");
    expect(email.html).toContain("Unsubscribe from this alert");
    expect(email.html).not.toContain("<script>");
    expect(email.idempotencyKey).toBe("alert-alert-1-2026-08-07");
  });
});
