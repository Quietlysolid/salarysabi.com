"use client";

import type { ReactNode } from "react";

export function ProductState({
  kind,
  title,
  detail,
  action,
  links,
  compact = false,
}: {
  kind: "loading" | "empty" | "error" | "cached";
  title: string;
  detail?: string;
  action?: ReactNode;
  links?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`product-state product-state-${kind}${compact ? " is-compact" : ""}`}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <span className="product-state-marker" aria-hidden="true">
        {kind === "loading" ? "…" : kind === "error" ? "!" : kind === "cached" ? "↻" : "0"}
      </span>
      <div className="product-state-copy">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
      {action && <div className="product-state-action">{action}</div>}
      {links && <div className="product-state-links">{links}</div>}
    </div>
  );
}
