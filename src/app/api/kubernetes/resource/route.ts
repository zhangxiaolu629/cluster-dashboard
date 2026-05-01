import { NextRequest, NextResponse } from "next/server";
import yaml from "js-yaml";
import { z } from "zod";
import { k8sFetch } from "@/lib/k8s";

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
});

function buildResourcePath(kind: AllowedKind, name: string, namespace?: string): string {
  const meta = RESOURCE_META[kind];
  const base = meta.apiVersion.includes("/")
    ? `/apis/${meta.apiVersion}`
    : `/api/${meta.apiVersion}`;

  if (!meta.namespaced) {
    return `${base}/${meta.plural}/${name}`;
  }
  const ns = namespace || "default";
  return `${base}/namespaces/${ns}/${meta.plural}/${name}`;
}

function parseQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return querySchema.safeParse({
    kind: searchParams.get("kind"),
    name: searchParams.get("name"),
    namespace: searchParams.get("namespace") ?? undefined,
  });
}

export async function GET(request: NextRequest) {
  const parsed = parseQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, name, namespace } = parsed.data;
  const path = buildResourcePath(kind, name, namespace);
  const data = await k8sFetch(path);
  const yamlText = yaml.dump(data, { noRefs: true, lineWidth: -1 });
  return NextResponse.json({ yaml: yamlText });
}

export async function DELETE(request: NextRequest) {
  const parsed = parseQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { kind, name, namespace } = parsed.data;
  const path = buildResourcePath(kind, name, namespace);
  const data = await k8sFetch(path, { method: "DELETE" });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const { yaml: yamlText, kind } = payload.data;
  const parsedYaml = yaml.load(yamlText);
  if (!parsedYaml || typeof parsedYaml !== "object" || Array.isArray(parsedYaml)) {
    return NextResponse.json({ error: "yaml 内容无效" }, { status: 400 });
  }

  const manifest = parsedYaml as {
    metadata?: { name?: string; namespace?: string };
    kind?: string;
  };
  if (manifest.kind !== kind) {
    return NextResponse.json({ error: "yaml kind 与请求 kind 不一致" }, { status: 400 });
  }
  if (!manifest.metadata?.name) {
    return NextResponse.json({ error: "metadata.name 不能为空" }, { status: 400 });
  }

  const path = buildResourcePath(kind, manifest.metadata.name, manifest.metadata.namespace);
  const data = await k8sFetch(path, {
    method: "PUT",
    body: JSON.stringify(parsedYaml),
  });
  return NextResponse.json(data);
}
