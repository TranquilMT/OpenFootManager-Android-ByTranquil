import { describe, expect, it } from "vitest";
import { placeSelectMenu } from "./Select.helpers";
const viewport = { top: 0, left: 0, width: 360, height: 640 };
const trigger = { top: 100, bottom: 144, left: 24, width: 240 };
describe("select viewport placement", () => {
  it("fits a normal formation list below its trigger", () => { const result = placeSelectMenu(trigger, viewport, 240, 280, 8); expect(result.top).toBe(148); expect(result.listHeight).toBe(232); });
  it("flips a long formation list above a low trigger", () => { const result = placeSelectMenu({...trigger, top:560,bottom:604}, viewport, 240,280,8); expect(result.top).toBe(316); });
  it("keeps the list inside a short phone viewport", () => { const result = placeSelectMenu({...trigger,top:40,bottom:84}, {...viewport,height:140},240,280,8); expect(result.top + result.listHeight + 8).toBeLessThanOrEqual(132); });
  it("uses the visible viewport after the keyboard opens", () => { const result=placeSelectMenu({...trigger,top:260,bottom:304}, {...viewport,height:320},240,280,8); expect(result.top).toBe(16); });
  it("respects a viewport displaced by browser chrome", () => { const result=placeSelectMenu({...trigger,top:70,bottom:114}, {...viewport,top:50,height:240},240,280,8); expect(result.top).toBeGreaterThanOrEqual(58); expect(result.top+result.listHeight+8).toBeLessThanOrEqual(282); });
});
