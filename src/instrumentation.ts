export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAuthDatabaseReady } = await import("@/lib/auth-bootstrap");
    await ensureAuthDatabaseReady();
  }
}
