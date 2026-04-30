import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/deployments/route";
import { k8sFetch } from "@/lib/k8s";

vi.mock("@/lib/k8s", () => ({
  k8sFetch: vi.fn(),
}));

describe("GET /api/deployments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses cluster-wide deployments path when namespace not provided", async () => {
    vi.mocked(k8sFetch).mockResolvedValue({ items: [] });
    const request = new Request("http://localhost:3001/api/deployments") as Parameters<
      typeof GET
    >[0];

    const response = await GET(request);
    const body = await response.json();

    expect(k8sFetch).toHaveBeenCalledWith("/apis/apps/v1/deployments");
    expect(response.status).toBe(200);
    expect(body).toEqual({ items: [] });
  });

  it("uses namespaced deployments path when namespace is provided", async () => {
    vi.mocked(k8sFetch).mockResolvedValue({ items: [{ metadata: { name: "demo" } }] });
    const request = new Request(
      "http://localhost:3001/api/deployments?namespace=default"
    ) as Parameters<typeof GET>[0];

    const response = await GET(request);

    expect(k8sFetch).toHaveBeenCalledWith("/apis/apps/v1/namespaces/default/deployments");
    expect(response.status).toBe(200);
  });
});
