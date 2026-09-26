//! Generated-squad planning for database-free careers.
use crate::generated_balance::{LeagueTier,SquadRole};

pub const GENERATED_SQUAD_SIZE: usize = 22;

pub fn role_for_slot(slot:usize)->SquadRole{
    match slot{
        0|2|3|9|10|16=>SquadRole::Starter,
        4|5|11|12|17=>SquadRole::Rotation,
        6|13|18|19=>SquadRole::Depth,
        7|14|20=>SquadRole::Prospect,
        1|8|15|21=>SquadRole::Academy,
        _=>SquadRole::Depth,
    }
}

pub fn senior_age_range(role:SquadRole)->(u8,u8){
    match role{
        SquadRole::Star=>(22,31),SquadRole::Starter=>(21,32),SquadRole::Rotation=>(20,33),
        SquadRole::Depth=>(20,34),SquadRole::Prospect=>(17,22),SquadRole::Academy=>(16,20),
    }
}

pub fn elite_star_slots(tier:LeagueTier,reputation:u8,financial_strength:u8)->usize{
    if !matches!(tier,LeagueTier::Elite|LeagueTier::Top){return 0}
    let strength=(reputation.min(100)as u16+financial_strength.min(100)as u16)/2;
    match strength{90..=100=>4,80..=89=>3,70..=79=>2,60..=69=>1,_=>0}
}

#[cfg(test)]mod tests{use super::*;#[test]fn academy_slots_stay_young(){for slot in [1,8,15,21]{assert_eq!(role_for_slot(slot),SquadRole::Academy)}}#[test]fn poor_lower_clubs_have_no_forced_stars(){assert_eq!(elite_star_slots(LeagueTier::Lower,95,95),0)}}
