//! Shared bounded shot probabilities for live and background matches.

fn finite_or(value: f64, fallback: f64) -> f64 {
    if value.is_finite() { value } else { fallback }
}

pub(crate) fn accuracy(base: f64, skill: f64) -> f64 {
    (finite_or(base, 0.35) + (finite_or(skill, 50.0) - 50.0) / 200.0).clamp(0.15, 0.85)
}

pub(crate) fn conversion(base: f64, shooter: f64, keeper: f64, shape: f64) -> f64 {
    (finite_or(base, 0.36) * finite_or(shape, 1.0).clamp(0.5, 1.5)
        + (finite_or(shooter, 50.0) - finite_or(keeper, 50.0)) / 150.0)
        .clamp(0.10, 0.70)
}

pub(crate) fn penalty_conversion(shooter:f64,keeper:f64) -> f64 {
    (0.75+(finite_or(shooter,50.0)-finite_or(keeper,50.0))/300.0).clamp(0.55,0.92)
}

pub(crate) fn expected_goals(accuracy: f64, conversion: f64) -> f64 {
    finite_or(accuracy, 0.0).clamp(0.0, 1.0) * finite_or(conversion, 0.0).clamp(0.0, 1.0)
}

pub(crate) fn contest_probability(attack: f64, defense: f64) -> f64 {
    let attack = finite_or(attack, 0.0).max(0.0);
    let defense = finite_or(defense, 0.0).max(0.0);
    if attack + defense <= f64::EPSILON {
        0.5
    } else {
        attack / (attack + defense)
    }
}

pub(crate) fn goal_context(own: u8, opponent: u8) -> crate::event::GoalContext {
    use crate::event::GoalContext;
    if own == 0 && opponent == 0 {
        GoalContext::Opener
    } else if own.saturating_add(1) == opponent {
        GoalContext::Equaliser
    } else if own >= opponent {
        GoalContext::Extends
    } else {
        GoalContext::Consolation
    }
}

pub(crate) fn save_difficulty(xg: f64) -> crate::event::SaveQuality {
    use crate::event::SaveQuality;
    if xg >= 0.30 {
        SaveQuality::WorldClass
    } else if xg >= 0.15 {
        SaveQuality::Strong
    } else {
        SaveQuality::Routine
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn penalty_probability_cannot_be_poisoned_by_invalid_skills() { assert!(penalty_conversion(f64::NAN,f64::INFINITY).is_finite()); }
    #[test]
    fn penalty_keeper_ability_reduces_conversion() { assert!(penalty_conversion(70.0,90.0)<penalty_conversion(70.0,30.0)); }
    #[test]
    fn accuracy_rewards_finishing() {
        assert!(accuracy(0.35, 90.0) > accuracy(0.35, 30.0));
    }
    #[test]
    fn accuracy_cannot_guarantee_a_goal() {
        assert_eq!(accuracy(5.0, 200.0), 0.85);
    }
    #[test]
    fn accuracy_keeps_weak_players_in_the_game() {
        assert_eq!(accuracy(-5.0, 0.0), 0.15);
    }
    #[test]
    fn invalid_accuracy_uses_safe_default() {
        assert!(accuracy(f64::NAN, f64::NAN).is_finite());
    }
    #[test]
    fn keeper_quality_reduces_conversion() {
        assert!(conversion(0.36, 70.0, 30.0, 1.0) > conversion(0.36, 70.0, 90.0, 1.0));
    }
    #[test]
    fn conversion_respects_defensive_shape() {
        assert!(conversion(0.36, 60.0, 60.0, 0.9) < conversion(0.36, 60.0, 60.0, 1.1));
    }
    #[test]
    fn conversion_is_bounded() {
        assert_eq!(conversion(10.0, 999.0, 0.0, 10.0), 0.70);
    }
    #[test]
    fn invalid_conversion_cannot_poison_a_match() {
        assert!(conversion(f64::NAN, f64::INFINITY, 0.0, 1.0).is_finite());
    }
    #[test]
    fn xg_is_unconditional_probability() {
        assert!((expected_goals(0.4, 0.5) - 0.2).abs() < 1e-9);
    }
    #[test]
    fn xg_rejects_invalid_inputs() {
        assert_eq!(expected_goals(f64::NAN, 0.5), 0.0);
    }
    #[test]
    fn empty_contest_has_fair_possession() {
        assert_eq!(contest_probability(0.0, 0.0), 0.5);
    }
    #[test]
    fn contest_never_emits_nan() {
        assert_eq!(contest_probability(f64::NAN, 0.0), 0.5);
    }
    #[test]
    fn contest_rewards_superior_midfield() {
        assert!(contest_probability(80.0, 40.0) > 0.5);
    }
    #[test]
    fn goal_context_identifies_equaliser() {
        assert_eq!(goal_context(0, 1), crate::event::GoalContext::Equaliser);
    }
    #[test]
    fn goal_context_does_not_call_a_winner_consolation() {
        assert_eq!(goal_context(1, 1), crate::event::GoalContext::Extends);
    }
    #[test]
    fn goal_context_identifies_first_goal() {
        assert_eq!(goal_context(0, 0), crate::event::GoalContext::Opener);
    }
    #[test]
    fn save_difficulty_follows_chance() {
        assert_eq!(save_difficulty(0.4), crate::event::SaveQuality::WorldClass);
    }
    #[test]
    fn routine_save_is_not_called_world_class() {
        assert_eq!(save_difficulty(0.05), crate::event::SaveQuality::Routine);
    }
}
