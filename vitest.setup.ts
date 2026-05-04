import "@testing-library/jest-dom/vitest";

/** 防止单测间接加载 `src/lib/auth.ts` 时因缺少密钥抛错 */
process.env.BETTER_AUTH_SECRET ??= "vitest-placeholder-better-auth-secret-32chars";
process.env.BETTER_AUTH_URL ??= "http://127.0.0.1:3001";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
