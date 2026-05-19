import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureAuthDatabaseReadyMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
);

vi.mock("@/lib/auth-bootstrap", () => ({
  ensureAuthDatabaseReady: ensureAuthDatabaseReadyMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ cookie: "better-auth.session_token=fake" })),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { requirePageSession } from "@/lib/require-page-session";

describe("requirePageSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureAuthDatabaseReadyMock.mockResolvedValue(undefined);
  });

  it("redirects to login when Better Auth has no valid session", async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(requirePageSession()).rejects.toThrow("redirect:/login");

    expect(ensureAuthDatabaseReadyMock).toHaveBeenCalledTimes(1);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("allows the page when a valid user session exists", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    await expect(requirePageSession()).resolves.toBeUndefined();

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
