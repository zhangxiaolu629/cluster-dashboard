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
      const { getAuthDatabase } = await import("@/lib/auth-sqlite");
      const { syncFixedUsersFromEnv } = await import("@/lib/auth-seed");

      getAuthDatabase();
      const { runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      syncFixedUsersFromEnv(getAuthDatabase());
      ran = true;
    })().finally(() => {
      if (!ran) {
        runPromise = null;
      }
    });
  }
  return runPromise;
}
