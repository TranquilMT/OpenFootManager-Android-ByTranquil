//! Shared bounded shot probabilities for live and background matches.

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn accuracy_rewards_finishing() { assert!(accuracy(0.35, 90.0) > accuracy(0.35, 30.0)); }
}
