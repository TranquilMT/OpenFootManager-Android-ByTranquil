use crate::game::Game;
use chrono::{Datelike, NaiveDate};
use domain::manager::{CareerMilestone, ManagerCareerStats};

pub(crate) fn record(stats: &mut ManagerCareerStats, milestone: CareerMilestone) {
    if !stats.milestones.iter().any(|old| old.id == milestone.id) {
        stats.milestones.push(milestone);
    }
}

fn update(stats: &mut ManagerCareerStats, start: &str, today: &str) {
    let date = stats.milestones_initialized.then(|| today.to_string());
    let years = NaiveDate::parse_from_str(start, "%Y-%m-%d")
        .ok()
        .zip(NaiveDate::parse_from_str(today, "%Y-%m-%d").ok())
        .map_or(0, |(start, current)| {
            let anniversary = NaiveDate::from_ymd_opt(current.year(), start.month(), start.day())
                .or_else(|| NaiveDate::from_ymd_opt(current.year(), 2, 28));
            let years = current.year()
                - start.year()
                - i32::from(anniversary.is_some_and(|day| current < day));
            years.max(0) as u32
        });
    for (kind, value, targets) in [
        (
            "matches",
            stats.matches_managed,
            &[10, 50, 100, 250, 500, 1000][..],
        ),
        ("wins", stats.wins, &[10, 50, 100, 250][..]),
        ("trophies", stats.trophies, &[1, 5, 10][..]),
        ("anniversary", years, &[1, 5, 10, 20][..]),
    ] {
        for threshold in targets
            .iter()
            .copied()
            .filter(|threshold| *threshold <= value)
        {
            record(
                stats,
                CareerMilestone {
                    id: format!("{kind}-{threshold}"),
                    kind: kind.into(),
                    value: threshold,
                    date: date.clone(),
                    context: None,
                },
            );
        }
    }
    stats.milestones_initialized = true;
}

pub fn refresh(game: &mut Game) {
    let start = game
        .manager
        .career_history
        .iter()
        .map(|entry| entry.start_date.as_str())
        .min()
        .map(str::to_owned)
        .unwrap_or_else(|| game.clock.start_date.format("%Y-%m-%d").to_string());
    let today = game.clock.current_date.format("%Y-%m-%d").to_string();
    update(&mut game.manager.career_stats, &start, &today);
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn legacy_milestones_have_no_invented_date_and_rewards_are_not_repeated() {
        let mut stats = ManagerCareerStats {
            matches_managed: 100,
            wins: 50,
            ..Default::default()
        };
        update(&mut stats, "2025-08-01", "2026-08-01");
        assert!(stats.milestones.iter().all(|entry| entry.date.is_none()));
        let count = stats.milestones.len();
        update(&mut stats, "2025-08-01", "2026-08-02");
        assert_eq!(stats.milestones.len(), count);
        stats.matches_managed = 250;
        update(&mut stats, "2025-08-01", "2026-08-03");
        assert_eq!(
            stats.milestones.last().unwrap().date.as_deref(),
            Some("2026-08-03")
        );
    }
    #[test]
    fn leap_day_anniversary_is_observed_on_february_28() {
        let mut stats = ManagerCareerStats {
            milestones_initialized: true,
            ..Default::default()
        };
        update(&mut stats, "2024-02-29", "2025-02-27");
        assert!(stats.milestones.is_empty());
        update(&mut stats, "2024-02-29", "2025-02-28");
        assert_eq!(stats.milestones[0].kind, "anniversary");
    }
}
