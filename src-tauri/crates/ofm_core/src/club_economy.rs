//! Evidence-informed budgets for fictional squads, not copies of audited accounts.
//! Published turnover anchors scale; available cash and transfer envelopes are separate.
use crate::game::Game;
use domain::team::{ClubEconomy, KitPattern, Team};

pub fn english_home_identity(name: &str) -> Option<(&'static str, &'static str, KitPattern)> {
    use KitPattern::{HalfAndHalf, Solid, Stripes};
    Some(match name {
        "Manchester City" | "Coventry City" => ("#6CABDD", "#FFFFFF", Solid),
        "Manchester United" => ("#DA291C", "#FFFFFF", Solid),
        "Arsenal" => ("#EF0107", "#FFFFFF", Solid),
        "Liverpool" => ("#C8102E", "#FFFFFF", Solid),
        "Chelsea" => ("#034694", "#FFFFFF", Solid),
        "Newcastle United" => ("#FFFFFF", "#000000", Stripes),
        "Aston Villa" => ("#670E36", "#95BFE5", Solid),
        "Tottenham Hotspur" => ("#FFFFFF", "#132257", Solid),
        "Brighton & Hove Albion" => ("#0057B8", "#FFFFFF", Stripes),
        "Crystal Palace" => ("#1B458F", "#C4122E", HalfAndHalf),
        "Nottingham Forest" => ("#DD0000", "#FFFFFF", Solid),
        "Everton" | "Ipswich Town" => ("#003399", "#FFFFFF", Solid),
        "Brentford" | "Sunderland" | "Southampton" | "Sheffield United" | "Stoke City" => {
            ("#D20000", "#FFFFFF", Stripes)
        }
        "Bournemouth" => ("#DA291C", "#000000", Stripes),
        "Fulham" => ("#FFFFFF", "#000000", Solid),
        "Leeds United" => ("#FFFFFF", "#FFCD00", Solid),
        "Hull City" => ("#F18A00", "#000000", Stripes),
        "West Ham United" | "Burnley" => ("#7A263A", "#1BB1E7", Solid),
        "Wolverhampton Wanderers" => ("#FDB913", "#231F20", Solid),
        _ => return None,
    })
}

fn is_english(team: &Team) -> bool {
    matches!(team.country.as_str(), "GB" | "ENG" | "England") || team.football_nation == "ENG"
}

pub fn apply_home_identity(team: &mut Team) {
    if is_english(team)
        && let Some((primary, secondary, pattern)) = english_home_identity(&team.name)
    {
        team.colors.primary = primary.into();
        team.colors.secondary = secondary.into();
        team.kit_pattern = pattern;
    }
}

/// Latest verified published turnover (GBP millions). See docs/ECONOMY-0.6.5.md.
/// The remaining clubs use explicit game estimates, not invented public accounts.
fn reported_turnover_gbp(name: &str) -> Option<i64> {
    match name {
        "Manchester United" => Some(677_600_000),
        "Manchester City" => Some(694_094_000),
        "Liverpool" => Some(703_000_000),
        "Chelsea" => Some(490_900_000),
        "Tottenham Hotspur" => Some(565_300_000),
        "Newcastle United" => Some(335_300_000),
        "Aston Villa" => Some(378_100_000),
        "Crystal Palace" => Some(196_623_000),
        "Everton" => Some(196_700_000),
        "Brentford" => Some(173_100_000),
        _ => None,
    }
}

pub fn annual_revenue_anchor(team: &Team) -> i64 {
    if is_english(team) {
        if let Some(turnover) = reported_turnover_gbp(&team.name) {
            // Fixed game conversion, deliberately reproducible across saves.
            return turnover * 115 / 100;
        }
        if english_home_identity(&team.name).is_some() && team.reputation >= 690 {
            return match team.name.as_str() {
                "Arsenal" => 780_000_000, // estimate until audited source verified
                "Brighton & Hove Albion" => 250_000_000,
                "Leeds United" => 220_000_000,
                _ => 190_000_000,
            };
        }
    }
    match team.reputation {
        900.. => 500_000_000,
        800..=899 => 250_000_000,
        700..=799 => 100_000_000,
        600..=699 => 40_000_000,
        450..=599 => 12_000_000,
        300..=449 => 3_000_000,
        _ => 600_000,
    }
}

