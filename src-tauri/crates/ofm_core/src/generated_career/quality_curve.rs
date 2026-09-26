pub fn quality_offset(slot:usize)->i8{match slot{0..=2=>5,3..=7=>3,8..=12=>0,13..=16=>-3,17..=19=>-6,_=>-10}}
pub fn apply(base:u8,slot:usize)->u8{(base as i16+quality_offset(slot)as i16).clamp(25,94)as u8}
