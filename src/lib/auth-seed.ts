import type Database from "better-sqlite3";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const userEntrySchema = z.object({
  username: z.string().min(1),
  passwordHash: z.string().min(1),
});

const usersSchema = z.array(userEntrySchema);

function isPlausibleBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(hash);
}

function tryDecodeAuthUsersJsonBase64(): string | undefined {
  const b64 = process.env.AUTH_USERS_JSON_BASE64?.trim();
  if (!b64) {
    return undefined;
  }
  try {
    const decoded = Buffer.from(b64, "base64").toString("utf8").trim();
    if (!decoded) {
      return undefined;
    }
    JSON.parse(decoded);
    return decoded;
  } catch (e) {
    console.warn("[auth-seed] AUTH_USERS_JSON_BASE64 解码或 JSON 无效，已忽略：", e);
    return undefined;
  }
}

/** 优先文件 → Base64（无 `$` 展开问题）→ 行内 `AUTH_USERS_JSON`（注意各平台对 `$` 的处理）。 */
function getAuthUsersJsonRaw(): string | undefined {
  const filePath = process.env.AUTH_USERS_JSON_FILE?.trim();
  if (filePath) {
    const abs = resolve(process.cwd(), filePath);
    if (existsSync(abs)) {
      return readFileSync(abs, "utf8").trim();
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[auth-seed] AUTH_USERS_JSON_FILE 未找到文件: ${abs}`);
    }
  }
  const fromB64 = tryDecodeAuthUsersJsonBase64();
  if (fromB64) {
    return fromB64;
  }
  const raw = process.env.AUTH_USERS_JSON?.trim();
  return raw || undefined;
}

function getFixedUsersFromEnv() {
  const raw = getAuthUsersJsonRaw();
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const users = usersSchema.parse(parsed);
    if (process.env.NODE_ENV !== "production") {
      for (const u of users) {
        if (!isPlausibleBcryptHash(u.passwordHash)) {
          console.warn(
            `[auth-seed] 用户 "${u.username}" 的 passwordHash 不像有效 bcrypt。` +
              "若在 `.env.local` 里写哈希，Next 会把 `$变量名` 展开掉；请改用 `AUTH_USERS_JSON_FILE` 指向 JSON 文件，或对每个 `$` 写成 `\\$`（见 README）。"
          );
        }
      }
    }
    return users;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[auth-seed] AUTH_USERS_JSON（或 AUTH_USERS_JSON_FILE / AUTH_USERS_JSON_BASE64）解析失败，已跳过同步：",
        e
      );
    }
    return [];
  }
}

function internalEmail(username: string) {
  return `${username}@cluster-dashboard.internal`;
}

/** 将 `AUTH_USERS_JSON` 同步到本地 SQLite（幂等；已存在用户时仅更新 credential 密码哈希）。 */
export function syncFixedUsersFromEnv(database: Database.Database) {
  const users = getFixedUsersFromEnv();
  if (users.length === 0) {
    return;
  }
  const now = new Date().toISOString();

  for (const u of users) {
    const username = u.username.trim().toLowerCase();
    const row = database
      .prepare(
        `SELECT u.id AS userId, a.id AS accountId, a.password AS password
         FROM user u
         JOIN account a ON a.userId = u.id AND a.providerId = 'credential'
         WHERE u.username = ?`
      )
      .get(username) as { userId: string; accountId: string; password: string | null } | undefined;

    if (row) {
      if (row.password !== u.passwordHash) {
        database
          .prepare("UPDATE account SET password = ?, updatedAt = ? WHERE id = ?")
          .run(u.passwordHash, now, row.accountId);
      }
      continue;
    }

    const userId = randomUUID();
    const accountId = randomUUID();
    const email = internalEmail(username);

    database
      .prepare(
        `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, username, displayUsername)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?)`
      )
      .run(userId, u.username.trim(), email, now, now, username, u.username.trim());

    database
      .prepare(
        `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
         VALUES (?, ?, 'credential', ?, ?, ?, ?)`
      )
      .run(accountId, userId, userId, u.passwordHash, now, now);
  }
}
