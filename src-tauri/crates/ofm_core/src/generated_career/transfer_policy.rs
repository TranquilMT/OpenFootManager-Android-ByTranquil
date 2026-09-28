pub fn spendable_budget(transfer_budget: i64, reserve_pct: u8) -> i64 {
    transfer_budget.saturating_mul((100 - reserve_pct.min(80)) as i64) / 100
}
pub fn max_bid(spendable: i64, squad_need: u8) -> i64 {
    spendable.saturating_mul((35 + squad_need.min(65)) as i64) / 100
}
