//! Roster invariants shared across the engine's join-a-team paths.
//!
//! The persistence layer enforces "no two players at one club share a jersey
//! number" via a unique index, but enforcement at save time only catches
//! violations *after* the in-memory state has already produced one. This
//! module is the single choke point that prevents such states from arising.

use crate::game::Game;
use domain::player::Player;
use domain::team::Team;

/// Decide which jersey number `player` should wear at `team`.
///
/// * If the player's current jersey is free at `team`, returns it (no churn).
/// * Otherwise keepers prefer 1, 13 and 22; outfield players use `2..=99`.
/// * Returns `None` only when all 99 slots at the destination are already
///   taken — unreachable for any realistic squad size, but the caller should
///   still handle it.
///
/// Pure: does not mutate anything. The caller writes the returned value into
/// `player.jersey_number` as part of whichever team-change side-effect it is
/// already performing.
///
/// The player about to be moved is excluded from the destination's occupied
/// set by id, so the function is safe to call even when the player happens
/// to already be at `team` (e.g. an idempotent reassignment).
pub fn resolve_jersey_for(game: &Game, player: &Player, team: &Team) -> Option<u8> {
    let occupied: std::collections::HashSet<u8> = game
        .players
        .iter()
        .filter(|other| other.id != player.id && other.team_id.as_deref() == Some(team.id.as_str()))
        .filter_map(|other| other.jersey_number)
        .collect();
    match player.jersey_number {
        Some(current) if (1..=99).contains(&current) && !occupied.contains(&current) => Some(current),
        _ => {
            let preferred: &[u8] = if player.position.to_group_position() == domain::player::Position::Goalkeeper {
                &[1, 13, 22]
            } else {
                &[]
            };
            preferred.iter().copied().chain(2u8..=99).find(|number| !occupied.contains(number))
        },
    }
}

