import AiChatStandaloneView from "@/components/ai/AiChatStandaloneView";
import { requirePageSession } from "@/lib/require-page-session";

export const dynamic = "force-dynamic";

export default async function AiChatPage() {
  await requirePageSession();

  return <AiChatStandaloneView />;
}
