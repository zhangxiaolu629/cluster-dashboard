import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePageSession: vi.fn(),
  k8sFetch: vi.fn(),
  createJSONAPI: vi.fn(),
  Service: vi.fn(),
}));

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
vi.mock("@/components/cluster/ClusterSummary", () => ({ default: () => null }));
vi.mock("@/components/cluster/ClusterTabs", () => ({ default: () => null }));
vi.mock("@/components/layout/PageLayout", () => ({ default: () => null }));
vi.mock("@/components/lists/DeploymentList", () => ({ default: () => null }));
vi.mock("@/components/lists/StatefulSetList", () => ({ default: () => null }));
vi.mock("@/components/lists/NamespaceList", () => ({ default: () => null }));
vi.mock("@/components/lists/ServiceList", () => ({ default: () => null }));
vi.mock("@/components/lists/EventList", () => ({ default: () => null }));
vi.mock("@/components/forms/YamlCreate", () => ({ default: () => null }));
vi.mock("@/components/forms/CreateDeploymentForm", () => ({ default: () => null }));
vi.mock("@/components/ai/AiChatStandaloneView", () => ({ default: () => null }));

type PageModule = {
  default: (props?: unknown) => unknown;
};

const redirectError = new Error("NEXT_REDIRECT:/login");

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePageSession.mockRejectedValue(redirectError);
    mocks.createJSONAPI.mockReturnValue(vi.fn());
    mocks.Service.mockImplementation(() => ({
      createJSONAPI: mocks.createJSONAPI,
    }));
  });

  it("does not call Volcengine before validating the home page session", async () => {
    const page = (await import("@/app/page")) as PageModule;

    await expect(page.default()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.requirePageSession).toHaveBeenCalledTimes(1);
    expect(mocks.Service).not.toHaveBeenCalled();
  });

  it("does not call Volcengine before validating the cluster detail page session", async () => {
    const page = (await import("@/app/cluster/[id]/page")) as PageModule;

    await expect(
      page.default({ params: Promise.resolve({ id: "cluster-a" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.requirePageSession).toHaveBeenCalledTimes(1);
    expect(mocks.Service).not.toHaveBeenCalled();
  });

  it.each([
    ["deployment", () => import("@/app/cluster/[id]/deployment/page")],
    ["statefulset", () => import("@/app/cluster/[id]/statefulset/page")],
    ["namespace", () => import("@/app/cluster/[id]/namespace/page")],
    ["service", () => import("@/app/cluster/[id]/service/page")],
    ["event", () => import("@/app/cluster/[id]/event/page")],
  ])("does not call Kubernetes before validating the %s page session", async (_name, loadPage) => {
    const page = (await loadPage()) as PageModule;

    await expect(
      page.default({ params: Promise.resolve({ id: "cluster-a" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.requirePageSession).toHaveBeenCalledTimes(1);
    expect(mocks.k8sFetch).not.toHaveBeenCalled();
  });
});
