//! Rules used by database-free generated careers.
pub fn clamp_rating(value:i16)->u8{value.clamp(25,94) as u8}
