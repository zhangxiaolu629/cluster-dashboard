import { Suspense } from "react";
import PageLayout from "@/components/layout/PageLayout";
import YamlCreate from "@/components/forms/YamlCreate";
import { getInitialYamlForKind } from "@/lib/k8sYamlTemplates";
import { requirePageSession } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

export default async function YamlCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  await requirePageSession();

  const { id } = await params;
  const { kind } = await searchParams;
  const initialYaml = getInitialYamlForKind(kind);

  return (
    <PageLayout selectedKey="yaml-create" clusterId={id}>
      <Suspense fallback={null}>
        <YamlCreate key={kind ?? "none"} clusterId={id} initialYaml={initialYaml} />
      </Suspense>
    </PageLayout>
  );
}
