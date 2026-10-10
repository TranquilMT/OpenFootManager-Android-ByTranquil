import {describe,it,expect} from "vitest";
import { playerMatchPerformance } from "./playerPerformance";
import type {MatchSnapshot,MatchEvent,EnginePlayerData} from "./types";
const player = (id:string) => ({id,name:id}) as EnginePlayerData;
const event = (event_type:string, player_id:string, secondary_player_id:string|null=null, side:"Home"|"Away"="Home", minute=30):MatchEvent =>
 ({event_type,player_id,secondary_player_id,side,minute,zone:"Midfield"});
const snapshot = (events:MatchEvent[]=[]) => ({
 phase:"SecondHalf", current_minute:75,home_team:{players:[player("scorer"),player("helper"),player("keeper")]},away_team:{players:[]},
 home_bench:[player("unused")],away_bench:[],substitutions:[],events,sent_off:[],
}) as unknown as MatchSnapshot;
describe("recorded player match performance",()=>{
 it("counts match goals, valid assists and attempts without shootout inflation",()=>{
   const snap=snapshot([event("Goal","scorer","helper"),event("PenaltyGoal","scorer","keeper"),event("ShootoutGoal","scorer"),event("ShotBlocked","scorer")]);
   const rows=playerMatchPerformance(snap,"Home");
   expect(rows.find(row=>row.id==="scorer")).toMatchObject({goals:2,assists:0,shots:3,onTarget:2});
   expect(rows.find(row=>row.id==="helper")?.assists).toBe(1);
   expect(rows.find(row=>row.id==="keeper")?.assists).toBe(0);
   expect(rows.some(row=>row.id==="unused")).toBe(false);
 });
});
