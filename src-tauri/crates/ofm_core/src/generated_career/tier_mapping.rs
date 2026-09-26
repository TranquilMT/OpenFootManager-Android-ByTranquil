//! Competition-level mapping for generated careers.
use crate::generated_balance::LeagueTier;
pub fn league_tier(level:u8)->LeagueTier{match level{0=>LeagueTier::Elite,1=>LeagueTier::Top,2=>LeagueTier::Professional,3=>LeagueTier::Lower,_=>LeagueTier::Grassroots}}
pub fn tier_index(tier:LeagueTier)->u8{match tier{LeagueTier::Elite=>0,LeagueTier::Top=>1,LeagueTier::Professional=>2,LeagueTier::Lower=>3,LeagueTier::Grassroots=>4}}
