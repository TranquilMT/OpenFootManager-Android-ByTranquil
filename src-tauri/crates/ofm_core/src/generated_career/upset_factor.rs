pub fn randomness_window(strength_gap:i8)->u8{match strength_gap.unsigned_abs(){0..=3=>18,4..=8=>14,9..=14=>10,_=>7}}pub fn underdog_bonus(home:bool)->i8{if home{2}else{0}}
