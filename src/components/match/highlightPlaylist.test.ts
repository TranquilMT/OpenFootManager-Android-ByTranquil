import { expect, it } from "vitest";
import { playlistNeighbour } from "./highlightPlaylist";
import type { MatchHighlight } from "./highlightModel";
const clips = [{ id: "one" }, { id: "two" }, { id: "three" }] as MatchHighlight[];
it("finds adjacent clips without wrapping the playlist", () => {
  expect(playlistNeighbour(clips, "two", -1)).toBe(clips[0]);
  expect(playlistNeighbour(clips, "two", 1)).toBe(clips[2]);
  expect(playlistNeighbour(clips, "one", -1)).toBeNull();
  expect(playlistNeighbour(clips, "three", 1)).toBeNull();
});
