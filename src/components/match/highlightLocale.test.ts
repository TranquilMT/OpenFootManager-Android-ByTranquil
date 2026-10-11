import { expect, it } from "vitest";
import { SUPPORTED_LANGUAGES } from "../../i18n";
it("provides highlight controls and recording explanation in every supported locale", async () => {
  for (const { code } of SUPPORTED_LANGUAGES) {
    const { default: resource } = await import(`../../i18n/locales/${code}.json`);
    for (const key of ["title", "key", "extended", "replay", "recordedZones"])
      expect(resource.match.highlights?.[key], `${code}:${key}`).toEqual(expect.any(String));
  }
});
