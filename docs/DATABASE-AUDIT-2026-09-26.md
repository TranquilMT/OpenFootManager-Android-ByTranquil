# Database release blocker — verified 2026-09-26

## Artifact inspected

- Source repository: `TranquilMT/openfootmanagerforandroid`
- Run: `36234308967`; artifact: `10903908574`
- Artifact name: `OpenFootManager-2026-27-Database-Snapshot`
- JSON size: 5,107,866 bytes
- JSON SHA-256: `2718cd31fce2cee5e96f8d4a5040d678d8b392acea8db5fbed5b01e7c2578a2e`
- 12,755 players; 847 team records; 480 teams with country `INT`.
- No duplicate player IDs; one repeated case-insensitive name (not proof of duplicate identity).
- Root keys: `name`, `description`, `provenance`, `teams`, `players`, `staff`.

This artifact is **not committed or approved for redistribution**. Its checksum is an audit reference, not an endorsement of the contents.

## Actual source composition

| Source | Evidence / fields | Rights / status |
| --- | --- | --- |
| OpenFootball World Cup 2026 | 1,248 `player-*` identities; names, birth dates, nationality, World Cup squad and club-at-tournament relationships | Repository `LICENSE.md` is CC0-1.0. 48 squads / 1,248 players inspected at `516d3825c3bd23fdc298c4014e84bde78f2d4965`. Tournament squads do not establish September 2026 membership or transfers. |
| StatsBomb / Hudl Open Data | 11,507 `sb-*` identities; historical lineup club, name and country. All these records lack birth dates. | Custom Public Data User Agreement, **not CC0**. Clauses 1.2.1 and 7 restrict redistribution. Do not bundle this dataset without appropriate written permission. |
| OpenFootball football.json | Generator reads 2026/27 fixture team names, but drops country/competition context | Per-source revision and licence need pinning in replacement importer. |
| OpenFootball players | Generator attempts name-matched position/height enrichment; snapshot discards record-level sources | Contribution cannot be fully reconstructed from the final JSON alone. |
| OpenFootball clubs | Generator clones catalogue but never reads it | Not an incorporated source in this artifact. Catalogue inspected separately at `ae3800227c449447b3a337fc0aac79a8f02f4c8b`; useful for a replacement country resolver. |
| dcaribou/transfermarkt-datasets | No `tm-*` player IDs in the artifact | No imported players evidenced; do not claim this is a Transfermarkt-enriched roster. |
| withqwerty/reep | Generator counts files but performs no identity reconciliation | No imported field contribution evidenced; do not claim enrichment. |

Authoritative source references:
- https://github.com/openfootball/worldcup.json/blob/516d3825c3bd23fdc298c4014e84bde78f2d4965/LICENSE.md
- https://github.com/openfootball/worldcup.json/blob/516d3825c3bd23fdc298c4014e84bde78f2d4965/2026/worldcup.squads.json
- https://github.com/hudl/open-data/blob/master/LICENSE.pdf (inspected 2026-09-26; Git blob `66c0b4be6bf38b720d347bb140d70b9c47d9a676`)
- https://github.com/openfootball/clubs/tree/ae3800227c449447b3a337fc0aac79a8f02f4c8b

## Native loader incompatibility

The snapshot is an intermediate importer format, not a Rust `WorldData` export.
`load_world_from_json` deserializes directly to `WorldData`. Club records lack required
`short_name`, stadium, finance and other native fields. Players use `name`, `teamId`,
`dateOfBirth`, bucket positions and `overall`; native records require `full_name`,
`match_name`, `team_id`, `date_of_birth`, native position enums, attributes and season stats.
The existing count-only validator passed data that this loader cannot deserialize.

New Career's frontend omits `worldSource`. The command resolves omitted sources to the
bundled resource. That wiring is present, but **a successful career has not been verified**.
On Android the resource access path also needs testing on-device; a configuration entry
alone is not proof that a resource is readable through `std::fs`.

## Data quality defects

- `ensureClub` uses `INT` for fixture and StatsBomb lineup imports, truncates arbitrary
  country input, and never enriches an existing record with a later known country.
- Historical national teams (and women's teams) can be treated as clubs by the lineup loop.
  Historical lineup membership does not prove a current 2026/27 club contract.
- The importer drops `nationalTeams`, source revisions and player-level `sources`.
- All 12,755 `realStats` objects are empty. 12,243 players rate 56; 512 rate 58.
  These are fallback simulation values, **not performance-derived ratings**.
- The position map omits spelled-out StatsBomb positions; 9,927 players become `MID`.
- Potential uses age 25 when no explicit age exists, even when a birth date is available.
- Nationality mixes FIFA-style codes and uppercase country names; the game catalogue
  uses its own canonical codes (for example `DE`, `ES`, `ENG`).
- Generated game defaults must be recorded separately from sourced real-world facts.

## Gates now in place

The native-schema validator checks IDs, references, canonical country codes, core native
fields, provenance, source references, rating evidence, dates, minimum counts and optional
SHA-256. Tests cover corrupt/malformed examples. A native Rust deserialization plus
career/save round-trip test remains a required additional gate; JavaScript validation
alone does not prove gameplay integration.

Android CI requires a tracked JSON **and tracked checksum**, validates both before
installing frontend dependencies or toolchains, and never regenerates the database.
The separate legacy refresh script stops immediately with an explanation instead of
recreating the restricted, incompatible artifact. Replace that pipeline before re-enabling it.

## Decision needed before a release

The requested 12,000+ player minimum cannot be met by the verified 1,248-player CC0
World Cup source alone. Supply a redistributable current roster / appropriate source
permission, or explicitly revise the first Nightly scope to a smaller open-data database.
Do not lower the minimum silently, invent current club/squad membership, copy proprietary
ratings, or publish this artifact with a blanket CC0 label.

Pending after source selection: country/club reconciliation, native importer, national-team
relationships, provenance retained in saves, Rust integration tests, device UI testing,
ARM64 build, package inspection, signing verification, checksum and Nightly release.
