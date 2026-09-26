pub fn attributes(target:u8)->[u8;6]{[target.saturating_add(3).min(96),target.saturating_add(2).min(96),target,target.saturating_sub(3),target.saturating_sub(5),target.saturating_sub(8)]}
