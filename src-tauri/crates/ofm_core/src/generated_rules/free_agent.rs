pub fn wage_discount(months_unattached:u8)->u8{(months_unattached.saturating_mul(3)).min(25)}
