import CreateDeploymentForm from "@/components/forms/CreateDeploymentForm";
import { requirePageSession } from "@/lib/require-page-session";

export default async function CreateDeploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageSession(`/cluster/${id}/deployment/create`);

  return <CreateDeploymentForm />;
}
