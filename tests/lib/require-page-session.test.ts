import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureAuthDatabaseReady: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth-bootstrap", () => ({
  ensureAuthDatabaseReady: mocks.ensureAuthDatabaseReady,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { requirePageSession } from "@/lib/require-page-session";

describe("requirePageSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureAuthDatabaseReady.mockResolvedValue(undefined);
    mocks.headers.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=bogus" }));
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`);
    });
  });

  it("redirects to login when no valid session exists", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requirePageSession("/cluster/demo/deployment")).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fcluster%2Fdemo%2Fdeployment"
    );

    expect(mocks.ensureAuthDatabaseReady).toHaveBeenCalledOnce();
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fcluster%2Fdemo%2Fdeployment"
    );
  });

  it("returns the session when authentication succeeds", async () => {
    const session = { user: { id: "user-1", name: "Admin" } };
    mocks.getSession.mockResolvedValue(session);

    await expect(requirePageSession("/")).resolves.toBe(session);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
