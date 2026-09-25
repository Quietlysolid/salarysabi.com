import { permanentRedirect } from "next/navigation";

export default function LegacyTalentPage() {
  permanentRedirect("/individuals");
}
