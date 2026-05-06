import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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
    console.warn(`[auth-seed] AUTH_USERS_JSON_FILE 未找到文件: ${abs}`);
  }
  const fromB64 = tryDecodeAuthUsersJsonBase64();
  if (fromB64) {
    return fromB64;
  }
  const raw = process.env.AUTH_USERS_JSON?.trim();
  return raw || undefined;
}

export function getFixedUsersFromEnv() {
  const raw = getAuthUsersJsonRaw();
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const users = usersSchema.parse(parsed);
    for (const u of users) {
      if (!isPlausibleBcryptHash(u.passwordHash)) {
        console.warn(
          `[auth-seed] 用户 "${u.username}" 的 passwordHash 不像有效 bcrypt。` +
            "若在 `.env.local` 里写哈希，Next 会把 `$变量名` 展开掉；请改用 `AUTH_USERS_JSON_BASE64`、或 `AUTH_USERS_JSON_FILE`、或对每个 `$` 写成 `\\$`（见 README）。"
        );
      }
    }
    return users;
  } catch (e) {
    console.warn(
      "[auth-seed] AUTH_USERS_JSON（或 AUTH_USERS_JSON_FILE / AUTH_USERS_JSON_BASE64）解析失败，已跳过同步：",
      e
    );
    return [];
  }
}

/** 配置了账号相关变量却解析不到用户时打错误日志（便于线上排查）。 */
export function logAuthUsersEnvConfiguredButNoUsers() {
  const hasIntent =
    Boolean(process.env.AUTH_USERS_JSON?.trim()) ||
    Boolean(process.env.AUTH_USERS_JSON_BASE64?.trim()) ||
    Boolean(process.env.AUTH_USERS_JSON_FILE?.trim());
  if (!hasIntent) {
    return;
  }
  console.error(
    "[auth-seed] 已配置 AUTH_USERS_JSON / AUTH_USERS_JSON_BASE64 / AUTH_USERS_JSON_FILE，但未解析出任何用户。" +
      " 常见原因：Base64 错误、行内 JSON 无效、或 AUTH_USERS_JSON_FILE 在运行时路径下不存在。登录将失败。"
  );
}
