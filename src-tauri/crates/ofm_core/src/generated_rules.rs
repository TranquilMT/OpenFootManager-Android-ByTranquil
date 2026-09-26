//! Rules used by database-free generated careers.
pub fn clamp_rating(value:i16)->u8{value.clamp(25,94) as u8}
pub fn tier_floor(tier:u8)->u8{match tier{0=>55,1=>50,2=>45,3=>40,_=>34}}
