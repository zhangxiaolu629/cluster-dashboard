let ran = false;
let runPromise: Promise<void> | null = null;

/** 建表并同步固定账号；应在首屏请求前完成（由 instrumentation 与各入口兜底调用）。 */
export function ensureAuthDatabaseReady(): Promise<void> {
  if (ran) {
    return Promise.resolve();
  }
  if (!runPromise) {
    runPromise = (async () => {
      const { auth } = await import("@/lib/auth");
      const { getMigrations } = await import("better-auth/db/migration");
      const { getPostgresPool } = await import("@/lib/auth-postgres");
      const { syncFixedUsersToPostgres } = await import("@/lib/auth-seed-postgres");

      const { runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      await syncFixedUsersToPostgres(getPostgresPool());
      ran = true;
    })().finally(() => {
      if (!ran) {
        runPromise = null;
      }
    });
  }
  return runPromise;
}
