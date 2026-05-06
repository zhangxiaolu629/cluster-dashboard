import { Kysely, PostgresDialect } from "kysely";
import { Pool, type PoolConfig } from "pg";

let pool: Pool | null = null;
let kysely: Kysely<unknown> | null = null;

/**
 * 连接串优先级（便于 Neon / Vercel 集成）：
 * 1. `AUTH_DATABASE_URL` — 推荐：与业务库 `DATABASE_URL` 分离时专用认证库
 * 2. `POSTGRES_PRISMA_URL` — Neon 文档里常见的 **带 pooler** 的 URL（适合 Serverless）
 * 3. `POSTGRES_URL` — 部分平台注入
 * 4. `DATABASE_URL` — 若全站共用一个 Neon 库时可省略重复配置（注意勿与「非 Postgres」误配混用）
 */
export function resolvePostgresConnectionString(): string | undefined {
  return (
    process.env.AUTH_DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim()
  );
}

/** Better Auth Kysely + Postgres；用于 Vercel 多实例等场景（会话与用户持久在托管库）。 */
export function getPostgresDatabaseOption(): { db: Kysely<unknown>; type: "postgres" } {
  const connectionString = resolvePostgresConnectionString();
  if (!connectionString) {
    throw new Error(
      "Postgres 未配置：请设置 AUTH_DATABASE_URL（推荐），或 POSTGRES_PRISMA_URL / POSTGRES_URL / DATABASE_URL（见 README · Neon）"
    );
  }
  if (!kysely) {
    const config: PoolConfig = { connectionString, max: 10 };
    pool = new Pool(config);
    kysely = new Kysely({ dialect: new PostgresDialect({ pool }) });
  }
  return { db: kysely, type: "postgres" };
}

export function getPostgresPool(): Pool {
  if (!pool) {
    getPostgresDatabaseOption();
  }
  return pool!;
}
