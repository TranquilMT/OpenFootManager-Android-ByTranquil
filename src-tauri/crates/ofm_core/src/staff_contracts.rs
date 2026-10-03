//! Staff salaries are annual euros, like player salaries. Hiring is a payroll
//! commitment; only wages actually paid and severance enter season expenses.
use crate::game::Game;
use domain::staff::{Staff, StaffRole};

pub fn annual_market_wage(staff: &Staff) -> u32 {
    let quality = match staff.role {
        StaffRole::AssistantManager | StaffRole::Coach => staff.attributes.coaching,
        StaffRole::Scout => (u16::from(staff.attributes.judging_ability)
            + u16::from(staff.attributes.judging_potential))
        .div_ceil(2) as u8,
        StaffRole::Physio => staff.attributes.physiotherapy,
    }
    .min(100);
    let role_pct = match staff.role {
        StaffRole::AssistantManager => 150,
        StaffRole::Coach => 100,
        StaffRole::Scout => 90,
        StaffRole::Physio => 90,
    };
    ((20_000 + u32::from(quality).pow(3) / 3) * role_pct / 100).clamp(12_000, 600_000)
}

pub fn hire(game: &mut Game, team_id: &str, staff_id: &str) -> Result<(), String> {
    let index = game
        .staff
        .iter()
        .position(|s| s.id == staff_id)
        .ok_or("be.error.staffMemberNotFound")?;
    if game.staff[index].team_id.is_some() {
        return Err("be.error.staffMemberAlreadyEmployed".into());
    }
    let team = game
        .teams
        .iter()
        .find(|t| t.id == team_id)
        .ok_or("be.error.teamNotFound")?;
    let wage = if game.staff[index].wage == 0 {
        annual_market_wage(&game.staff[index])
    } else {
        game.staff[index].wage
    };
    let bill = crate::finances::calc_annual_wages(game, team_id);
    if !crate::contract_wage_policy::wage_policy_allows_projection(
        team,
        bill,
        bill + i64::from(wage),
    ) {
        return Err(crate::contract_wage_policy::renewal_wage_policy_error_message(team));
    }
    if team.finance < i64::from(wage) * 4 / 52 {
        return Err("be.error.transfers.insufficientFunds".into());
    }
    let end = game.clock.current_date.date_naive() + chrono::Months::new(24);
    let staff = &mut game.staff[index];
    staff.wage = wage;
    staff.contract_end = Some(end.to_string());
    staff.team_id = Some(team_id.into());
    Ok(())
}

pub fn release(game: &mut Game, team_id: &str, staff_id: &str) -> Result<(), String> {
    let index = game
        .staff
        .iter()
        .position(|s| s.id == staff_id)
        .ok_or("be.error.staffMemberNotFound")?;
    if game.staff[index].team_id.as_deref() != Some(team_id) {
        return Err("be.error.staffMemberNotInTeam".into());
    }
    let team = game
        .teams
        .iter()
        .find(|t| t.id == team_id)
        .ok_or("be.error.teamNotFound")?;
    let today = game.clock.current_date.date_naive();
    let compensation = termination_cost(game, team_id, staff_id)?;
    if team.finance < compensation {
        return Err("be.error.transfers.insufficientFunds".into());
    }
    crate::finances::post(
        game,
        team_id,
        -compensation,
        crate::finances::CashKind::ContractTermination,
        today,
    )?;
    game.staff[index].team_id = None;
    game.staff[index].contract_end = None;
    Ok(())
}

pub(crate) fn initialize_generated(staff: &mut Staff, opening_year: u32) {
    staff.wage = crate::staff_contracts::annual_market_wage(staff);
    staff.contract_end = Some(format!("{}-06-30", opening_year.saturating_add(2)));
}

pub fn termination_cost(game: &Game, team_id: &str, staff_id: &str) -> Result<i64, String> {
    let staff = game
        .staff
        .iter()
        .find(|s| s.id == staff_id)
        .ok_or("be.error.staffMemberNotFound")?;
    if staff.team_id.as_deref() != Some(team_id) {
        return Err("be.error.staffMemberNotInTeam".into());
    }
    let today = game.clock.current_date.date_naive();
    let days = staff
        .contract_end
        .as_deref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .map(|end| (end - today).num_days().max(0))
        .unwrap_or(28);
    Ok((i64::from(staff.wage) * days + 364) / 365)
}

#[cfg(test)]
mod balance_tests {
    use super::*;
    #[test]
    fn useful_staff_have_paid_quality_sensitive_contracts() {
        let mut staff = Staff::new(
            "s".into(),
            "A".into(),
            "Coach".into(),
            "1980-01-01".into(),
            StaffRole::Coach,
            domain::staff::StaffAttributes {
                coaching: 40,
                judging_ability: 40,
                judging_potential: 40,
                physiotherapy: 40,
            },
        );
        let ordinary = annual_market_wage(&staff);
        staff.attributes.coaching = 90;
        assert!(annual_market_wage(&staff) > ordinary * 3);
        assert!(annual_market_wage(&staff) / 52 < 12_000);
    }
}
