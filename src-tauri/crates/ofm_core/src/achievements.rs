//! Career objectives award each achievement once; only derived, capped perks are applied.
use crate::game::Game;
use domain::manager_progression::ACHIEVEMENTS;

pub fn refresh(game: &mut Game) {
    let stats = &game.manager.career_stats;
    let team_id = game.manager.team_id.as_deref();
    let developed = game.players.iter().any(|player| {
        !player.retired
            && team_id.is_some()
            && player.team_id.as_deref() == team_id
            && player.development_history.last().is_some_and(|review| {
                review.focus.is_some()
                    && review.focus == player.training_focus
                    && player.ovr > review.ovr
            })
    });
    let season = game
        .primary_competition()
        .map_or(0, |competition| competition.season);
    let youth_minutes = if stats.progression.youth_team_id.as_deref() == team_id
        && stats.progression.youth_season == Some(season)
    {
        stats.progression.youth_minutes
    } else {
        0
    };
    let reached = [
        stats.matches_managed >= 1,
        stats.wins >= 1,
        stats.wins >= 10,
        stats.matches_managed >= 50,
        stats.trophies >= 1,
        stats
            .milestones
            .iter()
            .any(|milestone| milestone.kind == "promotion"),
        game.board_objectives.iter().any(|objective| objective.met),
        developed,
        youth_minutes >= 900,
        stats
            .milestones
            .iter()
            .any(|milestone| milestone.kind == "anniversary"),
    ];
    let date = game.clock.current_date.format("%Y-%m-%d").to_string();
    let old_level = stats.progression.level();
    for ((id, _), reached) in ACHIEVEMENTS.iter().zip(reached) {
        if reached {
            game.manager.career_stats.progression.unlock(id, &date);
        }
    }
    let new_level = game.manager.career_stats.progression.level();
    // A single small celebration per earned level. Daily evaluation and reloads
    // cannot repeat it, and a manager between clubs receives no banked team boost.
    let morale = new_level.saturating_sub(old_level).saturating_mul(2);
    if morale > 0
        && let Some(team_id) = &game.manager.team_id
    {
        for player in &mut game.players {
            if !player.retired && player.team_id.as_ref() == Some(team_id) {
                player.morale = player.morale.saturating_add(morale).min(100);
            }
        }
    }
}

/// Match-only bonuses never rewrite a player's permanent attributes or rating.
pub(crate) fn apply_match_perks(game: &Game, team_id: &str, player: &mut engine::PlayerData) {
    if game.manager.team_id.as_deref() != Some(team_id) {
        return;
    }
    let bonus = game.manager.career_stats.progression.performance_bonus();
    player.composure = player.composure.saturating_add(bonus).min(100);
    player.decisions = player.decisions.saturating_add(bonus).min(100);
    player.teamwork = player.teamwork.saturating_add(bonus).min(100);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::clock::GameClock;
    use chrono::{TimeZone, Utc};
    use domain::{
        manager::Manager,
        player::{Player, PlayerAttributes, Position},
    };

    fn game() -> Game {
        let mut manager = Manager::new(
            "manager".into(),
            "Test".into(),
            "Manager".into(),
            "1980-01-01".into(),
            "GB".into(),
        );
        manager.hire("club".into());
        let mut player = Player::new(
            "p".into(),
            "Player".into(),
            "Player".into(),
            "2008-01-01".into(),
            "GB".into(),
            Position::Midfielder,
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
                handling: 60,
                reflexes: 60,
                aerial: 60,
            },
        );
        player.team_id = Some("club".into());
        player.morale = 98;
        let mut opponent = player.clone();
        opponent.id = "opponent".into();
        opponent.team_id = Some("other".into());
        opponent.morale = 50;
        Game::new(
            GameClock::new(Utc.with_ymd_and_hms(2026, 8, 1, 12, 0, 0).unwrap()),
            manager,
            vec![],
            vec![player, opponent],
            vec![],
            vec![],
        )
    }
    #[test]
    fn level_rewards_survive_save_load_without_repeating_or_touching_opponents() {
        let mut game = game();
        game.manager.career_stats.wins = 10;
        game.manager.career_stats.matches_managed = 10;
        refresh(&mut game);
        assert_eq!(game.manager.career_stats.progression.level(), 2);
        assert_eq!(game.players[0].morale, 100);
        assert_eq!(game.players[1].morale, 50);
        let saved = serde_json::to_string(&game).unwrap();
        let mut loaded: Game = serde_json::from_str(&saved).unwrap();
        loaded.players[0].morale = 70;
        refresh(&mut loaded);
        assert_eq!(loaded.players[0].morale, 70);
        assert_eq!(loaded.manager.career_stats.progression.xp(), 300);
    }
    #[test]
    fn youth_minutes_require_current_owned_club_and_actual_young_players() {
        let mut game = game();
        game.players[0].stats.minutes_played = 900;
        refresh(&mut game);
        assert!(game.manager.career_stats.progression.unlocked.is_empty());
        credit_youth_minutes(&mut game, &[("p".into(), 900)]);
        refresh(&mut game);
        assert!(
            game.manager
                .career_stats
                .progression
                .unlocked
                .iter()
                .any(|entry| entry.id == "academy_minutes")
        );
        let mut game = self::game();
        game.manager.team_id = None;
        game.players[0].stats.minutes_played = 900;
        refresh(&mut game);
        assert!(game.manager.career_stats.progression.unlocked.is_empty());
    }
}

/// Called only for a completed match involving the user's current club, behind
/// the match-report retry guard. Acquired players bring no previous-club credit.
pub(crate) fn credit_youth_minutes(game: &mut Game, played: &[(String, u32)]) {
    let Some(team_id) = game.manager.team_id.clone() else {
        return;
    };
    let season = game
        .primary_competition()
        .map_or(0, |competition| competition.season);
    let minutes = played
        .iter()
        .filter(|(id, _)| {
            game.players.iter().any(|player| {
                player.id == *id
                    && !player.retired
                    && player.team_id.as_ref() == Some(&team_id)
                    && chrono::NaiveDate::parse_from_str(&player.date_of_birth, "%Y-%m-%d")
                        .is_ok_and(|birth| {
                            game.clock
                                .current_date
                                .date_naive()
                                .years_since(birth)
                                .is_some_and(|age| age <= 21)
                        })
            })
        })
        .map(|(_, minutes)| *minutes)
        .fold(0, u32::saturating_add);
    let progress = &mut game.manager.career_stats.progression;
    if progress.youth_team_id.as_ref() != Some(&team_id) || progress.youth_season != Some(season) {
        progress.youth_minutes = 0;
        progress.youth_team_id = Some(team_id);
        progress.youth_season = Some(season);
    }
    progress.youth_minutes = progress.youth_minutes.saturating_add(minutes);
}
