import { NextResponse } from "next/server";
import { Service } from "@volcengine/openapi";
import yaml from "js-yaml";
import { z } from "zod";
import { assertAuthenticated } from "@/lib/require-session";

const PLURAL_KIND_MAP: Record<string, string> = {
  Endpoints: "endpoints",
  Ingress: "ingresses",
  NetworkPolicy: "networkpolicies",
  Pod: "pods",
  ReplicaSet: "replicasets",
  Service: "services",
  StatefulSet: "statefulsets",
  ConfigMap: "configmaps",
  Secret: "secrets",
  Deployment: "deployments",
  Job: "jobs",
  CronJob: "cronjobs",
  Namespace: "namespaces",
};

interface KubernetesManifest {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    namespace?: string;
  };
  spec?: {
    selector?: {
      matchLabels?: Record<string, string>;
    };
    template?: {
      metadata?: {
        labels?: Record<string, string>;
      };
    };
  };
}

interface ForwardApiResponse {
  ResponseMetadata?: {
    Error?: unknown;
  };
}

const ALLOWED_KINDS = ["Namespace", "Service", "Deployment", "StatefulSet"] as const;

const requestSchema = z.object({
  yaml: z.string().min(1, "YAML 内容不能为空"),
  namespace: z.string().trim().min(1).optional().default("default"),
  ClusterId: z.string().trim().min(1, "ClusterId 不能为空"),
});

const manifestSchema = z.object({
  apiVersion: z.string().trim().min(1, "apiVersion 不能为空"),
  kind: z.enum(ALLOWED_KINDS, { message: "不支持的资源类型" }),
  metadata: z.object({
    name: z.string().trim().min(1, "metadata.name 不能为空"),
    namespace: z.string().trim().min(1).optional(),
  }),
  spec: z.unknown().optional(),
});

function toResourceName(kind: string): string {
  if (PLURAL_KIND_MAP[kind]) {
    return PLURAL_KIND_MAP[kind];
  }
  const lower = kind.toLowerCase();
  if (lower.endsWith("s")) return `${lower}es`;
  if (lower.endsWith("y")) return `${lower.slice(0, -1)}ies`;
  return `${lower}s`;
}

function buildK8sPath(resource: KubernetesManifest, fallbackNamespace: string): string {
  const apiVersion = String(resource?.apiVersion || "v1");
  const kind = String(resource?.kind || "");
  const namespace = resource?.metadata?.namespace || fallbackNamespace || "default";
  const resourceName = toResourceName(kind);

  const isCoreApi = !apiVersion.includes("/");
  const basePath = isCoreApi ? `/api/${apiVersion}` : `/apis/${apiVersion}`;
  const isNamespaceKind = kind === "Namespace";
  const hasNamespace = !isNamespaceKind && namespace;

  if (hasNamespace) {
    return `${basePath}/namespaces/${namespace}/${resourceName}`;
  }
  return `${basePath}/${resourceName}`;
}

export async function POST(request: Request) {
  const unauthorized = await assertAuthenticated();
  if (unauthorized) return unauthorized;
  try {
    const requestBody = requestSchema.safeParse(await request.json());
    if (!requestBody.success) {
      return NextResponse.json({ error: requestBody.error.flatten() }, { status: 400 });
    }
    const { yaml: yamlContent, namespace, ClusterId } = requestBody.data;
    const parsed = yaml.load(String(yamlContent));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "YAML 内容无效或不是单个资源对象" }, { status: 400 });
    }
    const parsedManifest = manifestSchema.safeParse(parsed);
    if (!parsedManifest.success) {
      return NextResponse.json({ error: parsedManifest.error.flatten() }, { status: 400 });
    }
    const manifest = parsedManifest.data as KubernetesManifest;

    if (manifest.kind === "Deployment" && manifest.spec?.selector?.matchLabels) {
      if (!manifest.spec.template) {
        manifest.spec.template = { metadata: { labels: manifest.spec.selector.matchLabels } };
      } else if (!manifest.spec.template.metadata) {
        manifest.spec.template.metadata = { labels: manifest.spec.selector.matchLabels };
      } else {
        manifest.spec.template.metadata.labels = manifest.spec.selector.matchLabels;
      }
    }

    const service = new Service({
      accessKeyId: process.env.VOLC_ACCESS_KEY_ID!,
      secretKey: process.env.VOLC_SECRET_ACCESS_KEY!,
      region: process.env.REGION,
      serviceName: "vke",
    });

    const forwardApi = service.createJSONAPI("ForwardKubernetesApi", {
      Version: "2022-05-12",
      method: "POST",
    });

    const path = buildK8sPath(manifest, namespace);
    const response = (await forwardApi({
      XVolcMethod: "POST",
      Method: "POST",
      Path: path,
      Body: JSON.stringify(manifest),
      ClusterId,
    })) as ForwardApiResponse;

    if (response.ResponseMetadata?.Error) {
      return NextResponse.json({ error: response.ResponseMetadata.Error }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("API调用失败:", error);
    return NextResponse.json({ error: String(error) || "请求失败" }, { status: 500 });
  }
}
