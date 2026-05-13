import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

function loginPathWithCallback(callbackPath: string): string {
  const searchParams = new URLSearchParams();
  if (callbackPath && callbackPath !== "/login") {
    searchParams.set("callbackUrl", callbackPath);
  }
  const query = searchParams.toString();
  return query ? `/login?${query}` : "/login";
}

/** Server Component 入口使用真实会话校验；middleware 只做快速跳转，不是授权边界。 */
export async function requirePageSession(callbackPath: string) {
  await ensureAuthDatabaseReady();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect(loginPathWithCallback(callbackPath));
  }
  return session;
}
