import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/require-session", () => ({
  assertAuthenticated: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/k8s", () => ({
  k8sFetch: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/kubernetes/resource/route";
import { k8sFetch } from "@/lib/k8s";

describe("/api/kubernetes/resource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects namespaced resources when namespace is missing", async () => {
    const request = new Request(
      "http://localhost:3001/api/kubernetes/resource?kind=Deployment&name=web"
    ) as Parameters<typeof GET>[0];

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Deployment 必须指定 namespace" });
    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("deletes the exact namespaced resource from the request target", async () => {
    vi.mocked(k8sFetch).mockResolvedValue({ status: "Success" });
    const request = new Request(
      "http://localhost:3001/api/kubernetes/resource?kind=Deployment&name=web&namespace=prod"
    ) as Parameters<typeof DELETE>[0];

    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(k8sFetch).toHaveBeenCalledWith("/apis/apps/v1/namespaces/prod/deployments/web", {
      method: "DELETE",
    });
  });

  it("rejects YAML updates that drift to another namespace", async () => {
    const request = new Request("http://localhost:3001/api/kubernetes/resource", {
      method: "PUT",
      body: JSON.stringify({
        kind: "Deployment",
        name: "web",
        namespace: "prod",
        yaml: ["kind: Deployment", "metadata:", "  name: web", "  namespace: staging"].join("\n"),
      }),
    }) as Parameters<typeof PUT>[0];

    const response = await PUT(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "yaml metadata.namespace 与请求资源不一致",
    });
    expect(k8sFetch).not.toHaveBeenCalled();
  });

  it("updates the exact resource identified by the request target", async () => {
    vi.mocked(k8sFetch).mockResolvedValue({ metadata: { name: "web", namespace: "prod" } });
    const request = new Request("http://localhost:3001/api/kubernetes/resource", {
      method: "PUT",
      body: JSON.stringify({
        kind: "Deployment",
        name: "web",
        namespace: "prod",
        yaml: [
          "kind: Deployment",
          "metadata:",
          "  name: web",
          "  namespace: prod",
          "spec:",
          "  replicas: 2",
        ].join("\n"),
      }),
    }) as Parameters<typeof PUT>[0];

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(k8sFetch).toHaveBeenCalledWith("/apis/apps/v1/namespaces/prod/deployments/web", {
      method: "PUT",
      body: JSON.stringify({
        kind: "Deployment",
        metadata: { name: "web", namespace: "prod" },
        spec: { replicas: 2 },
      }),
    });
  });
});
