import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
it("shows only version and build, regardless of release channel", async () => {
  vi.stubGlobal("__APP_VERSION__", "0.6.6-nightly");
  vi.stubGlobal("__APP_CHANNEL__", "nightly");
  vi.stubGlobal("__APP_BUILD_NUMBER__", "350");
  const { formatAppVersion } = await import("./appVersion");
  expect(formatAppVersion()).toBe("v0.6.6 · Build#350");
});
it("omits an unavailable build number without showing update names", async () => {
  vi.stubGlobal("__APP_VERSION__", "0.6.6");
  vi.stubGlobal("__APP_BUILD_NUMBER__", "");
  const { formatAppVersion } = await import("./appVersion");
  expect(formatAppVersion()).toBe("v0.6.6");
});
