import { describe, expect, it } from "vitest";
import { loadShortlist, saveShortlist, shortlistKey } from "./shortlist";

describe("career scouting shortlists", () => {
  it("keeps each career separate and ignores corrupt entries", () => {
    const storage = new Map<string, string>();
    const backing = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
    };
    saveShortlist("career-a", ["p1", "p1", "p2"], backing);
    expect(loadShortlist("career-a", backing)).toEqual(["p1", "p2"]);
    expect(loadShortlist("career-b", backing)).toEqual([]);
    storage.set(shortlistKey("career-b"), '["p3", 7, "", null]');
    expect(loadShortlist("career-b", backing)).toEqual(["p3"]);
    storage.set(shortlistKey("career-b"), "broken");
    expect(loadShortlist("career-b", backing)).toEqual([]);
  });
});
