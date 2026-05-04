import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";

export async function GET(request: NextRequest) {
  await ensureAuthDatabaseReady();
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  await ensureAuthDatabaseReady();
  return auth.handler(request);
}
