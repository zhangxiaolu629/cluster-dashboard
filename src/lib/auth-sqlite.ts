import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

let db: Database.Database | null = null;

export function getAuthDatabase(): Database.Database {
  if (db) {
    return db;
  }
  const filePath =
    process.env.AUTH_DATABASE_PATH?.trim() || join(process.cwd(), ".data", "auth.sqlite");
  mkdirSync(dirname(filePath), { recursive: true });
  db = new Database(filePath);
  return db;
}
