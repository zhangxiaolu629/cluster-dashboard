import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePageSession: vi.fn(),
  k8sFetch: vi.fn(),
  serviceCtor: vi.fn(),
  createJSONAPI: vi.fn(),
  listClustersApi: vi.fn(),
}));

vi.mock("@/lib/require-page-session", () => ({
  requirePageSession: mocks.requirePageSession,
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: mocks.k8sFetch,
}));

vi.mock("@volcengine/openapi", () => ({
  Service: mocks.serviceCtor,
}));

vi.mock("@/components/cluster/HomePage", () => ({
  default: () => null,
}));

vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children?: ReactNode }) => children ?? null,
}));

vi.mock("@/components/lists/DeploymentList", () => ({
  default: () => null,
}));

import Home from "@/app/page";
import DeploymentPage from "@/app/cluster/[id]/deployment/page";
import { requirePageSession } from "@/lib/require-page-session";
import { k8sFetch } from "@/lib/k8s";
import { Service } from "@volcengine/openapi";

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePageSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listClustersApi.mockResolvedValue({ Result: { Items: [] } });
    mocks.createJSONAPI.mockReturnValue(mocks.listClustersApi);
    mocks.serviceCtor.mockImplementation(() => ({ createJSONAPI: mocks.createJSONAPI }));
    mocks.k8sFetch.mockResolvedValue({ items: [] });
  });

  it("checks the real page session before fetching Volcengine data on the home page", async () => {
    await Home();

    expect(requirePageSession).toHaveBeenCalledTimes(1);
    expect(Service).toHaveBeenCalledTimes(1);
    expect(mocks.requirePageSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.serviceCtor.mock.invocationCallOrder[0]
    );
  });

  it("does not prefetch home data when the page session is rejected", async () => {
    mocks.requirePageSession.mockRejectedValue(new Error("redirect:/login"));

    await expect(Home()).rejects.toThrow("redirect:/login");

    expect(Service).not.toHaveBeenCalled();
    expect(mocks.listClustersApi).not.toHaveBeenCalled();
  });

  it("does not prefetch Kubernetes resources when the page session is rejected", async () => {
    mocks.requirePageSession.mockRejectedValue(new Error("redirect:/login"));

    await expect(
      DeploymentPage({ params: Promise.resolve({ id: "cluster-1" }) })
    ).rejects.toThrow("redirect:/login");

    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("keeps all protected app pages behind the page session guard", async () => {
    const protectedPages = [
      "src/app/page.tsx",
      "src/app/ai-chat/page.tsx",
      "src/app/cluster/[id]/page.tsx",
      "src/app/cluster/[id]/deployment/page.tsx",
      "src/app/cluster/[id]/deployment/create/page.tsx",
      "src/app/cluster/[id]/event/page.tsx",
      "src/app/cluster/[id]/namespace/page.tsx",
      "src/app/cluster/[id]/service/page.tsx",
      "src/app/cluster/[id]/statefulset/page.tsx",
      "src/app/cluster/[id]/yaml-create/page.tsx",
    ];

    await Promise.all(
      protectedPages.map(async (file) => {
        const source = await readFile(path.join(process.cwd(), file), "utf8");
        expect(source, file).toContain("requirePageSession");
        expect(source, file).toContain('export const dynamic = "force-dynamic"');
      })
    );
  });
});
