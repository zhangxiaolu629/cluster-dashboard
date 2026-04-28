import { NextResponse } from "next/server";
import { k8sFetch } from "@/lib/k8s";

export async function GET() {
  try {
    const data = await k8sFetch("/api/v1/nodes");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch nodes from K8s:", error);
    return NextResponse.json({ error: "Failed to fetch nodes" }, { status: 500 });
  }
}
