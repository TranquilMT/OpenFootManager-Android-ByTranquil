import source from "../../../src-tauri/crates/domain/src/manager_progression.rs?raw";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "./achievementCatalog";

// A UI-only catalogue must never promise rewards that differ from the saved
// backend ledger. Keep this guard when adding goals or changing balance.
describe("achievement catalogue parity", () => {
  it("matches the backend IDs and XP awards", () => {
    const catalogue = source.split("pub const ACHIEVEMENTS")[1].split("];", 1)[0];
    const entries = [...catalogue.matchAll(/\("([a-z_]+)",\s*(\d+)\)/g)].map((match) => ({
      id: match[1],
      xp: Number(match[2]),
    }));
    expect(ACHIEVEMENTS).toEqual(entries);
    expect(source).toContain("(1 + self.xp() / 300).min(6)");
    expect(source).toContain("(self.level() - 1) * 2");
    expect(source).toContain("((self.level() - 1) / 2).min(2)");
  });
});
