pub fn target_age(slot:usize)->u8{match slot%11{0=>29,1=>27,2=>25,3=>24,4=>28,5=>23,6=>31,7=>22,8=>20,9=>19,_=>18}}
pub fn is_youth(age:u8)->bool{age<=21}pub fn is_veteran(age:u8)->bool{age>=31}
