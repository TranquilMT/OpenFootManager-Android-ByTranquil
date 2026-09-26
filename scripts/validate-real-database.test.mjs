import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDatabase } from './validate-real-database.mjs';

const fixture = () => ({
  schemaVersion: 1, name: 'Test world', description: 'Synthetic validation fixture',
  metadata: { format_version: 1, world_id: 'test', base_year: 2026, snapshot_date: '2026-09-26' },
  provenance: { sources: [{ id: 'test', url: 'https://example.org/data', revision: 'test', license: 'CC0-1.0', redistribution: 'permitted', fields: ['identity'] }] },
  teams: [{ id: 'club', name: 'Club', short_name: 'Club', country: 'ENG', football_nation: 'ENG', city: '', stadium_name: '', stadium_capacity: 10000, finance: 0, reputation: 50, wage_budget: 0, transfer_budget: 0, season_income: 0, season_expenses: 0, formation: '4-4-2', play_style: 'Balanced', founded_year: 0, colors: { primary: '#000000', secondary: '#ffffff' }, history: [], sources: ['test'] }],
  players: [{ id: 'p', full_name: 'Test Player', match_name: 'Player', date_of_birth: '2000-01-01', nationality: 'ENG', football_nation: 'ENG', team_id: 'club', position: 'Goalkeeper', natural_position: 'Goalkeeper', attributes: Object.fromEntries('pace stamina strength passing shooting tackling dribbling defending positioning vision decisions'.split(' ').map(k => [k, 50])), condition: 100, morale: 50, wage: 0, market_value: 0, stats: Object.fromEntries('appearances goals assists clean_sheets yellow_cards red_cards avg_rating minutes_played shots shots_on_target passes_completed passes_attempted tackles_won interceptions fouls_committed'.split(' ').map(k => [k, 0])), career: [], ovr: 50, potential: 60, dataKind: 'real', sources: ['test'], ratingMethod: 'simulation-baseline-v1' }],
  national_teams: [{ id: 'nt-eng', name: 'England', football_nation: 'ENG', squad_player_ids: ['p'], sources: ['test'] }], staff: [], competitions: [],
});
const check = (db) => validateDatabase(db, { minPlayers: 1, minClubs: 1 });
test('native fixture passes', () => assert.deepEqual(check(fixture()), []));
for (const [name, mutate, expected] of [
  ['duplicate player ID', d => d.players.push(structuredClone(d.players[0])), /duplicate player/],
  ['dangling club', d => d.players[0].team_id = 'missing', /unknown club/],
  ['dangling national squad member', d => d.national_teams[0].squad_player_ids.push('missing'), /unknown player/],
  ['invalid nationality', d => d.players[0].nationality = 'ENGLAND', /nationality/],
  ['missing national teams', d => delete d.national_teams, /national_teams/],
  ['camelCase importer shape', d => { d.teams[0].shortName = 'Club'; delete d.teams[0].short_name; }, /short_name/],
  ['vague provenance', d => d.provenance = { license: 'compatible open data only' }, /sources/],
  ['restricted source', d => d.provenance.sources[0].redistribution = 'restricted', /redistribution/],
  ['unresolved source reference', d => d.players[0].sources = ['missing'], /unknown source/],
  ['impossible date', d => d.players[0].date_of_birth = '2000-02-31', /date_of_birth/],
  ['unknown country placeholder', d => d.teams[0].country = 'INT', /country/],
  ['invalid potential', d => d.players[0].potential = 40, /potential/],
]) test(name, () => { const d = fixture(); mutate(d); assert.match(check(d).join('\n'), expected); });
test('release counts cannot silently shrink', () => assert.match(validateDatabase(fixture()).join('\n'), /12000 players/));
test('malformed roots produce diagnostics rather than crashing', () => {
  for (const input of [null, [], {}, { teams: [null], players: [null], national_teams: [null] }]) {
    assert.ok(validateDatabase(input).length > 0);
  }
});
