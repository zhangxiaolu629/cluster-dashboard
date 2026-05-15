import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

/** Server Component boundary auth: middleware only checks cookie presence, so pages must verify the session. */
export async function requirePageSession(callbackUrl = "/"): Promise<void> {
  await ensureAuthDatabaseReady();
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
}
