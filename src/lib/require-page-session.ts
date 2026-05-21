import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

export async function requireAuthenticatedPage(callbackUrl = "/") {
  await ensureAuthDatabaseReady();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    return;
  }

  const safeCallback = callbackUrl.startsWith("/") ? callbackUrl : "/";
  redirect(`/login?callbackUrl=${encodeURIComponent(safeCallback)}`);
}
