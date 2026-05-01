import AiChatPanel from "@/components/ai/AiChatPanel";
import PageLayout from "@/components/layout/PageLayout";

export default function AiChatPage() {
  return (
    <PageLayout selectedKey="ai-chat">
      <AiChatPanel />
    </PageLayout>
  );
}
