import {render,screen} from "@testing-library/react";
import {describe,it,expect} from "vitest";
import type {TOptions} from "i18next";
import PlayerProfileInjuryBanner from "./PlayerProfileInjuryBanner";
const t=(key:string,options?:TOptions)=>key==="phase73.expectedRecovery" ? `Expected: ${options?.date}` : key;
describe("profile medical recovery date",()=>{
 it("shows the estimated date derived from the career clock",()=>{
  render(<PlayerProfileInjuryBanner injury={{name:"common.injuries.kneeBruise",days_remaining:3}} currentDate="2026-12-30" t={t}/>);
  expect(screen.getByText("Expected: 2027-01-02")).toBeInTheDocument();
 });
 it("does not show a fabricated date for an unknown recovery duration",()=>{
  render(<PlayerProfileInjuryBanner injury={{name:"common.injuries.kneeBruise",days_remaining:NaN}} currentDate="2026-12-30" t={t}/>);
  expect(screen.queryByText(/^Expected:/)).not.toBeInTheDocument();
 });
});
