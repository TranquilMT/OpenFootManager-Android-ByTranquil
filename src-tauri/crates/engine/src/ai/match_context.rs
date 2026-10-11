use crate::event::EventType;
use crate::live_match::{MatchCommand, MatchSnapshot};
use crate::types::{
    BreakSpeed, CounterPressDuration, DefensiveLine, DefensiveShape, PressingIntensity, Side,
    TacticalInstruction, TacticsBuildUpStyle, Tempo,
};

/// React to clear match conditions, with a cooldown to avoid minute-by-minute oscillation.
pub(super) fn adjustments(snap: &MatchSnapshot, side: Side) -> Vec<MatchCommand> {
    let team = if side == Side::Home {
        &snap.home_team
    } else {
        &snap.away_team
    };
    let active: Vec<_> = team
        .players
        .iter()
        .filter(|p| !snap.sent_off.contains(&p.id))
        .collect();
    if active.is_empty() {
        return Vec::new();
    }
    let condition = active.iter().map(|p| p.condition as f64).sum::<f64>() / active.len() as f64;
    let exhausted = condition < 50.0;
    if !exhausted
        && snap.events.iter().rev().any(|e| {
            e.side == side
                && e.event_type == EventType::TacticalChange
                && snap.current_minute.saturating_sub(e.minute) < 8
        })
    {
        return Vec::new();
    }
    let goal_difference = if side == Side::Home {
        snap.home_score as i16 - snap.away_score as i16
    } else {
        snap.away_score as i16 - snap.home_score as i16
    };
    let opponent = if side == Side::Home {
        &snap.away_team
    } else {
        &snap.home_team
    };
    let opponent_count = opponent
        .players
        .iter()
        .filter(|p| !snap.sent_off.contains(&p.id))
        .count();
    let outnumbered = active.len() < opponent_count;
    let mut desired = Vec::new();
    if outnumbered {
        desired.push(TacticalInstruction::DefensiveShape(DefensiveShape::Compact));
        desired.push(TacticalInstruction::DefensiveLine(DefensiveLine::Low));
    }
    let passing = active.iter().map(|p| p.passing as f64).sum::<f64>() / active.len() as f64;
    if snap.current_minute >= 15
        && passing < 65.0
        && opponent.tactics.pressing_intensity == PressingIntensity::Aggressive
    {
        desired.push(TacticalInstruction::BuildUpStyle(TacticsBuildUpStyle::Long));
    }
    if exhausted {
        desired.push(TacticalInstruction::PressingIntensity(
            PressingIntensity::Passive,
        ));
        desired.push(TacticalInstruction::CounterPressDuration(
            CounterPressDuration::None,
        ));
    }
    if snap.current_minute >= 65 && goal_difference < 0 {
        desired.push(TacticalInstruction::Tempo(Tempo::Direct));
        desired.push(TacticalInstruction::BreakSpeed(BreakSpeed::Fast));
        if condition >= 55.0 && !outnumbered {
            desired.push(TacticalInstruction::PressingIntensity(
                PressingIntensity::Aggressive,
            ));
        }
    } else if snap.current_minute >= 75 && goal_difference > 0 {
        desired.push(TacticalInstruction::Tempo(Tempo::Patient));
        desired.push(TacticalInstruction::DefensiveShape(DefensiveShape::Compact));
        desired.push(TacticalInstruction::DefensiveLine(DefensiveLine::Low));
    }
    let mut tactics = team.tactics.clone();
    desired
        .into_iter()
        .filter_map(|instruction| {
            tactics
                .apply_instruction(instruction)
                .then_some(MatchCommand::ChangeTacticalInstruction { side, instruction })
        })
        .collect()
}
