/** Android nightly build identity shown to players. */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_DATE = __APP_BUILD_DATE__;

export function isNightlyBuild(): boolean {
  return __APP_CHANNEL__ === "nightly";
}

/**
 * CI exposes the GitHub Actions run number to Vite where available. During
 * local development we deliberately fall back to the app version rather than
 * hiding the identity completely.
 */
declare const __APP_BUILD_NUMBER__: string | undefined;

function buildNumber(): string | null {
  try {
    const value =
      typeof __APP_BUILD_NUMBER__ === "undefined" ? "" : String(__APP_BUILD_NUMBER__).trim();
    return /^\d+$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** Player-facing identity. Android nightlies use the CI build number. */
export function formatAppVersion(): string {
  const number = buildNumber();
  const releaseVersion = APP_VERSION.replace(/-nightly$/, "");
  return number ? `v${releaseVersion} · Build#${number}` : `v${releaseVersion}`;
}
