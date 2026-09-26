pub fn potential(current:u8,age:u8,academy:u8)->u8{let headroom=match age{0..=17=>18,18..=20=>14,21..=23=>9,24..=26=>5,_=>2};current.saturating_add(headroom+academy.min(100)/20).min(96)}
pub fn growth_room(current:u8,potential:u8)->u8{potential.saturating_sub(current)}
