import { NextRequest, NextResponse } from "next/server";
import { k8sFetch } from "@/lib/k8s";
import { assertAuthenticated } from "@/lib/require-session";
import type { K8sEventList } from "@/types/k8s";

export async function GET(
  request: NextRequest
): Promise<NextResponse<K8sEventList | { error: string }>> {
  const unauthorized = await assertAuthenticated();
  if (unauthorized) {
    return unauthorized as NextResponse<K8sEventList | { error: string }>;
  }
  try {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace");

    const path = namespace ? `/api/v1/namespaces/${namespace}/events` : "/api/v1/events";

    const data = await k8sFetch(path);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch events from K8s:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
