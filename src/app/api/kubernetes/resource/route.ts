import { NextRequest, NextResponse } from "next/server";
import yaml from "js-yaml";
import { z } from "zod";
import { k8sFetch } from "@/lib/k8s";
import { assertAuthenticated } from "@/lib/require-session";

const ALLOWED_KINDS = ["Namespace", "Service", "Deployment", "StatefulSet"] as const;
type AllowedKind = (typeof ALLOWED_KINDS)[number];

const RESOURCE_META: Record<
  AllowedKind,
  {
    apiVersion: string;
    plural: string;
    namespaced: boolean;
  }
> = {
  Namespace: { apiVersion: "v1", plural: "namespaces", namespaced: false },
  Service: { apiVersion: "v1", plural: "services", namespaced: true },
  Deployment: { apiVersion: "apps/v1", plural: "deployments", namespaced: true },
  StatefulSet: { apiVersion: "apps/v1", plural: "statefulsets", namespaced: true },
};

const querySchema = z.object({
  kind: z.enum(ALLOWED_KINDS),
  name: z.string().trim().min(1, "name 不能为空"),
  namespace: z.string().trim().optional(),
});

const updateSchema = z.object({
  yaml: z.string().min(1, "yaml 不能为空"),
  kind: z.enum(ALLOWED_KINDS),
  name: z.string().trim().min(1, "name 不能为空"),
  namespace: z.string().trim().optional(),
});

function buildResourcePath(kind: AllowedKind, name: string, namespace?: string): string {
  const meta = RESOURCE_META[kind];
  const base = meta.apiVersion.includes("/")
    ? `/apis/${meta.apiVersion}`
    : `/api/${meta.apiVersion}`;
  const encodedName = encodeURIComponent(name);

  if (!meta.namespaced) {
    return `${base}/${meta.plural}/${encodedName}`;
  }
  return `${base}/namespaces/${encodeURIComponent(namespace!)}/${meta.plural}/${encodedName}`;
}

function validateResourceTarget(kind: AllowedKind, namespace?: string): string | undefined {
  const meta = RESOURCE_META[kind];
  if (meta.namespaced && !namespace) {
    return `${kind} 必须指定 namespace`;
  }
  if (!meta.namespaced && namespace) {
    return `${kind} 不支持 namespace`;
  }
  return undefined;
}

function parseQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return querySchema.safeParse({
    kind: searchParams.get("kind"),
    name: searchParams.get("name"),
    namespace: searchParams.get("namespace") ?? undefined,
  });
}

function formatK8sError(error: unknown) {
  console.error("Kubernetes resource operation failed:", error);
  return NextResponse.json({ error: "Kubernetes 资源操作失败" }, { status: 502 });
}

export async function GET(request: NextRequest) {
  const unauthorized = await assertAuthenticated();
  if (unauthorized) return unauthorized;
  const parsed = parseQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, name, namespace } = parsed.data;
  const targetError = validateResourceTarget(kind, namespace);
  if (targetError) {
    return NextResponse.json({ error: targetError }, { status: 400 });
  }

  const path = buildResourcePath(kind, name, namespace);
  try {
    const data = await k8sFetch(path);
    const yamlText = yaml.dump(data, { noRefs: true, lineWidth: -1 });
    return NextResponse.json({ yaml: yamlText });
  } catch (error) {
    return formatK8sError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await assertAuthenticated();
  if (unauthorized) return unauthorized;
  const parsed = parseQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, name, namespace } = parsed.data;
  const targetError = validateResourceTarget(kind, namespace);
  if (targetError) {
    return NextResponse.json({ error: targetError }, { status: 400 });
  }

  const path = buildResourcePath(kind, name, namespace);
  try {
    const data = await k8sFetch(path, { method: "DELETE" });
    return NextResponse.json(data ?? { ok: true });
  } catch (error) {
    return formatK8sError(error);
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = await assertAuthenticated();
  if (unauthorized) return unauthorized;
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON" }, { status: 400 });
  }

  const payload = updateSchema.safeParse(requestBody);
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const { yaml: yamlText, kind, name, namespace } = payload.data;
  const targetError = validateResourceTarget(kind, namespace);
  if (targetError) {
    return NextResponse.json({ error: targetError }, { status: 400 });
  }

  let parsedYaml: unknown;
  try {
    parsedYaml = yaml.load(yamlText);
  } catch {
    return NextResponse.json({ error: "yaml 内容无效" }, { status: 400 });
  }
  if (!parsedYaml || typeof parsedYaml !== "object" || Array.isArray(parsedYaml)) {
    return NextResponse.json({ error: "yaml 内容无效" }, { status: 400 });
  }

  const manifest = parsedYaml as {
    metadata?: Record<string, unknown>;
    kind?: string;
  };
  if (manifest.kind !== kind) {
    return NextResponse.json({ error: "yaml kind 与请求 kind 不一致" }, { status: 400 });
  }
  const manifestName =
    typeof manifest.metadata?.name === "string" ? manifest.metadata.name.trim() : undefined;
  const manifestNamespace =
    typeof manifest.metadata?.namespace === "string"
      ? manifest.metadata.namespace.trim()
      : undefined;
  if (!manifestName) {
    return NextResponse.json({ error: "metadata.name 不能为空" }, { status: 400 });
  }
  if (manifestName !== name) {
    return NextResponse.json({ error: "yaml metadata.name 与请求资源不一致" }, { status: 400 });
  }
  if (RESOURCE_META[kind].namespaced) {
    if (!manifestNamespace) {
      return NextResponse.json({ error: "metadata.namespace 不能为空" }, { status: 400 });
    }
    if (manifestNamespace !== namespace) {
      return NextResponse.json(
        { error: "yaml metadata.namespace 与请求资源不一致" },
        { status: 400 }
      );
    }
  } else if (manifestNamespace) {
    return NextResponse.json(
      { error: "Namespace 资源不能设置 metadata.namespace" },
      { status: 400 }
    );
  }

  const path = buildResourcePath(kind, name, namespace);
  try {
    const data = await k8sFetch(path, {
      method: "PUT",
      body: JSON.stringify(parsedYaml),
    });
    return NextResponse.json(data ?? { ok: true });
  } catch (error) {
    return formatK8sError(error);
  }
}
