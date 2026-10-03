pub fn weekly_wage(ovr: u8, reputation: u8, role: u8) -> i64 {
    let role_pct = match role {
        0 => 115,
        1 => 105,
        2 => 100,
        3 => 85,
        _ => 70,
    };
    (crate::generated_balance::weekly_wage_eur(ovr, reputation) * role_pct / 100)
        .clamp(150, 450_000)
}