pub fn opening_cash(team: &Team) -> i64 {
    if is_english(team) && team.name == "Manchester United" {
        // £67.2m cash at 30 June 2026; not £677.6m annual turnover.
        67_200_000 * 115 / 100
    } else {
        annual_revenue_anchor(team) * 15 / 100
    }
}

/// Calibrate only newly generated contracts to the club's operating scale.
/// Existing negotiated salaries are never rewritten by career repair.
pub fn fit_generated_payroll(
    team: &Team,
    players: &mut [domain::player::Player],
    staff: &mut [domain::staff::Staff],
) {
    let payroll = players.iter().map(|p| i64::from(p.wage)).sum::<i64>()
        + staff.iter().map(|s| i64::from(s.wage)).sum::<i64>();
    let ceiling = annual_revenue_anchor(team) * 60 / 100;
    if payroll <= ceiling || payroll == 0 {
        return;
    }
    let scale = |wage: u32| {
        if wage == 0 {
            0
        } else {
            (i64::from(wage) * ceiling / payroll).max(1) as u32
        }
    };
    for player in players {
        player.wage = scale(player.wage);
    }
    for member in staff {
        member.wage = scale(member.wage);
    }
}

pub fn initialize_generated_club(team: &mut Team, annual_payroll: i64) {
    apply_home_identity(team);
    let revenue = annual_revenue_anchor(team);
    let income = revenue - expected_matchday_income(team).min(revenue * 30 / 100);
    // Fix this overhead at setup: subsequent expensive signings remain a cost.
    let cost = (revenue - annual_payroll - revenue * 3 / 100).max(revenue / 10);
    team.economy = ClubEconomy {
        version: 2,
        annual_operating_income: income,
        annual_operating_cost: cost,
    };
    team.transfer_budget = (team.finance * 45 / 100).min(revenue / 10);
    team.wage_budget = (annual_payroll * 115 / 100).max(revenue / 20);
}

/// Rank clubs within each domestic pyramid; cups do not count as divisions.
pub fn division_ranks(game: &Game) -> std::collections::HashMap<String, usize> {
    use domain::league::{CompetitionFormat, CompetitionScope, CompetitionType};
    let mut pyramids = std::collections::BTreeMap::<String, Vec<_>>::new();
    for league in &game.competitions {
        if league.scope == CompetitionScope::Domestic
            && league.kind == CompetitionType::League
            && league.rules.format == CompetitionFormat::LeagueTable
        {
            pyramids
                .entry(league.country_id.clone().unwrap_or_default())
                .or_default()
                .push(league);
        }
    }
    let mut ranks = std::collections::HashMap::new();
    for leagues in pyramids.values_mut() {
        leagues.sort_by_key(|league| league.priority);
        for (rank, league) in leagues.iter().enumerate() {
            for id in &league.participant_ids {
                ranks.insert(id.clone(), rank);
            }
        }
    }
    ranks
}

/// Update receipts and overhead on promotion/relegation, without creating cash
/// or rewriting signed salaries. Relegation requires genuine spending cuts.
pub fn apply_division_changes(game: &mut Game, before: &std::collections::HashMap<String, usize>) {
    let after = division_ranks(game);
    for team in &mut game.teams {
        if team.economy.version == 0 {
            continue;
        }
        let (Some(old), Some(new)) = (before.get(&team.id), after.get(&team.id)) else {
            continue;
        };
        if old == new {
            continue;
        }
        let (income_pct, cost_pct) = if new > old { (65, 85) } else { (150, 120) };
        team.economy.annual_operating_income =
            team.economy.annual_operating_income * income_pct / 100;
        team.economy.annual_operating_cost = team.economy.annual_operating_cost * cost_pct / 100;
        if new > old {
            team.wage_budget = team.wage_budget * 75 / 100;
        }
    }
}

