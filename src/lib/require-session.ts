import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

export function unauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** 未登录返回 401 Response；已登录返回 `undefined` */
export async function assertAuthenticated(): Promise<NextResponse | undefined> {
  await ensureAuthDatabaseReady();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return unauthorizedJson();
  }
  return undefined;
}

/** 服务端页面必须做真实会话校验；middleware 里的 Cookie 判断只用于提前跳转。 */
export async function requireAuthenticatedPage(): Promise<void> {
  await ensureAuthDatabaseReady();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/login");
  }
}
