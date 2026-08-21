import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { WorkspaceFixture } from "@/components/workspace-fixture";

export default async function WorkspaceFixturePage() {
  if ((await headers()).get("x-salarysabi-e2e") !== "workspace-fixture") notFound();
  return <main id="main-content" tabIndex={-1}><WorkspaceFixture /></main>;
}