/// One-time repair of standard generated careers. Preserve negotiated contracts,
/// results, purchases and journal history. Authored packages retain their data.
pub fn upgrade_generated_career(game: &mut Game) -> Result<(), String> {
    // The standard world includes these curated clubs. Tiny authored/custom
    // worlds must not silently receive standard-world finances.
    if !game
        .teams
        .iter()
        .any(|team| is_english(team) && english_home_identity(&team.name).is_some())
    {
        return Ok(());
    }
    let mut candidate = game.clone();
    upgrade_generated_career_inner(&mut candidate)?;
    upgrade_generated_staff_pay(&mut candidate);
    *game = candidate;
    Ok(())
}

fn upgrade_generated_career_inner(game: &mut Game) -> Result<(), String> {
    if !game.package_lockfile.is_empty() || game.emitted_events.contains("economy:0.6.5") {
        return Ok(());
    }
    let legacy = game.teams.iter().any(|team| team.economy.version == 0);
    if legacy {
        use chrono::Datelike;
        let year = game.clock.current_date.year() as u32;
        for player in &mut game.players {
            let age = player
                .date_of_birth
                .get(..4)
                .and_then(|y| y.parse::<u32>().ok())
                .map(|birth| year.saturating_sub(birth))
                .unwrap_or(24)
                .min(99) as u8;
            let ovr = crate::player_rating::natural_ovr(player)
                .round()
                .clamp(1.0, 99.0) as u8;
            player.market_value =
                crate::generated_balance::market_value_eur(ovr, player.potential, age) as u64;
        }
        let ids: Vec<_> = game
            .teams
            .iter()
            .filter(|team| team.economy.version == 0)
            .map(|team| team.id.clone())
            .collect();
        for id in ids {
            let payroll = crate::finances::calc_annual_wages(game, &id);
            let index = game
                .teams
                .iter()
                .position(|team| team.id == id)
                .expect("existing club");
            let old_transfer = game.teams[index].transfer_budget;
            let original_opening = game
                .cash_journal
                .iter()
                .find(|p| p.club_id == id && p.kind == domain::finance::CashKind::OpeningBalance)
                .map(|p| p.amount)
                .unwrap_or(game.teams[index].finance);
            let grant = (opening_cash(&game.teams[index]) - original_opening).max(0);
            initialize_generated_club(&mut game.teams[index], payroll);
            // Add the missing opening allocation, without refunding past spending.
            game.teams[index].transfer_budget = old_transfer.saturating_add(grant * 45 / 100);
            crate::finances::journal::post(
                game,
                id,
                grant,
                domain::finance::CashKind::BoardSupport,
                game.clock.current_date.date_naive(),
            )?;
        }
    }
    game.emitted_events.insert("economy:0.6.5".into());
    Ok(())
}

/// Standard old saves had generated staff with no salary. Bring that payroll
/// into the explicit wage bill, moving its cost out of already-calibrated
/// overhead. Preserve cash, paid contracts, authored packages and history.
fn upgrade_generated_staff_pay(game: &mut Game) {
    if !game.package_lockfile.is_empty() || game.emitted_events.contains("economy:0.6.7") {
        return;
    }
    use chrono::Datelike;
    for team in &mut game.teams {
        if team.economy.version == 0 {
            continue;
        }
        if team.economy.version == 1 {
            // Keep promotion/relegation scaling by deriving the current anchor
            // from existing receipts, rather than resetting to opening turnover.
            let revenue = team.economy.annual_operating_income * 100 / 85;
            team.economy.annual_operating_income =
                revenue - expected_matchday_income(team).min(revenue * 30 / 100);
            team.economy.annual_operating_cost += revenue * 15 / 100;
            team.economy.version = 2;
        }
        let zero_staff: Vec<_> = game
            .staff
            .iter()
            .enumerate()
            .filter(|(_, s)| s.team_id.as_deref() == Some(&team.id) && s.wage == 0)
            .map(|(index, s)| (index, crate::staff_contracts::annual_market_wage(s)))
            .collect();
        let quoted = zero_staff
            .iter()
            .map(|(_, wage)| i64::from(*wage))
            .sum::<i64>();
        let ceiling = annual_revenue_anchor(team) / 50;
        let mut additional = 0;
        for (index, wage) in zero_staff {
            let wage = if quoted > ceiling {
                (i64::from(wage) * ceiling / quoted).max(1) as u32
            } else {
                wage
            };
            game.staff[index].wage = wage;
            game.staff[index].contract_end =
                Some(format!("{}-06-30", game.clock.current_date.year() + 2));
            additional += i64::from(wage);
        }
        team.economy.annual_operating_cost = team
            .economy
            .annual_operating_cost
            .saturating_sub(additional)
            .max(0);
    }
    for staff in &mut game.staff {
        if staff.team_id.is_none() && staff.wage == 0 {
            staff.wage = crate::staff_contracts::annual_market_wage(staff);
        }
    }
    game.emitted_events.insert("economy:0.6.7".into());
}

