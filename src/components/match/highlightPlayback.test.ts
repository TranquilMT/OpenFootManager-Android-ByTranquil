import { expect, it } from "vitest";
import { highlightPlayback } from "./highlightPlayback";
it("plays, pauses and advances one recorded action at a time", () => {
  let state = { frame: 0, playing: false };
  state = highlightPlayback(state, { type: "play" }, 3);
  expect(state.playing).toBe(true);
  state = highlightPlayback(state, { type: "advance" }, 3);
  expect(state.frame).toBe(1);
  state = highlightPlayback(state, { type: "pause" }, 3);
  expect(state.playing).toBe(false);
  state = highlightPlayback(state, { type: "restart" }, 3);
  expect(state).toEqual({ frame: 0, playing: true });
});
