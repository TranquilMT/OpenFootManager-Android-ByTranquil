import { expect, it } from "vitest";
import { RELEASE_FEATURES } from "./ReleaseNotes";
const locales = import.meta.glob<{ default: Record<string, unknown> }>(
  "../../i18n/locales/*.json",
  { eager: true },
);
it("resolves every current release feature title and description in every locale", () => {
  for (const [locale, module] of Object.entries(locales)) {
    for (const feature of RELEASE_FEATURES) {
      for (const key of [feature.key, feature.title]) {
        const value = key
          .split(".")
          .reduce<unknown>(
            (node, part) =>
              node && typeof node === "object"
                ? (node as Record<string, unknown>)[part]
                : undefined,
            module.default,
          );
        expect(typeof value, `${locale}: ${key}`).toBe("string");
      }
    }
  }
});