fn expected_matchday_income(team: &Team) -> i64 {
    crate::finances::calc_matchday(
        team.stadium_capacity,
        19,
        crate::finances::match_attendance(team),
        crate::finances::match_ticket_price(team),
    )
}

#[cfg(test)]
pub(crate) fn opening_operating_surplus(team: &Team, annual_payroll: i64) -> i64 {
    team.economy.annual_operating_income + expected_matchday_income(team)
        - annual_payroll
        - team.economy.annual_operating_cost
}

#[cfg(test)]
mod tests {
    use super::*;
    fn club(name: &str, rep: u32) -> Team {
        let mut team = Team::new(
            "test".into(),
            name.into(),
            "TST".into(),
            "GB".into(),
            "Manchester".into(),
            "Stadium".into(),
            50_000,
        );
        team.reputation = rep;
        team.finance = 6_700_000;
        team
    }
    #[test]
    fn united_cash_is_separate_from_turnover_and_wages_fit() {
        let mut team = club("Manchester United", 910);
        team.finance = opening_cash(&team);
        initialize_generated_club(&mut team, 250_000_000);
        assert_eq!(team.finance, 77_280_000);
        assert!(team.wage_budget > 250_000_000);
        assert!(team.transfer_budget < team.finance);
        assert!(
            team.economy.annual_operating_income + expected_matchday_income(&team)
                - team.economy.annual_operating_cost
                >= 250_000_000
        );
    }
    #[test]
    fn premier_club_identities_are_stable() {
        let mut team = club("Manchester City", 940);
        apply_home_identity(&mut team);
        assert_eq!(team.colors.primary, "#6CABDD");
        assert_eq!(
            english_home_identity("Newcastle United").unwrap().2,
            KitPattern::Stripes
        );
        assert_eq!(english_home_identity("Aston Villa").unwrap().0, "#670E36");
    }
    #[test]
    fn stadium_size_cannot_inflate_opening_operating_surplus() {
        for (rep, capacity) in [
            (100, 12_000),
            (350, 40_000),
            (500, 65_000),
            (750, 90_000),
            (900, 90_000),
        ] {
            let mut team = club("Balance FC", rep);
            team.stadium_capacity = capacity;
            let revenue = annual_revenue_anchor(&team);
            let payroll = revenue / 2;
            initialize_generated_club(&mut team, payroll);
            let home_income = expected_matchday_income(&team);
            assert!(home_income <= revenue * 30 / 100);
            assert!((opening_operating_surplus(&team, payroll) - revenue * 3 / 100).abs() <= 19);
        }
    }

