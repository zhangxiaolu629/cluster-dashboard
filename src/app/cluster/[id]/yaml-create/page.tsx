import { Suspense } from "react";
import PageLayout from "@/components/layout/PageLayout";
import YamlCreate from "@/components/forms/YamlCreate";
import { getInitialYamlForKind } from "@/lib/k8sYamlTemplates";

export default async function YamlCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { id } = await params;
  const { kind } = await searchParams;
  const initialYaml = getInitialYamlForKind(kind);

  return (
    <PageLayout selectedKey="yaml-create" clusterId={id}>
      <Suspense fallback={null}>
        <YamlCreate clusterId={id} initialYaml={initialYaml} />
      </Suspense>
    </PageLayout>
  );
}
