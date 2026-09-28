pub fn valid_value(value: i64) -> bool {
    (10_000..=300_000_000).contains(&value)
}
pub fn valid_wage(wage: i64) -> bool {
    (50..=600_000).contains(&wage)
}
pub fn payroll_safe(payroll: i64, budget: i64) -> bool {
    payroll <= budget
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn payroll_cannot_exceed_budget() {
        assert!(!payroll_safe(101, 100))
    }
}
