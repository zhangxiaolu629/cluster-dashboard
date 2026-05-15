import { describe, expect, it, vi, beforeEach } from "vitest";

const requirePageSessionMock = vi.hoisted(() => vi.fn());
const listClustersApiMock = vi.hoisted(() => vi.fn());
const serviceMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/require-page-session", () => ({
  requirePageSession: requirePageSessionMock,
}));

vi.mock("@volcengine/openapi", () => ({
  Service: serviceMock,
}));

vi.mock("@/components/cluster/HomePage", () => ({
  default: () => null,
}));

import Home from "@/app/page";

describe("home page auth boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listClustersApiMock.mockResolvedValue({ Result: { Items: [] } });
    serviceMock.mockImplementation(() => ({
      createJSONAPI: () => listClustersApiMock,
    }));
  });

  it("does not call Volcengine when page session verification fails", async () => {
    requirePageSessionMock.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT");

    expect(requirePageSessionMock).toHaveBeenCalledWith("/");
    expect(serviceMock).not.toHaveBeenCalled();
    expect(listClustersApiMock).not.toHaveBeenCalled();
  });

  it("verifies the session before loading initial cluster data", async () => {
    requirePageSessionMock.mockResolvedValue(undefined);

    await Home();

    expect(requirePageSessionMock).toHaveBeenCalledWith("/");
    expect(serviceMock).toHaveBeenCalledOnce();
    expect(requirePageSessionMock.mock.invocationCallOrder[0]).toBeLessThan(
      serviceMock.mock.invocationCallOrder[0]
    );
  });
});
