import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePageSessionMock = vi.hoisted(() => vi.fn());
const serviceCtorMock = vi.hoisted(() => vi.fn());
const k8sFetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/require-page-session", () => ({
  requirePageSession: requirePageSessionMock,
}));

vi.mock("@volcengine/openapi", () => ({
  Service: serviceCtorMock,
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: k8sFetchMock,
}));

vi.mock("@/components/cluster/HomePage", () => ({
  default: vi.fn(() => null),
}));

vi.mock("@/components/layout/PageLayout", () => ({
  default: vi.fn(() => null),
}));

vi.mock("@/components/lists/DeploymentList", () => ({
  default: vi.fn(() => null),
}));

import Home from "@/app/page";
import DeploymentPage from "@/app/cluster/[id]/deployment/page";

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch Volcengine clusters when page session is invalid", async () => {
    requirePageSessionMock.mockRejectedValue(new Error("redirect:/login"));

    await expect(Home()).rejects.toThrow("redirect:/login");

    expect(requirePageSessionMock).toHaveBeenCalledTimes(1);
    expect(serviceCtorMock).not.toHaveBeenCalled();
  });

  it("does not fetch Kubernetes resources when page session is invalid", async () => {
    requirePageSessionMock.mockRejectedValue(new Error("redirect:/login"));

    await expect(
      DeploymentPage({ params: Promise.resolve({ id: "cluster-a" }) })
    ).rejects.toThrow("redirect:/login");

    expect(requirePageSessionMock).toHaveBeenCalledTimes(1);
    expect(k8sFetchMock).not.toHaveBeenCalled();
  });
});
