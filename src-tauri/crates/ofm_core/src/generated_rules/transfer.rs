pub fn spendable_budget(total: i64) -> i64 {
    total.max(0) * 85 / 100
}
