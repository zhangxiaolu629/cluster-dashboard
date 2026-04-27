import PageLayout from "@/components/layout/PageLayout";
import YamlCreate from "@/components/forms/YamlCreate";

export default async function YamlCreatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageLayout selectedKey="yaml-create" clusterId={id}>
      <YamlCreate clusterId={id} />
    </PageLayout>
  );
}