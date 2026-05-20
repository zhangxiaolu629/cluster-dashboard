import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = new Headers({ cookie: "better-auth.session_token=token" });

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => mockHeaders),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/auth-bootstrap", () => ({
  ensureAuthDatabaseReady: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { redirect } from "next/navigation";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";
import { auth } from "@/lib/auth";
import { requirePageSession } from "@/lib/require-page-session";

describe("requirePageSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows server pages to render when a real session exists", async () => {
    const session = { user: { id: "user-1" } };
    vi.mocked(auth.api.getSession).mockResolvedValue(session);

    await expect(requirePageSession("/cluster/cluster-1")).resolves.toBe(session);

    expect(ensureAuthDatabaseReady).toHaveBeenCalledTimes(1);
    expect(auth.api.getSession).toHaveBeenCalledWith({ headers: mockHeaders });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to login when the cookie does not resolve to a real session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(requirePageSession("/cluster/cluster-1/deployment")).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fcluster%2Fcluster-1%2Fdeployment"
    );

    expect(redirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fcluster%2Fcluster-1%2Fdeployment");
  });
});
