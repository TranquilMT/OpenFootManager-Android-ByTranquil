# 2026/27 football rules review

Official sources checked 29 September 2026:

- [IFAB 2026/27 changes](https://downloads.theifab.com/downloads/changes-to-the-laws-of-the-game-202627?l=en)
- [IFAB Law 11: Offside](https://www.theifab.com/laws/latest/offside/)
- [Premier League 2026/27 football principles](https://www.premierleague.com/en/news/4674118/premier-league-sets-football-principles-for-202627-season)

There is no new "daylight" or "whole-body" offside law in the published 2026/27 changes. The Premier League instead calls for more efficient semi-automated offside reviews. Law 11 still judges involvement in active play and exempts direct receipts from goal kicks, throw-ins and corners. The match engine currently lacks player coordinates and an offside event model; changing the offside decision probability would falsely imply a law change. A faithful simulation needs pass-time positions, the second-last defender, active involvement, and restart origin, with tests for those cases before commentary or spoken narration can report an offside call.

Other IFAB changes include a time-limited substitution procedure. The existing match UI and engine do not represent the ten-second substitution-board countdown, so this is recorded for the next match-engine implementation rather than shown as a simulated rule.
