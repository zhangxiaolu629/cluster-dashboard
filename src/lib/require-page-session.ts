import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

function buildLoginPath(callbackUrl: string) {
  const params = new URLSearchParams({ callbackUrl });
  return `/login?${params.toString()}`;
}

export async function requirePageSession(callbackUrl: string) {
  const requestHeaders = await headers();
  await ensureAuthDatabaseReady();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect(buildLoginPath(callbackUrl));
  }

  return session;
}
