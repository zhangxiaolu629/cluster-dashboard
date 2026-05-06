import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { getPostgresDatabaseOption } from "@/lib/auth-postgres";

/** 仅当 `NODE_ENV === "development"` 且未配置合法密钥时使用，便于新克隆仓库直接 `npm run dev`。 */
const DEV_PLACEHOLDER_SECRET = "cluster-dashboard-local-dev-only-secret-min-32-chars";

function resolveBetterAuthSecret(): string {
  const fromEnv = process.env.BETTER_AUTH_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[auth] BETTER_AUTH_SECRET 未设置或不足 32 字符，已使用本地开发占位密钥。请在 .env.local 中配置 `openssl rand -base64 32` 等强随机值（见 README）。"
    );
    return DEV_PLACEHOLDER_SECRET;
  }
  throw new Error("BETTER_AUTH_SECRET 未设置或长度不足 32 字符，请配置强随机密钥（见 README）。");
}

const secret = resolveBetterAuthSecret();

function resolveBaseURL(): string {
  const explicit = process.env.BETTER_AUTH_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost && (process.env.VERCEL === "1" || process.env.VERCEL === "true")) {
    const host = vercelHost.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return "http://127.0.0.1:3001";
}

function parseTrustedOriginsFromEnv(): string[] {
  const raw = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,|\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 开发时 Next 常打开 localhost，而默认 baseURL 为 127.0.0.1；Better Auth 按字符串校验 Origin，须同时信任二者。 */
function devLoopbackSiblingOrigins(baseURL: string): string[] {
  if (process.env.NODE_ENV !== "development") {
    return [];
  }
  let u: URL;
  try {
    u = new URL(baseURL);
  } catch {
    return [];
  }
  if (u.protocol !== "http:") {
    return [];
  }
  const host = u.hostname.toLowerCase();
  if (host !== "localhost" && host !== "127.0.0.1") {
    return [];
  }
  const a = u.origin;
  u.hostname = host === "localhost" ? "127.0.0.1" : "localhost";
  const b = u.origin;
  return a === b ? [a] : [a, b];
}

function resolveTrustedOriginsList(baseURL: string): string[] | undefined {
  const merged = new Set<string>([
    ...parseTrustedOriginsFromEnv(),
    ...devLoopbackSiblingOrigins(baseURL),
  ]);
  return merged.size > 0 ? [...merged] : undefined;
}

const baseURL = resolveBaseURL();
const trustedOrigins = resolveTrustedOriginsList(baseURL);

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins,
  database: getPostgresDatabaseOption(),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: (password: string) => Promise.resolve(bcrypt.hashSync(password, 10)),
      verify: ({ hash, password }: { hash: string; password: string }) =>
        bcrypt.compare(password, hash),
    },
  },
  session: {
    expiresIn: 60 * 60,
  },
  plugins: [username(), nextCookies()],
});
