import AiChatStandaloneView from "@/components/ai/AiChatStandaloneView";
import { requireAuthenticatedPage } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

export default async function AiChatPage() {
  await requireAuthenticatedPage("/ai-chat");

  return <AiChatStandaloneView />;
}
