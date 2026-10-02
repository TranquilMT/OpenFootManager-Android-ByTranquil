//! Monthly progress records are career data, independent of the inbox.
use crate::game::Game;
use domain::player::PlayerDevelopmentSnapshot;

const MAX_REVIEWS: usize = 24;

fn record(history: &mut Vec<PlayerDevelopmentSnapshot>, review: PlayerDevelopmentSnapshot) {
    if history
        .last()
        .is_some_and(|last| last.date.get(..7) == review.date.get(..7))
    {
        return;
    }
    history.push(review);
    if history.len() > MAX_REVIEWS {
        history.drain(..history.len() - MAX_REVIEWS);
    }
}

pub fn record_managed_player_reviews(game: &mut Game) {
    let Some(team_id) = game.manager.team_id.as_deref() else {
        return;
    };
    let date = game.clock.current_date.format("%Y-%m-%d").to_string();
    let season = game
        .primary_competition()
        .map_or(0, |competition| competition.season);
    for player in &mut game.players {
        let managed = player.team_id.as_deref() == Some(team_id)
            || player
                .active_loan
                .as_ref()
                .is_some_and(|loan| loan.parent_team_id == team_id);
        if !managed || player.retired {
            continue;
        }
        record(
            &mut player.development_history,
            PlayerDevelopmentSnapshot {
                date: date.clone(),
                season,
                ovr: player.ovr,
                minutes_played: player.stats.minutes_played,
                focus: player.training_focus.clone(),
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn review(date: &str, ovr: u8) -> PlayerDevelopmentSnapshot {
        PlayerDevelopmentSnapshot {
            date: date.into(),
            season: 2026,
            ovr,
            minutes_played: 0,
            focus: None,
        }
    }
    #[test]
    fn repeated_days_do_not_replace_the_monthly_baseline() {
        let mut history = Vec::new();
        record(&mut history, review("2026-08-01", 65));
        record(&mut history, review("2026-08-15", 68));
        record(&mut history, review("2026-09-01", 69));
        assert_eq!(history.len(), 2);
        assert_eq!(history[0].ovr, 65);
        assert_eq!(history[1].ovr, 69);
    }
    #[test]
    fn long_careers_keep_a_bounded_history() {
        let mut history = Vec::new();
        for year in 2026..2030 {
            for month in 1..=12 {
                record(&mut history, review(&format!("{year}-{month:02}-01"), 65));
            }
        }
        assert_eq!(history.len(), MAX_REVIEWS);
        assert_eq!(history[0].date, "2028-01-01");
    }
}
