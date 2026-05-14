import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

function safeCallbackPath(callbackPath: string): string {
  if (callbackPath.startsWith("/") && !callbackPath.startsWith("//")) {
    return callbackPath;
  }
  return "/";
}

/** Server Component 入口使用的真实会话校验；未登录时跳转登录页。 */
export async function requirePageSession(callbackPath = "/") {
  await ensureAuthDatabaseReady();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    const params = new URLSearchParams({
      callbackUrl: safeCallbackPath(callbackPath),
    });
    redirect(`/login?${params.toString()}`);
  }

  return session;
}
