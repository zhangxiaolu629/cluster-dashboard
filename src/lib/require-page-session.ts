import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

/** Server Page 入口使用：必须校验真实会话，不能只依赖 middleware 的 Cookie 存在性判断。 */
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
