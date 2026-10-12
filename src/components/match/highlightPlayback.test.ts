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

it("stops on the final action and bounds invalid seek positions", () => {
  expect(highlightPlayback({ frame: 1, playing: true }, { type: "advance" }, 2)).toEqual({
    frame: 1,
    playing: false,
  });
  expect(
    highlightPlayback({ frame: 0, playing: false }, { type: "seek", frame: Infinity }, 2),
  ).toEqual({ frame: 0, playing: false });
  expect(highlightPlayback({ frame: 0, playing: true }, { type: "advance" }, 0)).toEqual({
    frame: 0,
    playing: false,
  });
  expect(highlightPlayback({ frame: 0, playing: true }, { type: "seek", frame: 100 }, 2)).toEqual({
    frame: 1,
    playing: false,
  });
});

it("rejects malformed clip lengths instead of starting an empty replay", () => {
  for (const length of [NaN, Infinity, -1, 1.5])
    expect(highlightPlayback({ frame: 0, playing: false }, { type: "restart" }, length)).toEqual({
      frame: 0,
      playing: false,
    });
});
