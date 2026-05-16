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

vi.mock("@volcengine/openapi", () => ({
  Service: mocks.Service,
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: mocks.k8sFetch,
}));

vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children?: unknown }) => children ?? null,
}));

vi.mock("@/components/lists/DeploymentList", () => ({
  default: () => null,
}));

import Home from "@/app/page";
import DeploymentPage from "@/app/cluster/[id]/deployment/page";

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePageSession.mockResolvedValue(undefined);
    mocks.listClustersApi.mockResolvedValue({ Result: { Items: [] } });
    mocks.k8sFetch.mockResolvedValue({ items: [] });
  });

  it("does not fetch Volcengine clusters when page session validation fails", async () => {
    mocks.requirePageSession.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.requirePageSession).toHaveBeenCalledWith("/");
    expect(mocks.Service).not.toHaveBeenCalled();
    expect(mocks.listClustersApi).not.toHaveBeenCalled();
  });

  it("does not fetch Kubernetes resources when page session validation fails", async () => {
    mocks.requirePageSession.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(
      DeploymentPage({ params: Promise.resolve({ id: "cluster-1" }) })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.requirePageSession).toHaveBeenCalledWith("/cluster/cluster-1/deployment");
    expect(mocks.k8sFetch).not.toHaveBeenCalled();
  });

  it("fetches initial page data after page session validation passes", async () => {
    await Home();

    expect(mocks.requirePageSession).toHaveBeenCalledWith("/");
    expect(mocks.Service).toHaveBeenCalledTimes(1);
    expect(mocks.listClustersApi).toHaveBeenCalledTimes(1);
    expect(mocks.requirePageSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.Service.mock.invocationCallOrder[0]
    );
  });
});
