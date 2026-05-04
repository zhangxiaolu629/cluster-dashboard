import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAuthenticated } from "@/lib/require-session";

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

function resolveAiApiKey(): string | undefined {
  const k =
    process.env.AI_API_KEY?.trim() ||
    process.env.ZHIPU_API_KEY?.trim() ||
    process.env.BIGMODEL_API_KEY?.trim() ||
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  return k || undefined;
}

function resolveAiBaseURL(): string | undefined {
  const u = process.env.AI_BASE_URL?.trim();
  return u || undefined;
}

function defaultChatModel(baseURL: string | undefined): string {
  if (!baseURL) return "gpt-4o-mini";
  if (baseURL.includes("bigmodel.cn")) return "glm-4.5-flash";
  if (baseURL.includes("deepseek")) return "deepseek-chat";
  return "gpt-4o-mini";
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
  const unauthorized = await assertAuthenticated();
  if (unauthorized) return unauthorized;
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "请求过于频繁，请稍后重试" }, { status: 429 });
    }

    const payload = chatSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
    }

    const apiKey = resolveAiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "未配置 AI 密钥：请设置 AI_API_KEY、ZHIPU_API_KEY、BIGMODEL_API_KEY、DEEPSEEK_API_KEY 或 OPENAI_API_KEY 之一",
        },
        { status: 503 }
      );
    }

    const baseURL = resolveAiBaseURL();
    const model = process.env.AI_MODEL?.trim() || defaultChatModel(baseURL);
    const systemPrompt =
      "你是一个 Kubernetes 运维助手。回答要简洁、准确，优先给出可执行步骤。请使用 Markdown 输出（适当使用分级标题、有序/无序列表、行内代码与围栏代码块展示命令与 YAML）。";

    const openaiProvider = createOpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });

    const result = streamText({
      model: openaiProvider.chat(model),
      system: systemPrompt,
      prompt: payload.data.message,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI chat route failed:", error);
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试" }, { status: 502 });
  }
}
