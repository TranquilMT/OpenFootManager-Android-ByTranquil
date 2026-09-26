pub fn baseline(club_form:i8,role_satisfaction:i8)->u8{(65i16+club_form as i16*2+role_satisfaction as i16*3).clamp(20,100)as u8}pub fn unhappy(morale:u8)->bool{morale<40}
