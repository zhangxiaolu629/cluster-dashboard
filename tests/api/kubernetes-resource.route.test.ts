import { describe, expect, it, vi, beforeEach } from "vitest";
import { DELETE, GET, PUT } from "@/app/api/kubernetes/resource/route";
import { k8sFetch } from "@/lib/k8s";

vi.mock("@/lib/k8s", () => ({
  k8sFetch: vi.fn(),
}));

describe("/api/kubernetes/resource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects path traversal in query resource names before calling Kubernetes", async () => {
    const request = new Request(
      "http://localhost:3001/api/kubernetes/resource?kind=Service&name=..%2Fpods%2Fdemo&namespace=default"
    ) as Parameters<typeof DELETE>[0];

    const response = await DELETE(request);

    expect(response.status).toBe(400);
    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("rejects path traversal in query namespaces before calling Kubernetes", async () => {
    const request = new Request(
      "http://localhost:3001/api/kubernetes/resource?kind=Deployment&name=demo&namespace=default%2F..%2Fsecrets"
    ) as Parameters<typeof GET>[0];

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("rejects path traversal in YAML metadata before update", async () => {
    const request = new Request("http://localhost:3001/api/kubernetes/resource", {
      method: "PUT",
      body: JSON.stringify({
        kind: "Deployment",
        yaml: [
          "apiVersion: apps/v1",
          "kind: Deployment",
          "metadata:",
          "  name: ../secrets/demo",
          "  namespace: default",
        ].join("\n"),
      }),
    }) as Parameters<typeof PUT>[0];

    const response = await PUT(request);

    expect(response.status).toBe(400);
    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("uses the expected Kubernetes path for a valid namespaced update", async () => {
    vi.mocked(k8sFetch).mockResolvedValue({ metadata: { name: "demo" } });
    const request = new Request("http://localhost:3001/api/kubernetes/resource", {
      method: "PUT",
      body: JSON.stringify({
        kind: "Deployment",
        yaml: [
          "apiVersion: apps/v1",
          "kind: Deployment",
          "metadata:",
          "  name: demo",
          "  namespace: prod",
        ].join("\n"),
      }),
    }) as Parameters<typeof PUT>[0];

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(k8sFetch).toHaveBeenCalledWith("/apis/apps/v1/namespaces/prod/deployments/demo", {
      method: "PUT",
      body: expect.any(String),
    });
  });
});
