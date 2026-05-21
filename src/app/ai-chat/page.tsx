import AiChatStandaloneView from "@/components/ai/AiChatStandaloneView";
import { requireAuthenticatedPage } from "@/lib/require-page-session";

export default async function AiChatPage() {
  await requireAuthenticatedPage("/ai-chat");

  return <AiChatStandaloneView />;
}
