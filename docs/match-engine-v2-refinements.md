# Match Engine V2 — Further Refinements

This batch builds on 0.7.1 Build 360. It contains 14 targeted engine fixes and
14 corresponding regression-test commits, plus validation and documentation.

- Substitute minutes now run from entry to exit, including a later red card or second substitution.
- Large possession totals remain accurate in reports and live snapshots.
- Imported shot probabilities cannot corrupt team or player expected-goals totals.
- Empty assist identities no longer create phantom player statistics.
- Goals after a set-piece minute are attributed to open play.
- Harmless free kicks clear any previous set-piece goal attribution.
- Excessive fitness values cannot make stamina recover during play; exhausted players are never healed by the fatigue floor.
- Live condition displays stay between 0 and 100 and recover invalid numeric values.
- Lineup changes before kick-off preserve the full substitution allowance.
- Dismissed players cannot enter through pre-match swaps; rejected swaps leave match state intact.
- Formation labels match the shape applied, and tactical notifications follow actual changes.
- Imported condition cannot inflate effective player ratings above full fitness.
- Overall ratings respect the 0–100 attribute scale.
- Player selection never restores a dismissed participant when the active pool is empty.

The refinement workflow first runs the new regressions against the released
0.7.1 baseline, expecting all 14 to fail. It then runs all engine tests and
strict engine lint against the fixed source, alongside frontend and full Rust
workspace verification. No saved-game schema or package identity changes.
