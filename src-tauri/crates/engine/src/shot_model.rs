//! Shared bounded shot probabilities for live and background matches.

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
}
