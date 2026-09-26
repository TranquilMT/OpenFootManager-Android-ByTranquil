pub fn variance(seed:u64)->i8{match seed%9{0=>-4,1=>-3,2=>-2,3=>-1,4=>0,5=>1,6=>2,7=>3,_=>4}}pub fn apply(base:u8,seed:u64)->u8{(base as i16+variance(seed)as i16).clamp(20,96)as u8}
