import { describe, it, expect } from "vitest";
import { buildFormationSlots } from "./FormationPitch";
import type { EnginePlayerData } from "./types";
const player = (id: string, position: string) => ({ id, name: id, position }) as EnginePlayerData;
describe("formation fallback coverage", () => {
  it("retains specialised positions when a dismissal breaks slot alignment", () => {
    const players = [
      player("gk", "Goalkeeper"),
      player("cb", "CenterBack"),
      player("dm", "DefensiveMidfielder"),
      player("st", "Striker"),
    ];
    const slots = buildFormationSlots("4-4-2", players, ["cb"]);
    expect(slots.map((slot) => slot.player.id).sort()).toEqual(["dm", "gk", "st"]);
    expect(slots.every((slot) => Number.isFinite(slot.x) && Number.isFinite(slot.y))).toBe(true);
  });
});