    #[test]
    fn smaller_clubs_keep_smaller_budgets() {
        let mut elite = club("Manchester United", 910);
        let mut lower = club("Fictional FC", 400);
        lower.finance = 100_000;
        initialize_generated_club(&mut elite, 250_000_000);
        initialize_generated_club(&mut lower, 1_000_000);
        assert!(elite.finance > lower.finance * 20);
        assert!(elite.transfer_budget > lower.transfer_budget * 20);
    }
    fn career() -> Game {
        use chrono::TimeZone;
        let date = chrono::Utc.with_ymd_and_hms(2026, 7, 6, 12, 0, 0).unwrap();
        let manager = domain::manager::Manager::new(
            "m".into(),
            "Will".into(),
            "Test".into(),
            "1980-01-01".into(),
            "GB".into(),
        );
        Game::new(
            crate::clock::GameClock::new(date),
            manager,
            vec![club("Manchester United", 910)],
            vec![],
            vec![],
            vec![],
        )
    }
    #[test]
    fn legacy_repair_is_once_and_preserves_spending_and_journal() {
        let mut game = career();
        let date = game.clock.current_date.date_naive();
        crate::finances::post(
            &mut game,
            "test",
            -2_000_000,
            domain::finance::CashKind::TransferFeeOut,
            date,
        )
        .unwrap();
        let wages = game.players.iter().map(|p| p.wage).collect::<Vec<_>>();
        upgrade_generated_career(&mut game).unwrap();
        assert_eq!(game.teams[0].finance, 75_280_000);
        assert!(crate::finances::journal_matches_cash(&game));
        assert_eq!(
            wages,
            game.players.iter().map(|p| p.wage).collect::<Vec<_>>()
        );
        let balance = game.teams[0].finance;
        let entries = game.cash_journal.len();
        let journal = game.cash_journal.clone();
        let saved = serde_json::to_string(&game).unwrap();
        let mut loaded: Game = serde_json::from_str(&saved).unwrap();
        // Journal rows are deliberately skipped by IPC serde and restored by SQL.
        loaded.cash_journal = journal;
        upgrade_generated_career(&mut loaded).unwrap();
        assert_eq!(loaded.teams[0].finance, balance);
        assert_eq!(loaded.cash_journal.len(), entries);
        assert_eq!(loaded.teams[0].economy, game.teams[0].economy);
    }
    #[test]
    fn forecast_matches_26_week_actual_cash_flow_and_signings_have_a_cost() {
        let mut game = career();
        game.teams[0].finance = opening_cash(&game.teams[0]);
        initialize_generated_club(&mut game.teams[0], 0);
        let initial = game.teams[0].finance;
        let snapshot = crate::finances::team_finance_snapshot(&game, "test").unwrap();
        for _ in 0..26 {
            game.clock.advance_days(7);
            crate::finances::process_weekly_finances(&mut game);
        }
        assert_eq!(
            game.teams[0].finance,
            initial + snapshot.projected_weekly_net * 26
        );
        assert!(crate::finances::journal_matches_cash(&game));
        assert!(game.teams[0].finance > 0);
        let overhead = game.teams[0].economy.annual_operating_cost;
        let mut p = domain::player::Player::new(
            "p".into(),
            "Star".into(),
            "Signing".into(),
            "2000-01-01".into(),
            "GB".into(),
            domain::player::Position::Striker,
            domain::player::PlayerAttributes {
                pace: 80,
                stamina: 80,
                strength: 80,
                agility: 80,
                passing: 80,
                shooting: 80,
                tackling: 80,
                dribbling: 80,
                defending: 80,
                positioning: 80,
                vision: 80,
                decisions: 80,
                composure: 80,
                aggression: 80,
                teamwork: 80,
                leadership: 80,
                handling: 80,
                reflexes: 80,
                aerial: 80,
            },
        );
        p.team_id = Some("test".into());
        p.wage = 10_400_000;
        game.players.push(p);
        let after = crate::finances::team_finance_snapshot(&game, "test").unwrap();
        assert_eq!(
            snapshot.projected_weekly_net - after.projected_weekly_net,
            200_000
        );
        assert_eq!(game.teams[0].economy.annual_operating_cost, overhead);
    }
    #[test]
    fn established_clubs_open_with_sponsorship_already_in_turnover() {
        let mut team = club("Manchester United", 900);
        let revenue = annual_revenue_anchor(&team);
        initialize_generated_club(&mut team, revenue / 2);
        let sponsor = team.sponsorship.as_ref().expect("established club sponsor");
        assert!(sponsor.base_value > 100_000);
        assert!(sponsor.remaining_weeks >= 52);
        let total = team.economy.annual_operating_income + expected_matchday_income(&team) + sponsor.base_value * 52;
        assert!((total - revenue).abs() <= 52);
    }

}
