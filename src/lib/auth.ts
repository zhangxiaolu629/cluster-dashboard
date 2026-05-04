import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { getAuthDatabase } from "@/lib/auth-sqlite";

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

const baseURL = process.env.BETTER_AUTH_URL?.trim() || "http://127.0.0.1:3001";

export const auth = betterAuth({
  secret,
  baseURL,
  database: getAuthDatabase(),
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
