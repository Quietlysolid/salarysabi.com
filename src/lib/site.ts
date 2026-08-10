export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://salarysabi.com";

export const rulesetName = "Nigeria Tax Act 2025 and JRB guidance for 2026";
export const rulesVerifiedDate = "29 July 2026";
export const rulesVerifiedIso = "2026-07-29";
export const legalContentUpdatedDate = "8 August 2026";
export const legalContentUpdatedIso = "2026-08-08";
export const siteContentUpdatedIso = "2026-08-08";
export const rulesetVersion = "2026.1";

// Kept as an alias for older consumers while trust copy migrates to the named token.
export const lastVerified = rulesVerifiedDate;
