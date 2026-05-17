import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

/** Server Component 入口必须做真实会话校验，middleware 的 cookie 检查不能作为授权边界。 */
export async function requirePageSession(): Promise<void> {
  await ensureAuthDatabaseReady();
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }
}
