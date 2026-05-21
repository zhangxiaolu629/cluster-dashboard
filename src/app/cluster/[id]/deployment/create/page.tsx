import CreateDeploymentForm from "@/components/forms/CreateDeploymentForm";
import { requireAuthenticatedPage } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

export default async function CreateDeploymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuthenticatedPage(`/cluster/${id}/deployment/create`);

  return <CreateDeploymentForm />;
}
