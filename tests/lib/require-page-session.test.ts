import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureAuthDatabaseReady: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
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
    mocks.headers.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=stale" }));
  });

  it("redirects to login when Better Auth does not return a user session", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requirePageSession()).rejects.toThrow("redirect:/login");

    expect(mocks.ensureAuthDatabaseReady).toHaveBeenCalledOnce();
    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("allows the page to continue when a real user session exists", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });

    await expect(requirePageSession()).resolves.toBeUndefined();

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
