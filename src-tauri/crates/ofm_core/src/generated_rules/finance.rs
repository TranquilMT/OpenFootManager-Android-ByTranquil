pub fn wage_room(weekly_income: i64, current_wages: i64) -> i64 {
    (weekly_income * 70 / 100 - current_wages).max(0)
}
