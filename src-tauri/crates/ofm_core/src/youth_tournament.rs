//! Academy Challenge fixtures use their own eligible player pool and never
//! enter the senior league, transfer market, or senior appearance statistics.
use crate::game::Game;
use crate::player_rating::refresh_player_derived;
use chrono::{Datelike, NaiveDate};
use domain::message::{
    ActionType, InboxMessage, MessageAction, MessageCategory, MessageContext, MessagePriority,
};
use domain::player::SquadRole;
use std::collections::HashMap;

pub const ACADEMY_CAP: usize = 12;
pub const YOUTH_MATCHDAY_MINIMUM: usize = 14;

fn youth_match_ready(academy_count: usize, eligible_senior_count: usize) -> bool {
    academy_count == ACADEMY_CAP && academy_count + eligible_senior_count >= YOUTH_MATCHDAY_MINIMUM
}

fn under_21(date_of_birth: &str, date: NaiveDate) -> bool {
    NaiveDate::parse_from_str(date_of_birth, "%Y-%m-%d")
        .ok()
        .and_then(|birth| date.years_since(birth))
        .is_some_and(|age| age < 21)
}

/// A separate monthly youth fixture can use up to twelve academy players plus
/// under-21 first-team players. A missing bench postpones it without a forfeit.
pub fn process_youth_fixture(game: &mut Game) {
    if game.clock.current_date.day() != 15 {
        return;
    }
    let Some(team_id) = game.manager.team_id.clone() else {
        return;
    };
    let year = game.clock.current_date.year();
    let month = game.clock.current_date.format("%Y-%m").to_string();
    let date = game.clock.current_date.format("%Y-%m-%d").to_string();
    let academy_ids: Vec<String> = game
        .players
        .iter()
        .filter(|player| {
            player.team_id.as_deref() == Some(team_id.as_str())
                && player.squad_role == SquadRole::Youth
                && !player.retired
                && player.injury.is_none()
        })
        .take(ACADEMY_CAP)
        .map(|player| player.id.clone())
        .collect();
    let senior_u21_ids: Vec<String> = game
        .players
        .iter()
        .filter(|player| {
            player.team_id.as_deref() == Some(team_id.as_str())
                && player.squad_role == SquadRole::Senior
                && !player.retired
                && player.injury.is_none()
                && under_21(&player.date_of_birth, game.clock.current_date.date_naive())
        })
        .map(|player| player.id.clone())
        .collect();
    if !youth_match_ready(academy_ids.len(), senior_u21_ids.len()) {
        return;
    }
    let id = format!("academy_challenge_{team_id}_{month}");
    if crate::inbox::already_emitted(game, &id) {
        return;
    }
    let lineup: Vec<String> = academy_ids
        .iter()
        .chain(senior_u21_ids.iter().take(2))
        .cloned()
        .collect();
    let strength = lineup
        .iter()
        .filter_map(|id| game.players.iter().find(|player| &player.id == id))
        .map(|player| u32::from(player.ovr))
        .sum::<u32>()
        / YOUTH_MATCHDAY_MINIMUM as u32;
    let opponent = 55 + (year as u32 + game.clock.current_date.month() * 7) % 25;
    let result_key = if strength > opponent + 3 {
        "be.msg.academyFixture.win"
    } else if strength + 3 < opponent {
        "be.msg.academyFixture.loss"
    } else {
        "be.msg.academyFixture.draw"
    };
    // A small coaching reward for actual match exposure. Do not add these
    // appearances to senior player stats or change the youth/first-team role.
    for player in game
        .players
        .iter_mut()
        .filter(|player| academy_ids.contains(&player.id))
    {
        if player.potential > player.ovr {
            player.attributes.teamwork = player.attributes.teamwork.saturating_add(1).min(99);
            player.attributes.decisions = player.attributes.decisions.saturating_add(1).min(99);
            refresh_player_derived(player, year as u32);
        }
        player.morale = player.morale.saturating_add(2).min(100);
    }
    let params = HashMap::from([
        ("count".to_string(), lineup.len().to_string()),
        ("rating".to_string(), strength.to_string()),
    ]);
    crate::inbox::emit_once(game, &id, || {
        InboxMessage::new(
            id.clone(),
            String::new(),
            String::new(),
            String::new(),
            date,
        )
        .with_category(MessageCategory::Training)
        .with_priority(MessagePriority::Normal)
        .with_action(MessageAction {
            id: "ack".to_string(),
            label: String::new(),
            action_type: ActionType::Acknowledge,
            resolved: false,
            label_key: Some("be.msg.event.ack".to_string()),
        })
        .with_context(MessageContext {
            team_id: Some(team_id),
            ..Default::default()
        })
        .with_i18n("be.msg.academyFixture.subject", result_key, params)
        .with_sender_i18n("be.sender.youthCoach", "be.role.youthCoach")
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn age_rule_counts_under_21_seniors() {
        assert!(under_21(
            "2007-04-12",
            NaiveDate::from_ymd_opt(2026, 4, 11).unwrap()
        ));
        assert!(!under_21(
            "2000-04-12",
            NaiveDate::from_ymd_opt(2026, 4, 11).unwrap()
        ));
    }

    #[test]
    fn eligibility_uses_the_birthday_and_rejects_invalid_dates() {
        let date = NaiveDate::from_ymd_opt(2026, 4, 11).unwrap();
        assert!(under_21("2005-04-12", date));
        assert!(!under_21("2005-04-11", date));
        assert!(!under_21("2027-01-01", date));
        assert!(!under_21("2007-99-99", date));
    }

    #[test]
    fn retired_players_cannot_fill_an_academy_match_place() {
        use crate::clock::GameClock;
        use chrono::{TimeZone, Utc};
        use domain::{
            manager::Manager,
            player::{Player, PlayerAttributes, Position},
        };
        let mut game = Game::new(
            GameClock::new(Utc.with_ymd_and_hms(2026, 7, 15, 0, 0, 0).unwrap()),
            Manager::new(
                "mgr".into(),
                "Alex".into(),
                "Boss".into(),
                "1980-01-01".into(),
                "England".into(),
            ),
            vec![],
            vec![],
            vec![],
            vec![],
        );
        game.manager.team_id = Some("club".into());
        for idx in 0..14 {
            let mut player = Player::new(
                idx.to_string(),
                "Player".into(),
                "Player".into(),
                "2008-01-01".into(),
                "England".into(),
                Position::Forward,
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
            player.squad_role = if idx < 12 {
                SquadRole::Youth
            } else {
                SquadRole::Senior
            };
            game.players.push(player);
        }
        game.players[0].retired = true;
        process_youth_fixture(&mut game);
        assert!(game.messages.is_empty());
        game.players[0].retired = false;
        game.players[13].retired = true;
        process_youth_fixture(&mut game);
        assert!(game.messages.is_empty());
        game.players[13].retired = false;
        process_youth_fixture(&mut game);
        assert_eq!(game.messages.len(), 1);
    }

    #[test]
    fn youth_fixture_needs_twelve_academy_players_and_two_u21_seniors() {
        assert!(!youth_match_ready(11, 3));
        assert!(!youth_match_ready(12, 1));
        assert!(youth_match_ready(12, 2));
    }
}