/// Standard generated squads register the strongest senior keeper as #1.
/// Swap the displaced shirt rather than discard valid outfield numbers.
/// Academy players are unregistered until promotion to the senior squad.
pub fn normalize_club_numbers(players: &mut [Player]) {
    use domain::player::{Position, SquadRole};
    for player in players.iter_mut().filter(|p| p.squad_role == SquadRole::Youth) {
        player.jersey_number = None;
    }
    let primary = players.iter().enumerate()
        .filter(|(_, p)| p.squad_role == SquadRole::Senior && p.position.to_group_position() == Position::Goalkeeper)
        .max_by_key(|(_, p)| p.ovr).map(|(index, _)| index);
    if let Some(keeper) = primary {
        let previous = players[keeper].jersey_number.filter(|n| (2..=99).contains(n));
        for (index, player) in players.iter_mut().enumerate() {
            if index != keeper && player.jersey_number == Some(1) {
                player.jersey_number = previous;
            }
        }
        players[keeper].jersey_number = Some(1);
    }
    let mut used = std::collections::HashSet::new();
    if primary.is_some() { used.insert(1); }
    for (index, player) in players.iter_mut().enumerate().filter(|(_, p)| p.squad_role != SquadRole::Youth) {
        if primary == Some(index) { continue; }
        if player.jersey_number.is_some_and(|n| (1..=99).contains(&n) && used.insert(n)) {
            continue;
        }
        let preferred: &[u8] = if player.position.to_group_position() == Position::Goalkeeper { &[1, 13, 22] } else { &[] };
        player.jersey_number = preferred.iter().copied().chain(2..=99).find(|n| !used.contains(n));
        if let Some(n) = player.jersey_number { used.insert(n); }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::clock::GameClock;
    use chrono::{TimeZone, Utc};
    use domain::manager::Manager;
    use domain::player::{Player, PlayerAttributes, Position};
    use domain::team::Team;

    fn default_attrs() -> PlayerAttributes {
        PlayerAttributes {
            pace: 60,
            stamina: 60,
            strength: 60,
            agility: 60,
            passing: 60,
            shooting: 60,
            tackling: 60,
            dribbling: 60,
            defending: 60,
            positioning: 60,
            vision: 60,
            decisions: 60,
            composure: 60,
            aggression: 60,
            teamwork: 60,
            leadership: 60,
            handling: 30,
            reflexes: 30,
            aerial: 60,
        }
    }

    fn make_player(id: &str, team_id: Option<&str>, jersey: Option<u8>) -> Player {
        let mut player = Player::new(
            id.to_string(),
            id.to_string(),
            id.to_string(),
            "2000-01-01".to_string(),
            "England".to_string(),
            Position::Forward,
            default_attrs(),
        );
        player.team_id = team_id.map(|t| t.to_string());
        player.jersey_number = jersey;
        player
    }

    fn make_team(id: &str) -> Team {
        Team::new(
            id.to_string(),
            id.to_string(),
            id.to_string(),
            "England".to_string(),
            "City".to_string(),
            "Ground".to_string(),
            20_000,
        )
    }

    fn make_game(players: Vec<Player>) -> Game {
        let clock = GameClock::new(Utc.with_ymd_and_hms(2026, 8, 1, 12, 0, 0).unwrap());
        let manager = Manager::new(
            "m-1".to_string(),
            "Test".to_string(),
            "Manager".to_string(),
            "1980-01-01".to_string(),
            "England".to_string(),
        );
        Game::new(
            clock,
            manager,
            vec![make_team("team-a")],
            players,
            vec![],
            vec![],
        )
    }

    #[test]
    fn keeps_preferred_jersey_when_free_at_destination() {
        let moving = make_player("p-moving", None, Some(6));
        let game = make_game(vec![make_player("p-existing", Some("team-a"), Some(10))]);
        assert_eq!(
            resolve_jersey_for(&game, &moving, &make_team("team-a")),
            Some(6)
        );
    }

    #[test]
    fn reassigns_when_preferred_jersey_is_taken() {
        let moving = make_player("p-moving", None, Some(6));
        let game = make_game(vec![make_player("p-existing", Some("team-a"), Some(6))]);
        assert_eq!(
            resolve_jersey_for(&game, &moving, &make_team("team-a")),
            Some(2)
        );
    }

    #[test]
    fn picks_lowest_free_when_player_has_no_preferred_jersey() {
        let moving = make_player("p-moving", None, None);
        let players = vec![
            make_player("p-1", Some("team-a"), Some(1)),
            make_player("p-2", Some("team-a"), Some(2)),
            make_player("p-3", Some("team-a"), Some(4)),
        ];
        let game = make_game(players);
        assert_eq!(
            resolve_jersey_for(&game, &moving, &make_team("team-a")),
            Some(3)
        );
    }

    #[test]
    fn excludes_moving_player_from_occupancy() {
        // Moving player already at the destination wearing #6 — resolver must
        // not see their own jersey as a conflict.
        let moving = make_player("p-moving", Some("team-a"), Some(6));
        let game = make_game(vec![moving.clone()]);
        assert_eq!(
            resolve_jersey_for(&game, &moving, &make_team("team-a")),
            Some(6)
        );
    }

    #[test]
    fn ignores_players_at_other_teams_and_free_agents() {
        let moving = make_player("p-moving", None, Some(6));
        let players = vec![
            make_player("p-other-team", Some("team-z"), Some(6)),
            make_player("p-free-agent", None, Some(6)),
        ];
        let game = make_game(players);
        assert_eq!(
            resolve_jersey_for(&game, &moving, &make_team("team-a")),
            Some(6)
        );
    }

    #[test]
    fn returns_none_when_destination_is_full() {
        let moving = make_player("p-moving", None, None);
        let mut players = Vec::new();
        for n in 1u8..=99 {
            players.push(make_player(&format!("p-{}", n), Some("team-a"), Some(n)));
        }
        let game = make_game(players);
        assert_eq!(
            resolve_jersey_for(&game, &moving, &make_team("team-a")),
            None
        );
    }
    #[test]
    fn unnumbered_outfield_player_reserves_one_for_goalkeepers() {
        let moving = make_player("forward", None, None);
        assert_eq!(resolve_jersey_for(&make_game(vec![]), &moving, &make_team("team-a")), Some(2));
    }

    #[test]
    fn invalid_preferred_numbers_are_repaired() {
        for number in [0, 100, 255] {
            let moving = make_player("forward", None, Some(number));
            assert_eq!(resolve_jersey_for(&make_game(vec![]), &moving, &make_team("team-a")), Some(2));
        }
    }

    #[test]
    fn keeper_prefers_thirteen_when_one_is_taken() {
        let mut moving = make_player("keeper", None, None);
        moving.position = Position::Goalkeeper;
        let game = make_game(vec![make_player("keeper-one", Some("team-a"), Some(1))]);
        assert_eq!(resolve_jersey_for(&game, &moving, &make_team("team-a")), Some(13));
    }

    #[test]
    fn primary_keeper_gets_one_even_after_an_unnumbered_backup() {
        let mut backup = make_player("backup", Some("team-a"), None);
        backup.position = Position::Goalkeeper;
        backup.ovr = 50;
        let mut primary = backup.clone();
        primary.id = "primary".into();
        primary.ovr = 80;
        primary.jersey_number = Some(2);
        let mut displaced = make_player("outfield", Some("team-a"), Some(1));
        displaced.ovr = 70;
        let mut youth = make_player("youth", Some("team-a"), Some(9));
        youth.squad_role = domain::player::SquadRole::Youth;
        let mut squad = vec![backup, primary, displaced, youth];
        normalize_club_numbers(&mut squad);
        assert_eq!(squad[0].jersey_number, Some(13));
        assert_eq!(squad[1].jersey_number, Some(1));
        assert_eq!(squad[2].jersey_number, Some(2));
        assert_eq!(squad[3].jersey_number, None);
        let saved = squad.clone();
        normalize_club_numbers(&mut squad);
        assert_eq!(squad.iter().map(|p| p.jersey_number).collect::<Vec<_>>(), saved.iter().map(|p| p.jersey_number).collect::<Vec<_>>());
    }

}
