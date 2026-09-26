pub fn rating_modifier(morale:u8)->i8{((morale.min(100)as i16-50)/20).clamp(-2,2)as i8}
