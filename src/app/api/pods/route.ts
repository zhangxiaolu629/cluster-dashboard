import { NextRequest, NextResponse } from "next/server";
import { k8sFetch } from "@/lib/k8s";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace");

    const path = namespace
      ? `/api/v1/namespaces/${namespace}/pods`
      : "/api/v1/pods";

    const data = await k8sFetch(path);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch pods from K8s:", error);
    return NextResponse.json(
      { error: "Failed to fetch pods" },
      { status: 500 }
    );
  }
}
