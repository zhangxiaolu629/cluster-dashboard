import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

/** Server pages must validate the session before reading private cluster data. */
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
