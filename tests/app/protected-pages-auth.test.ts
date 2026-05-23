import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const listClustersApi = vi.fn();
  const createJSONAPI = vi.fn(() => listClustersApi);
  const Service = vi.fn(() => ({ createJSONAPI }));

  return {
    requirePageSession: vi.fn(),
    k8sFetch: vi.fn(),
    listClustersApi,
    createJSONAPI,
    Service,
  };
});

vi.mock("@/lib/require-page-session", () => ({
  requirePageSession: mocks.requirePageSession,
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: mocks.k8sFetch,
}));

vi.mock("@volcengine/openapi", () => ({
  Service: mocks.Service,
}));

vi.mock("@/components/cluster/HomePage", () => ({ default: () => null }));
vi.mock("@/components/layout/PageLayout", () => ({ default: () => null }));
vi.mock("@/components/cluster/ClusterSummary", () => ({ default: () => null }));
vi.mock("@/components/cluster/ClusterTabs", () => ({ default: () => null }));
vi.mock("@/components/lists/NamespaceList", () => ({ default: () => null }));
vi.mock("@/components/lists/ServiceList", () => ({ default: () => null }));
vi.mock("@/components/lists/EventList", () => ({ default: () => null }));
vi.mock("@/components/lists/DeploymentList", () => ({ default: () => null }));
vi.mock("@/components/lists/StatefulSetList", () => ({ default: () => null }));
vi.mock("@/components/forms/CreateDeploymentForm", () => ({ default: () => null }));
vi.mock("@/components/forms/YamlCreate", () => ({ default: () => null }));
vi.mock("@/components/ai/AiChatStandaloneView", () => ({ default: () => null }));

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePageSession.mockRejectedValue(new Error("redirected"));
    mocks.k8sFetch.mockResolvedValue({ items: [] });
    mocks.listClustersApi.mockResolvedValue({ Result: { Items: [] } });
  });

  it("does not fetch the Volcengine cluster list before authenticating the home page", async () => {
    const { default: HomePage } = await import("@/app/page");

    await expect(HomePage()).rejects.toThrow("redirected");

    expect(mocks.requirePageSession).toHaveBeenCalledOnce();
    expect(mocks.Service).not.toHaveBeenCalled();
    expect(mocks.listClustersApi).not.toHaveBeenCalled();
  });

  it("does not fetch the Volcengine cluster summary before authenticating the detail page", async () => {
    const { default: ClusterDetailPage } = await import("@/app/cluster/[id]/page");

    await expect(
      ClusterDetailPage({ params: Promise.resolve({ id: "cluster-a" }) })
    ).rejects.toThrow("redirected");

    expect(mocks.requirePageSession).toHaveBeenCalledOnce();
    expect(mocks.Service).not.toHaveBeenCalled();
    expect(mocks.listClustersApi).not.toHaveBeenCalled();
  });

  it.each([
    ["namespace page", () => import("@/app/cluster/[id]/namespace/page")],
    ["service page", () => import("@/app/cluster/[id]/service/page")],
    ["event page", () => import("@/app/cluster/[id]/event/page")],
    ["deployment page", () => import("@/app/cluster/[id]/deployment/page")],
    ["statefulset page", () => import("@/app/cluster/[id]/statefulset/page")],
  ])("does not fetch Kubernetes data before authenticating the %s", async (_name, importPage) => {
    const { default: Page } = await importPage();

    await expect(Page({ params: Promise.resolve({ id: "cluster-a" }) })).rejects.toThrow(
      "redirected"
    );

    expect(mocks.requirePageSession).toHaveBeenCalledOnce();
    expect(mocks.k8sFetch).not.toHaveBeenCalled();
  });
});
