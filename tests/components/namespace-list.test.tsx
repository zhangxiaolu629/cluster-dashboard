import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NamespaceList from "@/components/lists/NamespaceList";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("NamespaceList", () => {
  it("renders initial data and filters by search text", () => {
    render(
      <NamespaceList
        clusterId="test-cluster"
        initialLoaded
        initialData={[
          {
            key: "ns-1",
            name: "default",
            status: "Active",
            creationTimestamp: "2026-04-27T00:00:00.000Z",
          },
          {
            key: "ns-2",
            name: "kube-system",
            status: "Active",
            creationTimestamp: "2026-04-27T00:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("kube-system")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("搜索命名空间..."), {
      target: { value: "kube" },
    });

    expect(screen.queryByText("default")).not.toBeInTheDocument();
    expect(screen.getByText("kube-system")).toBeInTheDocument();
  });
});
