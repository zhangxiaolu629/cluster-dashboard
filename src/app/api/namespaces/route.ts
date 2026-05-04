import { NextResponse } from "next/server";
import { k8sFetch } from "@/lib/k8s";
import { assertAuthenticated } from "@/lib/require-session";

export async function GET() {
  const unauthorized = await assertAuthenticated();
  if (unauthorized) return unauthorized;
  try {
    const data = await k8sFetch("/api/v1/namespaces");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch namespaces from K8s:", error);
    return NextResponse.json({ error: "Failed to fetch namespaces" }, { status: 500 });
  }
}
