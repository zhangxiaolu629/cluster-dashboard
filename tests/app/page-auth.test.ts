import { describe, expect, it, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const requirePageSession = vi.fn();
  const k8sFetch = vi.fn();
  const listClustersApi = vi.fn();
  const createJSONAPI = vi.fn(() => listClustersApi);
  const Service = vi.fn(() => ({ createJSONAPI }));

  return {
    requirePageSession,
    k8sFetch,
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

import Home from "@/app/page";
import AiChatPage from "@/app/ai-chat/page";
import ClusterDetailPage from "@/app/cluster/[id]/page";
import DeploymentPage from "@/app/cluster/[id]/deployment/page";
import CreateDeploymentPage from "@/app/cluster/[id]/deployment/create/page";
import EventPage from "@/app/cluster/[id]/event/page";
import NamespacePage from "@/app/cluster/[id]/namespace/page";
import ServicePage from "@/app/cluster/[id]/service/page";
import StatefulSetPage from "@/app/cluster/[id]/statefulset/page";
import YamlCreatePage from "@/app/cluster/[id]/yaml-create/page";

const params = () => Promise.resolve({ id: "cluster-1" });
const searchParams = () => Promise.resolve({ kind: "Deployment" });

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePageSession.mockResolvedValue(undefined);
    mocks.k8sFetch.mockResolvedValue({ items: [] });
    mocks.listClustersApi.mockResolvedValue({ Result: { Items: [] } });
  });

  it.each([
    ["home", () => Home()],
    ["ai chat", () => AiChatPage()],
    ["cluster detail", () => ClusterDetailPage({ params: params() })],
    ["deployment list", () => DeploymentPage({ params: params() })],
    ["deployment create", () => CreateDeploymentPage()],
    ["event list", () => EventPage({ params: params() })],
    ["namespace list", () => NamespacePage({ params: params() })],
    ["service list", () => ServicePage({ params: params() })],
    ["statefulset list", () => StatefulSetPage({ params: params() })],
    [
      "yaml create",
      () => YamlCreatePage({ params: params(), searchParams: searchParams() }),
    ],
  ])("%s verifies the real session before rendering", async (_name, renderPage) => {
    await renderPage();

    expect(mocks.requirePageSession).toHaveBeenCalledTimes(1);
  });

  it("does not call Volcengine when the home page session check fails", async () => {
    const authError = new Error("redirect to login");
    mocks.requirePageSession.mockRejectedValueOnce(authError);

    await expect(Home()).rejects.toThrow(authError);

    expect(mocks.Service).not.toHaveBeenCalled();
  });

  it("does not call Kubernetes when a resource page session check fails", async () => {
    const authError = new Error("redirect to login");
    mocks.requirePageSession.mockRejectedValueOnce(authError);

    await expect(DeploymentPage({ params: params() })).rejects.toThrow(authError);

    expect(mocks.k8sFetch).not.toHaveBeenCalled();
  });

  it("checks the session before fetching server-side initial data", async () => {
    await Home();
    expect(mocks.requirePageSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.Service.mock.invocationCallOrder[0]
    );

    vi.clearAllMocks();
    mocks.requirePageSession.mockResolvedValue(undefined);
    mocks.k8sFetch.mockResolvedValue({ items: [] });

    await DeploymentPage({ params: params() });
    expect(mocks.requirePageSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.k8sFetch.mock.invocationCallOrder[0]
    );
  });
});
