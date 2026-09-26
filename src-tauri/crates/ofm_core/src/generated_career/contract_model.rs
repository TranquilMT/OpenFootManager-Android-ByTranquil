pub fn years(age:u8,role:u8)->u8{let base=match age{0..=21=>4,22..=28=>3,29..=31=>2,_=>1};(base+if role<=1{1}else{0}).min(5)}pub fn renewal_window_months(age:u8)->u8{if age>=32{9}else{15}}
