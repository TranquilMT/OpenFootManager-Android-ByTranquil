pub fn priority(fitness: u8, yellow: bool, losing: bool, attacking_role: bool) -> u8 {
    let fatigue = 100 - fitness.min(100);
    let card = if yellow { 15 } else { 0 };
    let state = if losing && attacking_role { 20 } else { 0 };
    fatigue.saturating_add(card).saturating_add(state).min(100)
}
pub fn should_sub(priority: u8) -> bool {
    priority >= 45
}
