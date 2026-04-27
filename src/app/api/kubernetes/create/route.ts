import { NextResponse } from 'next/server';
import { Service } from '@volcengine/openapi';
import yaml from 'js-yaml';

const PLURAL_KIND_MAP: Record<string, string> = {
  Endpoints: 'endpoints',
  Ingress: 'ingresses',
  NetworkPolicy: 'networkpolicies',
  Pod: 'pods',
  ReplicaSet: 'replicasets',
  Service: 'services',
  StatefulSet: 'statefulsets',
  ConfigMap: 'configmaps',
  Secret: 'secrets',
  Deployment: 'deployments',
  Job: 'jobs',
  CronJob: 'cronjobs',
  Namespace: 'namespaces',
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

function toResourceName(kind: string): string {
  if (PLURAL_KIND_MAP[kind]) {
    return PLURAL_KIND_MAP[kind];
  }
  const lower = kind.toLowerCase();
  if (lower.endsWith('s')) return `${lower}es`;
  if (lower.endsWith('y')) return `${lower.slice(0, -1)}ies`;
  return `${lower}s`;
}

function buildK8sPath(resource: KubernetesManifest, fallbackNamespace: string): string {
  const apiVersion = String(resource?.apiVersion || 'v1');
  const kind = String(resource?.kind || '');
  const namespace = resource?.metadata?.namespace || fallbackNamespace || 'default';
  const resourceName = toResourceName(kind);

  const isCoreApi = !apiVersion.includes('/');
  const basePath = isCoreApi ? `/api/${apiVersion}` : `/apis/${apiVersion}`;
  const isNamespaceKind = kind === 'Namespace';
  const hasNamespace = !isNamespaceKind && namespace;

  if (hasNamespace) {
    return `${basePath}/namespaces/${namespace}/${resourceName}`;
  }
  return `${basePath}/${resourceName}`;
}

export async function POST(request: Request) {
  try {
    const { yaml: yamlContent, namespace = 'default', ClusterId } = await request.json();
    const parsed = yaml.load(String(yamlContent));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'YAML 内容无效或不是单个资源对象' }, { status: 400 });
    }
    const manifest = parsed as KubernetesManifest;

    if (manifest.kind === 'Deployment' && manifest.spec?.selector?.matchLabels) {
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
      serviceName: 'vke',
    });

    const forwardApi = service.createJSONAPI('ForwardKubernetesApi', {
      Version: '2022-05-12',
      method: 'POST'
    });

    const path = buildK8sPath(manifest, namespace);
    const response = (await forwardApi({
      XVolcMethod: 'POST',
      Method: 'POST',
      Path: path,
      Body: JSON.stringify(manifest),
      ClusterId
    })) as ForwardApiResponse;

    if (response.ResponseMetadata?.Error) {
      return NextResponse.json({ error: response.ResponseMetadata.Error }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('API调用失败:', error);
    return NextResponse.json({ error: String(error) || '请求失败' }, { status: 500 });
  }
}