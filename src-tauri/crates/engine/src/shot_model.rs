//! Shared bounded shot probabilities for live and background matches.

fn finite_or(value: f64, fallback: f64) -> f64 { if value.is_finite() { value } else { fallback } }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn accuracy_rewards_finishing() { assert!(accuracy(0.35, 90.0) > accuracy(0.35, 30.0)); }
    #[test]
    fn accuracy_cannot_guarantee_a_goal() { assert_eq!(accuracy(5.0, 200.0), 0.85); }
    #[test]
    fn accuracy_keeps_weak_players_in_the_game() { assert_eq!(accuracy(-5.0, 0.0), 0.15); }
    #[test]
    fn invalid_accuracy_uses_safe_default() { assert!(accuracy(f64::NAN, f64::NAN).is_finite()); }
    #[test]
    fn keeper_quality_reduces_conversion() { assert!(conversion(0.36, 70.0, 30.0, 1.0) > conversion(0.36, 70.0, 90.0, 1.0)); }
    #[test]
    fn conversion_respects_defensive_shape() { assert!(conversion(0.36, 60.0, 60.0, 0.9) < conversion(0.36, 60.0, 60.0, 1.1)); }
    #[test]
    fn conversion_is_bounded() { assert_eq!(conversion(10.0, 999.0, 0.0, 10.0), 0.70); }
    #[test]
    fn invalid_conversion_cannot_poison_a_match() { assert!(conversion(f64::NAN, f64::INFINITY, 0.0, 1.0).is_finite()); }
    #[test]
    fn xg_is_unconditional_probability() { assert!((expected_goals(0.4, 0.5) - 0.2).abs() < 1e-9); }
    #[test]
    fn xg_rejects_invalid_inputs() { assert_eq!(expected_goals(f64::NAN, 0.5), 0.0); }
    #[test]
    fn empty_contest_has_fair_possession() { assert_eq!(contest_probability(0.0, 0.0), 0.5); }
    #[test]
    fn contest_never_emits_nan() { assert_eq!(contest_probability(f64::NAN, 0.0), 0.5); }
    #[test]
    fn contest_rewards_superior_midfield() { assert!(contest_probability(80.0, 40.0) > 0.5); }
    #[test]
    fn goal_context_identifies_equaliser() { assert_eq!(goal_context(0, 1), crate::event::GoalContext::Equaliser); }
    #[test]
    fn goal_context_does_not_call_a_winner_consolation() { assert_eq!(goal_context(1, 1), crate::event::GoalContext::Extends); }
    #[test]
    fn goal_context_identifies_first_goal() { assert_eq!(goal_context(0, 0), crate::event::GoalContext::Opener); }
    #[test]
    fn save_difficulty_follows_chance() { assert_eq!(save_difficulty(0.4), crate::event::SaveQuality::WorldClass); }
    #[test]
    fn routine_save_is_not_called_world_class() { assert_eq!(save_difficulty(0.05), crate::event::SaveQuality::Routine); }
}
