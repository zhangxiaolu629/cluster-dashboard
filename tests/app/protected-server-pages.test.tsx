import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/require-session", () => ({
  requireAuthenticatedPage: vi.fn(),
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: vi.fn(),
}));

vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/lists/DeploymentList", () => ({
  default: () => <div>DeploymentList</div>,
}));

import DeploymentPage from "@/app/cluster/[id]/deployment/page";
import { k8sFetch } from "@/lib/k8s";
import { requireAuthenticatedPage } from "@/lib/require-session";

describe("protected server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not prefetch Kubernetes data when page session validation fails", async () => {
    vi.mocked(requireAuthenticatedPage).mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(
      DeploymentPage({ params: Promise.resolve({ id: "cluster-1" }) })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("prefetches Kubernetes data after page session validation succeeds", async () => {
    vi.mocked(requireAuthenticatedPage).mockResolvedValueOnce(undefined);
    vi.mocked(k8sFetch)
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [{ metadata: { name: "default" } }] });

    await DeploymentPage({ params: Promise.resolve({ id: "cluster-1" }) });

    expect(requireAuthenticatedPage).toHaveBeenCalledTimes(1);
    expect(k8sFetch).toHaveBeenCalledWith("/apis/apps/v1/deployments");
    expect(k8sFetch).toHaveBeenCalledWith("/api/v1/namespaces");
  });
});
