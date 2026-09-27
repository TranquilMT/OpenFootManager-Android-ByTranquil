use ofm_core::generated_balance::{LeagueTier, youth_floor};
#[test]
fn youth_floor_tracks_stature() {
    assert!(
        youth_floor(LeagueTier::Elite) > youth_floor(LeagueTier::Top)
            && youth_floor(LeagueTier::Top) > youth_floor(LeagueTier::Lower)
    );
}
