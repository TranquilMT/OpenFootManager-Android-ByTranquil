import { describe, expect, it } from "vitest";
import { placeSelectMenu } from "./Select.helpers";
const viewport = { top: 0, left: 0, width: 360, height: 640 };
const trigger = { top: 100, bottom: 144, left: 24, width: 240 };
describe("select viewport placement", () => {
  it("fits a normal formation list below its trigger", () => { const result = placeSelectMenu(trigger, viewport, 240, 280, 8); expect(result.top).toBe(148); expect(result.listHeight).toBe(232); });
});
