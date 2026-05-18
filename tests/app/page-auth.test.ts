import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const requirePageSessionMock = vi.hoisted(() => vi.fn<() => Promise<void>>());
const k8sFetchMock = vi.hoisted(() => vi.fn());
const serviceApiMock = vi.hoisted(() => vi.fn());
const serviceCtorMock = vi.hoisted(() =>
  vi.fn(() => ({
    createJSONAPI: vi.fn(() => serviceApiMock),
  }))
);

vi.mock("@/lib/require-page-session", () => ({
  requirePageSession: requirePageSessionMock,
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: k8sFetchMock,
}));

vi.mock("@volcengine/openapi", () => ({
  Service: serviceCtorMock,
}));

vi.mock("antd", () => ({
  Card: ({ children }: { children?: ReactNode }) => children ?? null,
  Layout: ({ children }: { children?: ReactNode }) => children ?? null,
}));

vi.mock("@/components/cluster/HomePage", () => ({
  default: () => null,
}));

vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children?: ReactNode }) => children ?? null,
}));

vi.mock("@/components/cluster/ClusterSummary", () => ({
  default: () => null,
}));

vi.mock("@/components/cluster/ClusterTabs", () => ({
  default: () => null,
}));

vi.mock("@/components/lists/NamespaceList", () => ({
  default: () => null,
}));

vi.mock("@/components/lists/DeploymentList", () => ({
  default: () => null,
}));

vi.mock("@/components/lists/StatefulSetList", () => ({
  default: () => null,
}));

vi.mock("@/components/lists/ServiceList", () => ({
  default: () => null,
}));

vi.mock("@/components/lists/EventList", () => ({
  default: () => null,
}));

vi.mock("@/components/forms/CreateDeploymentForm", () => ({
  default: () => null,
}));

vi.mock("@/components/forms/YamlCreate", () => ({
  default: () => null,
}));

vi.mock("@/components/ai/AiChatStandaloneView", () => ({
  default: () => null,
}));

vi.mock("@/lib/k8sYamlTemplates", () => ({
  getInitialYamlForKind: vi.fn(() => "apiVersion: v1\nkind: ConfigMap\n"),
}));

async function expectRedirectStopsPrivateFetch(renderPage: () => Promise<unknown>) {
  const redirectError = new Error("NEXT_REDIRECT");
  requirePageSessionMock.mockRejectedValueOnce(redirectError);

  await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT");
  expect(serviceCtorMock).not.toHaveBeenCalled();
  expect(serviceApiMock).not.toHaveBeenCalled();
  expect(k8sFetchMock).not.toHaveBeenCalled();
}

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePageSessionMock.mockResolvedValue(undefined);
    k8sFetchMock.mockResolvedValue({ items: [] });
    serviceApiMock.mockResolvedValue({ Result: { Items: [] } });
  });

  it("blocks the home page before calling Volcengine", async () => {
    const { default: HomePage } = await import("@/app/page");

    await expectRedirectStopsPrivateFetch(() => HomePage());
  });

  it("blocks the cluster detail page before calling Volcengine", async () => {
    const { default: ClusterDetailPage } = await import("@/app/cluster/[id]/page");

    await expectRedirectStopsPrivateFetch(() =>
      ClusterDetailPage({ params: Promise.resolve({ id: "cluster-1" }) })
    );
  });

  it.each([
    ["namespace page", () => import("@/app/cluster/[id]/namespace/page"), ["/api/v1/namespaces"]],
    [
      "deployment page",
      () => import("@/app/cluster/[id]/deployment/page"),
      ["/apis/apps/v1/deployments", "/api/v1/namespaces"],
    ],
    [
      "statefulset page",
      () => import("@/app/cluster/[id]/statefulset/page"),
      ["/apis/apps/v1/statefulsets", "/api/v1/namespaces"],
    ],
    ["service page", () => import("@/app/cluster/[id]/service/page"), ["/api/v1/services"]],
    ["event page", () => import("@/app/cluster/[id]/event/page"), ["/api/v1/events"]],
  ])("blocks the %s before calling K8s", async (_name, loadPage) => {
    const { default: Page } = await loadPage();

    await expectRedirectStopsPrivateFetch(() =>
      Page({ params: Promise.resolve({ id: "cluster-1" }) })
    );
  });
});
