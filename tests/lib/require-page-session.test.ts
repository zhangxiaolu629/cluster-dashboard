import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureAuthDatabaseReady } from "@/lib/auth-bootstrap";
import { auth } from "@/lib/auth";
import { requirePageSession } from "@/lib/require-page-session";

describe("requirePageSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers());
    vi.mocked(ensureAuthDatabaseReady).mockResolvedValue(undefined);
    vi.mocked(redirect).mockImplementation((url) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it("redirects to login when Better Auth has no valid session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(requirePageSession()).rejects.toThrow("redirect:/login");

    expect(ensureAuthDatabaseReady).toHaveBeenCalledTimes(1);
    expect(auth.api.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the session when a user is authenticated", async () => {
    const session = {
      session: { id: "session-1" },
      user: { id: "user-1" },
    };
    vi.mocked(auth.api.getSession).mockResolvedValue(session);

    await expect(requirePageSession()).resolves.toBe(session);

    expect(redirect).not.toHaveBeenCalled();
  });
});
