#!/usr/bin/env node
// Release gate for the native WorldData schema, not the legacy intermediate importer format.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const nationSource = fs.readFileSync(new URL('../src-tauri/crates/ofm_core/src/nations.rs', import.meta.url), 'utf8');
const nations = new Set([...nationSource.matchAll(/code: "([A-Z]{2,3})"/g)].map(m => m[1]));
const positions = new Set('Goalkeeper Defender Midfielder Forward RightBack CenterBack LeftBack RightWingBack LeftWingBack DefensiveMidfielder CentralMidfielder AttackingMidfielder RightMidfielder LeftMidfielder RightWinger LeftWinger Striker'.split(' '));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const integer = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(v) && v >= min && v <= max;

export function validateDatabase(db, { minPlayers = 12000, minClubs = 800 } = {}) {
  const errors = [];
  if (!record(db)) return ['database root must be an object'];
  const fail = message => errors.push(message);
  for (const key of ['teams', 'players', 'staff', 'national_teams', 'competitions']) {
    if (!Array.isArray(db[key])) fail(`required root array missing: ${key}`);
  }
  const rows = key => (Array.isArray(db[key]) ? db[key] : []);
  if (rows('players').length < minPlayers) fail(`database requires at least ${minPlayers} players`);
  if (rows('teams').length < minClubs) fail(`database requires at least ${minClubs} clubs`);
  if (!rows('national_teams').length) fail('national_teams must contain sourced national-team records');
  if (db.schemaVersion !== 1) fail('schemaVersion must be 1 (native WorldData plus provenance)');
  if (!text(db.name) || !text(db.description)) fail('database name and description are required');
  if (!record(db.metadata) || db.metadata.format_version !== 1 || !text(db.metadata.world_id)
      || db.metadata.base_year !== 2026 || !date(db.metadata.snapshot_date)) fail('invalid required database metadata');

  const sources = db.provenance?.sources;
  if (!Array.isArray(sources) || !sources.length) fail('provenance.sources must list the actual incorporated datasets');
  const sourceIds = new Set();
  for (const s of Array.isArray(sources) ? sources : []) {
    if (!record(s) || !text(s.id)) { fail('malformed provenance source'); continue; }
    if (sourceIds.has(s.id)) fail(`duplicate source ${s.id}`);
    sourceIds.add(s.id);
    if (!/^https:\/\//.test(s.url ?? '') || !text(s.revision) || !text(s.license)
        || !Array.isArray(s.fields) || !s.fields.length) fail(`incomplete provenance for ${s.id}`);
    if (s.redistribution !== 'permitted') fail(`source redistribution not cleared: ${s.id}`);
    if (/compatible|open data only/i.test(s.license ?? '')) fail(`vague licence for ${s.id}`);
  }
  const checkSources = (r, label) => {
    if (!Array.isArray(r.sources) || !r.sources.length) { fail(`${label}: sources required`); return; }
    for (const id of r.sources) if (!sourceIds.has(id)) fail(`${label}: unknown source ${id}`);
  };
  const index = (key, singular) => {
    const ids = new Set();
    for (const r of rows(key)) {
      if (!record(r) || !text(r.id) || !/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(r.id)) { fail(`invalid ${singular} ID`); continue; }
      if (ids.has(r.id)) fail(`duplicate ${singular} ID ${r.id}`);
      ids.add(r.id);
    }
    return ids;
  };
  const clubs = index('teams', 'club');
  const players = index('players', 'player');
  const nationalTeams = index('national_teams', 'national team');
  index('staff', 'staff'); index('competitions', 'competition');
  for (const t of rows('teams').filter(record)) {
    const label = `club ${t.id}`;
    for (const k of ['name', 'short_name', 'formation', 'play_style']) if (!text(t[k])) fail(`${label}: ${k} required`);
    for (const k of ['city', 'stadium_name']) if (typeof t[k] !== 'string') fail(`${label}: ${k} must be a string`);
    for (const k of ['country', 'football_nation']) if (!nations.has(t[k])) fail(`${label}: invalid ${k} ${t[k]}`);
    for (const k of ['stadium_capacity', 'reputation', 'founded_year']) if (!integer(t[k])) fail(`${label}: invalid ${k}`);
    for (const k of ['finance', 'wage_budget', 'transfer_budget', 'season_income', 'season_expenses']) if (!Number.isSafeInteger(t[k])) fail(`${label}: invalid ${k}`);
    if (!['Balanced', 'Attacking', 'Defensive', 'Possession', 'Counter', 'HighPress'].includes(t.play_style)) fail(`${label}: invalid play_style`);
    if (!record(t.colors) || !text(t.colors.primary) || !text(t.colors.secondary) || !Array.isArray(t.history)) fail(`${label}: colors/history required`);
    checkSources(t, label);
  }
  for (const p of rows('players').filter(record)) {
    const label = `player ${p.id}`;
    if (!text(p.full_name) || !text(p.match_name)) fail(`${label}: native full_name/match_name required`);
    if (!date(p.date_of_birth) && !(p.date_of_birth === '' && p.unknownFields?.includes('date_of_birth'))) fail(`${label}: invalid date_of_birth (unknown must be explicitly documented)`);
    if (date(p.date_of_birth) && date(db.metadata?.snapshot_date) && p.date_of_birth >= db.metadata.snapshot_date) fail(`${label}: date_of_birth is in the future`);
    for (const k of ['nationality', 'football_nation']) if (!nations.has(p[k])) fail(`${label}: invalid ${k} ${p[k]}`);
    if (p.team_id !== null && !clubs.has(p.team_id)) fail(`${label}: unknown club ${p.team_id}`);
    for (const k of ['position', 'natural_position']) if (!positions.has(p[k])) fail(`${label}: invalid ${k}`);
    for (const k of 'pace stamina strength passing shooting tackling dribbling defending positioning vision decisions'.split(' ')) {
      if (!integer(p.attributes?.[k], 0, 100)) fail(`${label}: invalid attribute ${k}`);
    }
    if (!integer(p.ovr, 1, 99) || !integer(p.potential, p.ovr, 99)) fail(`${label}: invalid overall/potential`);
    for (const k of ['condition', 'morale']) if (!integer(p[k], 0, 100)) fail(`${label}: invalid ${k}`);
    for (const k of ['wage', 'market_value']) if (!integer(p[k])) fail(`${label}: invalid ${k}`);
    for (const k of 'appearances goals assists clean_sheets yellow_cards red_cards minutes_played shots shots_on_target passes_completed passes_attempted tackles_won interceptions fouls_committed'.split(' ')) {
      if (!integer(p.stats?.[k])) fail(`${label}: invalid season stats ${k}`);
    }
    if (!Number.isFinite(p.stats?.avg_rating) || !Array.isArray(p.career)) fail(`${label}: stats/career required`);
    if (!['real', 'generated'].includes(p.dataKind) || !text(p.ratingMethod)) fail(`${label}: dataKind/ratingMethod required`);
    if (p.ratingMethod === 'real-performance-v1' && (!record(p.realStats) || !Object.keys(p.realStats).length)) fail(`${label}: performance rating has no performance observations`);
    for (const id of p.national_team_ids ?? []) if (!nationalTeams.has(id)) fail(`${label}: unknown national team ${id}`);
    checkSources(p, label);
  }
  for (const t of rows('national_teams').filter(record)) {
    const label = `national team ${t.id}`;
    if (!text(t.name) || !nations.has(t.football_nation)) fail(`${label}: invalid identity/country`);
    if (!Array.isArray(t.squad_player_ids)) fail(`${label}: squad_player_ids required (may be empty)`);
    const members = new Set();
    for (const id of t.squad_player_ids ?? []) {
      if (!players.has(id)) fail(`${label}: unknown player ${id}`);
      if (members.has(id)) fail(`${label}: duplicate squad member ${id}`);
      members.add(id);
    }
    checkSources(t, label);
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const file = process.argv[2];
    if (!file) throw new Error('Usage: node scripts/validate-real-database.mjs <database.json> [--checksum]');
    const bytes = fs.readFileSync(file);
    const db = JSON.parse(bytes);
    const errors = validateDatabase(db);
    if (process.argv.includes('--checksum')) {
      const expected = fs.readFileSync(`${file}.sha256`, 'utf8').trim().split(/\s+/)[0];
      if (!/^[a-f0-9]{64}$/.test(expected) || createHash('sha256').update(bytes).digest('hex') !== expected) errors.push('database SHA-256 mismatch');
    }
    if (errors.length) throw new Error(`${errors.length} validation errors:\n${errors.slice(0, 50).join('\n')}`);
    console.log(`OK: ${db.teams.length} clubs, ${db.players.length} players, ${db.national_teams.length} national teams; native schema/provenance${process.argv.includes('--checksum') ? '/checksum' : ''} checked. Rust loader integration tests are also required.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
