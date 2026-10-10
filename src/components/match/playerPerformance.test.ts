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

 it("stops minutes at a dismissal and accounts for substitutes later replaced",()=>{
  const snap=snapshot([event("SecondYellow","scorer",null,"Home",55)]);
  snap.home_team.players=[player("helper")];
  snap.home_bench=[player("scorer"),player("keeper"),player("unused")];
  snap.substitutions=[{side:"Home",minute:60,player_off_id:"keeper",player_on_id:"helper"},
    {side:"Home",minute:70,player_off_id:"helper",player_on_id:"unused"}];
  const rows=playerMatchPerformance(snap,"Home");
  expect(rows.find(row=>row.id==="scorer")?.minutes).toBe(55);
  expect(rows.find(row=>row.id==="keeper")?.minutes).toBe(60);
  expect(rows.find(row=>row.id==="helper")?.minutes).toBe(10);
  expect(rows.find(row=>row.id==="unused")?.minutes).toBe(5);
 });



 it("uses recorded secondary keeper identities when legacy shots lack xG metadata",()=>{
  const snap=snapshot([event("ShotSaved","opponent","keeper","Away")]);
  expect(playerMatchPerformance(snap,"Home").find(row=>row.id==="keeper")?.saves).toBe(1);
 });



 it("freezes played minutes before the first shootout kick",()=>{
  const snap=snapshot([event("ShootoutGoal","scorer",null,"Home",121),event("ShootoutMiss","helper",null,"Home",124)]);
  snap.phase="PenaltyShootout";snap.current_minute=124;
  expect(playerMatchPerformance(snap,"Home").find(row=>row.id==="scorer")?.minutes).toBe(120);
 });


});
