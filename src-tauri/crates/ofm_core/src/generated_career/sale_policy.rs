pub fn sale_score(age: u8, role: u8, months_left: u8, surplus: bool) -> u8 {
    let age_score = age.saturating_sub(28).saturating_mul(3);
    let role_score = role.saturating_mul(10);
    let contract = 24u8.saturating_sub(months_left.min(24));
    age_score
        .saturating_add(role_score)
        .saturating_add(contract)
        .saturating_add(if surplus { 25 } else { 0 })
        .min(100)
}
pub fn open_to_sale(score: u8) -> bool {
    score >= 50
}
