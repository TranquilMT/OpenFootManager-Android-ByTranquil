pub fn growth_percent(facility:u8,coach:u8)->u8{(75+facility.min(100)/8+coach.min(100)/8).min(100)}
