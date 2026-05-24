import CreateDeploymentForm from "@/components/forms/CreateDeploymentForm";
import { requirePageSession } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

export default async function CreateDeploymentPage() {
  await requirePageSession();

  return <CreateDeploymentForm />;
}
