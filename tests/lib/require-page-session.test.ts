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
    mocks.headers.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=test" }));
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("returns a valid server-side session", async () => {
    const session = { user: { id: "user-1" } };
    mocks.getSession.mockResolvedValue(session);

    await expect(requirePageSession()).resolves.toBe(session);

    expect(mocks.ensureAuthDatabaseReady).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects to login when the server-side session is invalid", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requirePageSession()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
