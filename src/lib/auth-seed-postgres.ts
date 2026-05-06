import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

import { getFixedUsersFromEnv, logAuthUsersEnvConfiguredButNoUsers } from "@/lib/auth-seed";

function internalEmail(username: string) {
  return `${username}@cluster-dashboard.internal`;
}

/** 将固定账号同步到 Postgres（与 SQLite 版语义一致，供 `AUTH_DATABASE_URL` 使用）。 */
export async function syncFixedUsersToPostgres(pool: Pool): Promise<void> {
  const users = getFixedUsersFromEnv();
  if (users.length === 0) {
    logAuthUsersEnvConfiguredButNoUsers();
    return;
  }
  const now = new Date().toISOString();

  for (const u of users) {
    const username = u.username.trim().toLowerCase();
    const sel = await pool.query<{ userId: string; accountId: string; password: string | null }>(
      `SELECT u.id AS "userId", a.id AS "accountId", a.password
       FROM "user" u
       INNER JOIN account a ON a."userId" = u.id AND a."providerId" = $2
       WHERE u.username = $1`,
      [username, "credential"]
    );
    const row = sel.rows[0];

    if (row) {
      if (row.password !== u.passwordHash) {
        await pool.query(
          `UPDATE account SET password = $1, "updatedAt" = $2::timestamptz WHERE id = $3`,
          [u.passwordHash, now, row.accountId]
        );
      }
      continue;
    }

    const userId = randomUUID();
    const accountId = randomUUID();
    const email = internalEmail(username);
    const display = u.username.trim();

    await pool.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt", "username", "displayUsername")
       VALUES ($1, $2, $3, true, $4::timestamptz, $5::timestamptz, $6, $7)`,
      [userId, display, email, now, now, username, display]
    );

    await pool.query(
      `INSERT INTO account ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)`,
      [accountId, userId, "credential", userId, u.passwordHash, now, now]
    );
  }
}
