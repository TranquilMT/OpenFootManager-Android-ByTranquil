//! Rules used by database-free generated careers.
pub fn clamp_rating(value:i16)->u8{value.clamp(25,94) as u8}
pub fn tier_floor(tier:u8)->u8{match tier{0=>55,1=>50,2=>45,3=>40,_=>34}}
pub fn tier_ceiling(tier:u8)->u8{match tier{0=>92,1=>88,2=>81,3=>73,_=>65}}
pub fn club_stature(reputation:u8,wealth:u8)->u8{(((reputation.min(100)as u16)*3+(wealth.min(100)as u16)*2)/5)as u8}
pub fn youth_discount(age:u8)->u8{match age{0..=16=>20,17=>17,18=>14,19=>11,20=>8,21=>5,_=>0}}
pub fn potential_headroom(age:u8)->u8{match age{0..=17=>24,18..=20=>18,21..=23=>12,24..=26=>7,27..=29=>3,_=>1}}
pub fn decline_pressure(age:u8)->u8{match age{0..=29=>0,30..=31=>1,32..=33=>2,34..=35=>4,_=>6}}
