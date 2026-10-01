# 0.6.4 daily training lookup

Daily training now indexes staff by club once before building training plans. Previously, each club scanned every staff member. The index changes lookup cost from O(clubs × staff) to O(clubs + staff); coaching formulas and staff order are preserved.

A local optimized Rust benchmark with 1,200 clubs, 7,200 staff and 20 daily passes measured 804.19 ms for repeated scans and 13.20 ms for indexed lookup. This is an isolated lookup measurement, not a claim that an entire date advance is 61 times faster. Run the ignored `benchmark_world_staff_lookup` test with `--ignored --nocapture` to reproduce. Machine-dependent timing has no pass/fail threshold.

The club-isolation test verifies that other clubs and unemployed coaches do not alter a club's bonus. Existing training integration tests cover condition, schedules, recovery and development.
