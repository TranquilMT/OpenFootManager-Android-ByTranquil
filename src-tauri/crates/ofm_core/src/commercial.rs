//! Principal sponsorships and schedule-aware opening budgets for generated careers.
//! Sponsorship replaces an existing turnover component; it never creates cash.
use crate::game::Game;
use domain::league::{CompetitionScope, CompetitionType};
use domain::team::{Sponsorship, Team};

/// Fictional partners and conservative 3–8% turnover shares, not actual deals.
pub fn seed_principal_sponsor(team: &mut Team, revenue: i64) -> bool {
    if team.reputation < 300 || team.sponsorship.is_some() || revenue <= 0 {
        return false;
    }
    let share = match team.reputation {
        900.. => 8,
        800..=899 => 7,
        700..=799 => 6,
        600..=699 => 5,
        450..=599 => 4,
        _ => 3,
    };
    let names = [
        "Meridian Group",
        "Summit Mobility",
        "Atlas Communications",
        "Horizon Energy",
        "Northstar Digital",
        "Vertex Industries",
        "Beacon Travel",
        "Crescent Logistics",
    ];
    let identity = team
        .id
        .bytes()
        .fold(0usize, |sum, byte| sum.wrapping_add(usize::from(byte)));
    team.sponsorship = Some(Sponsorship {
        auto_renew: true,
        sponsor_name: names[identity % names.len()].into(),
        base_value: (revenue / 100 * share / 52).max(1),
        remaining_weeks: 104 + (identity % 53) as u32,
        bonus_criteria: vec![],
    });
    true
}

/// Called only after this club's atomic weekly journal batch succeeds.
pub fn expire_weekly_sponsor(team: &mut Team) {
    if let Some(sponsorship) = team.sponsorship.as_mut() {
        sponsorship.remaining_weeks = sponsorship.remaining_weeks.saturating_sub(1);
        if sponsorship.remaining_weeks == 0 {
            if sponsorship.auto_renew {
                sponsorship.remaining_weeks = 52;
            } else {
                team.sponsorship = None;
            }
        }
    }
}

