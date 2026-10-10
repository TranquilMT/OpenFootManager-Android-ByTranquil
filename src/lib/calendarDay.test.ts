import {describe,it,expect} from "vitest";
import {calendarDay} from "./calendarDay";
describe("career calendar dates",()=>{
 it("normalises valid calendar dates and timestamps without accepting rollover dates",()=>{
  expect(calendarDay("2026-08-10T15:00:00Z")).toBe("2026-08-10");
  expect(calendarDay("2026-08-10")).toBe("2026-08-10");
  expect(calendarDay("2026-02-30")).toBeNull();
  expect(calendarDay("not a date")).toBeNull();
 });
});
