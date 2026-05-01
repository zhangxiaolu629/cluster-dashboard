import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const chatSchema = z.object({
  message: z.string().trim().min(1, "message 不能为空").max(2000, "message 超出最大长度"),
});

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

type RateLimitStore = Map<string, number[]>;

function getRateLimitStore(): RateLimitStore {
  const globalRef = globalThis as typeof globalThis & {
    __aiChatRateLimitStore?: RateLimitStore;
  };
  if (!globalRef.__aiChatRateLimitStore) {
    globalRef.__aiChatRateLimitStore = new Map();
  }
  return globalRef.__aiChatRateLimitStore;
}

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const store = getRateLimitStore();
  const records = store.get(ip) ?? [];
  const validRecords = records.filter((ts) => now - ts < WINDOW_MS);
  if (validRecords.length >= MAX_REQUESTS_PER_WINDOW) {
    store.set(ip, validRecords);
    return true;
  }
  validRecords.push(now);
  store.set(ip, validRecords);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后重试" }, { status: 429 });
    }

    const payload = chatSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
    }

    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const systemPrompt = "你是一个 Kubernetes 运维助手。回答要简洁、准确，优先给出可执行步骤。";

    const result = streamText({
      model: openai(model),
      system: systemPrompt,
      prompt: payload.data.message,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI chat route failed:", error);
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试" }, { status: 502 });
  }
}