/// A one-time, cash-neutral repair for the standard world. Authored worlds and
/// existing negotiated sponsorships keep their contracts. Saves remain idempotent.
pub fn polish_generated_career(game: &mut Game) {
    if !game.package_lockfile.is_empty()
        || game.emitted_events.contains("world:authored")
        || game.emitted_events.contains("economy:0.6.8")
        || !game
            .teams
            .iter()
            .any(|team| crate::club_economy::english_home_identity(&team.name).is_some())
    {
        return;
    }
    for team in &mut game.teams {
        if team.economy.version == 0 || team.economy.version >= 3 {
            continue;
        }
        let per_gate = crate::finances::calc_matchday(
            team.stadium_capacity,
            1,
            crate::finances::match_attendance(team),
            crate::finances::match_ticket_price(team),
        );
        // Preserve the current division scale instead of resetting promoted or
        // relegated clubs to their original turnover anchor.
        let revenue = team
            .economy
            .annual_operating_income
            .saturating_add(per_gate * 19);
        if seed_principal_sponsor(team, revenue) {
            let annual = team.sponsorship.as_ref().map_or(0, |s| s.base_value * 52);
            team.economy.annual_operating_income = team
                .economy
                .annual_operating_income
                .saturating_sub(annual)
                .max(0);
        }
        let home_matches = game
            .competitions
            .iter()
            .filter(|league| {
                league.scope == CompetitionScope::Domestic
                    && league.kind == CompetitionType::League
                    && league.participant_ids.contains(&team.id)
            })
            .max_by_key(|league| league.season)
            .map(|league| {
                league
                    .fixtures
                    .iter()
                    .filter(|fixture| fixture.home_team_id == team.id)
                    .count()
            })
            .filter(|count| *count > 0);
        if let Some(home_matches) = home_matches {
            team.economy.annual_operating_income = team
                .economy
                .annual_operating_income
                .saturating_add(per_gate * (19 - home_matches as i64))
                .max(0);
        }
        team.economy.version = 3;
        let mut squad: Vec<_> = game
            .players
            .iter()
            .filter(|p| p.team_id.as_deref() == Some(&team.id))
            .cloned()
            .collect();
        crate::roster::normalize_club_numbers(&mut squad);
        for registered in squad {
            if let Some(player) = game.players.iter_mut().find(|p| p.id == registered.id) {
                player.jersey_number = registered.jersey_number;
            }
        }
        // Offers emitted before migration cannot replace the newly visible deal.
        if team
            .sponsorship
            .as_ref()
            .is_some_and(|s| s.remaining_weeks > 0)
            && game.manager.team_id.as_deref() == Some(&team.id)
        {
            for message in game
                .messages
                .iter_mut()
                .filter(|m| m.id.starts_with("sponsor_"))
            {
                for action in &mut message.actions {
                    action.resolved = true;
                }
            }
        }
    }
    game.emitted_events.insert("world:generated".into());
    game.emitted_events.insert("economy:0.6.8".into());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::clock::GameClock;
    use chrono::{TimeZone, Utc};
    use domain::manager::Manager;

    fn club(rep: u32) -> Team {
        let mut team = Team::new(
            "club".into(),
            "Manchester United".into(),
            "MUN".into(),
            "ENG".into(),
            "Manchester".into(),
            "Ground".into(),
            40_000,
        );
        team.reputation = rep;
        team
    }

    #[test]
    fn sponsorship_scales_and_does_not_overwrite_negotiated_deals() {
        let mut small = club(350);
        let mut big = club(900);
        assert!(seed_principal_sponsor(&mut small, 3_000_000));
        assert!(seed_principal_sponsor(&mut big, 500_000_000));
        assert!(
            big.sponsorship.as_ref().unwrap().base_value
                > small.sponsorship.as_ref().unwrap().base_value * 100
        );
        let previous = big.sponsorship.clone();
        assert!(!seed_principal_sponsor(&mut big, 1_000_000_000));
        assert_eq!(big.sponsorship, previous);
        assert!(!seed_principal_sponsor(&mut club(100), 600_000));
    }

    #[test]
    fn migration_preserves_cash_costs_and_repeated_saved_state() {
        let clock = GameClock::new(Utc.with_ymd_and_hms(2026, 8, 1, 12, 0, 0).unwrap());
        let manager = Manager::new(
            "manager".into(),
            "Test".into(),
            "Manager".into(),
            "1980-01-01".into(),
            "ENG".into(),
        );
        let mut team = club(900);
        team.finance = 10_000_000;
        team.economy.version = 2;
        team.economy.annual_operating_income = 400_000_000;
        team.economy.annual_operating_cost = 200_000_000;
        let mut game = Game::new(clock, manager, vec![team], vec![], vec![], vec![]);
        polish_generated_career(&mut game);
        assert_eq!(game.teams[0].finance, 10_000_000);
        assert_eq!(game.teams[0].economy.annual_operating_cost, 200_000_000);
        let sponsorship = game.teams[0].sponsorship.as_ref().unwrap();
        assert_eq!(
            game.teams[0].economy.annual_operating_income + sponsorship.base_value * 52,
            400_000_000
        );
        let saved = serde_json::to_string(&game).unwrap();
        let mut loaded: Game = serde_json::from_str(&saved).unwrap();
        polish_generated_career(&mut loaded);
        assert_eq!(serde_json::to_string(&loaded).unwrap(), saved);
    }
    #[test]
    fn smaller_league_budget_and_fresh_initialization_preserve_turnover() {
        use domain::league::{Fixture, League};
        let clock = GameClock::new(Utc.with_ymd_and_hms(2026, 8, 1, 12, 0, 0).unwrap());
        let manager = Manager::new(
            "manager".into(),
            "Test".into(),
            "Manager".into(),
            "1980-01-01".into(),
            "ENG".into(),
        );
        let mut team = club(350);
        team.name = "Manchester United".into();
        let revenue = crate::club_economy::annual_revenue_anchor(&team);
        crate::club_economy::initialize_generated_club(&mut team, revenue / 2);
        let mut game = Game::new(clock, manager, vec![team], vec![], vec![], vec![]);
        game.competitions.push(League {
            id: "domestic".into(),
            participant_ids: vec!["club".into()],
            fixtures: (0..7)
                .map(|i| Fixture {
                    id: format!("match-{i}"),
                    home_team_id: "club".into(),
                    ..Default::default()
                })
                .collect(),
            ..Default::default()
        });
        let before = game.teams[0].sponsorship.clone();
        polish_generated_career(&mut game);
        let team = &game.teams[0];
        let gates = crate::finances::calc_matchday(
            team.stadium_capacity,
            7,
            crate::finances::match_attendance(team),
            crate::finances::match_ticket_price(team),
        );
        assert_eq!(team.sponsorship, before);
        let total = team.economy.annual_operating_income
            + gates
            + team.sponsorship.as_ref().unwrap().base_value * 52;
        assert!((total - revenue).abs() <= 19);
        let corrected = game.teams[0].economy.clone();
        game.emitted_events.clear(); // Standalone world exports omit the event ledger.
        polish_generated_career(&mut game);
        assert_eq!(game.teams[0].economy, corrected);
    }

    #[test]
    fn old_sponsorship_json_does_not_auto_renew() {
        let sponsor: Sponsorship = serde_json::from_str(r#"{"sponsor_name":"Legacy","base_value":1000,"remaining_weeks":1,"bonus_criteria":[]}"#).unwrap();
        assert!(!sponsor.auto_renew);
        let mut team = club(900);
        team.sponsorship = Some(sponsor);
        expire_weekly_sponsor(&mut team);
        assert!(team.sponsorship.is_none());
    }

    #[test]
    fn explicitly_authored_world_retains_its_budget_and_sponsors() {
        let clock = GameClock::new(Utc.with_ymd_and_hms(2026, 8, 1, 12, 0, 0).unwrap());
        let manager = Manager::new(
            "manager".into(),
            "Test".into(),
            "Manager".into(),
            "1980-01-01".into(),
            "ENG".into(),
        );
        let mut team = club(900);
        team.economy.version = 2;
        team.economy.annual_operating_income = 400_000_000;
        let mut game = Game::new(clock, manager, vec![team], vec![], vec![], vec![]);
        game.emitted_events.insert("world:authored".into());
        polish_generated_career(&mut game);
        assert!(game.teams[0].sponsorship.is_none());
        assert_eq!(game.teams[0].economy.annual_operating_income, 400_000_000);
        assert_eq!(game.teams[0].economy.version, 2);
    }
}
