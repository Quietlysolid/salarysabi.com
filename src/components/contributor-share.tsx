"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { track } from "@/components/analytics";

const shareUrl = "https://salarysabi.com/contributors";
const shareText = "SalarySabi pays for approved anonymous salary reports and verified Nigerian job leads. See the funded offers:";

export function ContributorShare() {
  const [copied, setCopied] = useState(false);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  async function share() {
    track("reward_offer_shared");
    if (navigator.share) {
      try {
        await navigator.share({ title: "SalarySabi contributor rewards", text: shareText, url: shareUrl });
        return;
      } catch {
        // A cancelled native share should not produce an error state.
      }
    }
    await copy(false);
  }

  async function copy(trackEvent = true) {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      if (trackEvent) track("reward_offer_shared");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", shareUrl);
    }
  }

  return <section className="contributor-share" aria-labelledby="contributor-share-title">
    <div>
      <span className="eyebrow">Grow trusted pay data</span>
      <h2 id="contributor-share-title">Know someone with useful pay information?</h2>
      <p>Send them the funded offers. SalarySabi rewards approved evidence—not referrals, clicks or unverified posts.</p>
    </div>
    <div className="contributor-share-actions">
      <a href={whatsappUrl} onClick={() => track("reward_offer_shared")} rel="noopener noreferrer" target="_blank">Share on WhatsApp</a>
      <button onClick={() => void share()} type="button"><Share2 aria-hidden="true" />Share</button>
      <button onClick={() => void copy()} type="button">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copied" : "Copy message"}</button>
    </div>
  </section>;
}
