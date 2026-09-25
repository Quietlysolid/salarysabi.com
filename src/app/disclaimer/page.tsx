import { permanentRedirect } from "next/navigation";

export default function DisclaimerPage() {
  permanentRedirect("/terms#estimates");
}
