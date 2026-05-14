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
    mocks.headers.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=fake" }));
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("redirects to login when the cookie does not resolve to a real session", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requirePageSession("/cluster/demo")).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fcluster%2Fdemo"
    );

    expect(mocks.ensureAuthDatabaseReady).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    expect(mocks.redirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fcluster%2Fdemo");
  });

  it("allows rendering when Better Auth returns a user session", async () => {
    const session = { user: { id: "u1", name: "admin" } };
    mocks.getSession.mockResolvedValue(session);

    await expect(requirePageSession("/")).resolves.toBe(session);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("does not echo unsafe callback paths into the login redirect", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requirePageSession("//evil.example")).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2F"
    );

    expect(mocks.redirect).toHaveBeenCalledWith("/login?callbackUrl=%2F");
  });
});
