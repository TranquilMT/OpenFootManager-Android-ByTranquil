#[derive(Debug,Clone,Copy)]pub struct ClubGenerationProfile{pub reputation:u8,pub wealth:u8,pub academy:u8}
pub fn profile(reputation:u8,wealth:u8,academy:u8)->ClubGenerationProfile{ClubGenerationProfile{reputation:reputation.min(100),wealth:wealth.min(100),academy:academy.min(100)}}
pub fn stature(p:ClubGenerationProfile)->u8{((p.reputation as u16*3+p.wealth as u16*2)/5)as u8}
