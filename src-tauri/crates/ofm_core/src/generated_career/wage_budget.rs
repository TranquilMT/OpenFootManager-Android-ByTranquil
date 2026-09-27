pub fn wage_room(budget: i64, current: i64) -> i64 {
    budget.saturating_sub(current).max(0)
}
pub fn sustainable_offer(room: i64, current_highest: i64) -> i64 {
    room.min((current_highest * 125 / 100).max(500))
}
