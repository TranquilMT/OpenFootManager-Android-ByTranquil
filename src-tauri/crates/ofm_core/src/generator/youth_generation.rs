use super::*;

/// Generate a youth prospect who is joining **now**.
///
/// `current_year` is the year the recruit arrives, not the year the world opened:
/// a prospect scouted five seasons into a career is fifteen in *that* season. The
/// two coincide only for the opening intake, which is why the distinction is
/// worth naming — a call site that passed the world's opening year here would
/// quietly produce a squad of players five years too old.
pub fn generate_youth_academy_recruit(
    team: &Team,
    target_position: Option<&Position>,
    current_year: u32,
) -> Player {
    generate_youth_academy_recruit_with_nationality(team, target_position, None, current_year)
}

/// As [`generate_youth_academy_recruit`], with the prospect's nationality forced
/// rather than drawn from the club's country. See there for `current_year`.
pub fn generate_youth_academy_recruit_with_nationality(
    team: &Team,
    target_position: Option<&Position>,
    nationality_override: Option<&str>,
    current_year: u32,
) -> Player {
    use domain::player::SquadRole;

    let mut rng = rand::rng();
    let names_def = default_names_definition();
    let country_codes = generation::nationality_distribution();
    let nationality = nationality_override
        .map(generation::canonicalize_generated_nationality)
        .unwrap_or_else(|| {
            // `team_local_nationality`, not `team.country`: a club carries both a
            // location and a football identity, and where they differ the
            // football identity is the one a youth intake should draw on.
            pick_nationality_from_def(team_local_nationality(team), country_codes, &mut rng)
        });
    let youth_slots = youth_slots_for_target(target_position.map(Position::to_group_position));
    let slot_index = youth_slots[rng.random_range(0..youth_slots.len())];
    let mut player = generate_random_player_from_def(
        &team.id,
        slot_index,
        &nationality,
        current_year,
        &names_def,
        &mut rng,
    );
    rebalance_generated_player_for_club(&mut player, team, slot_index, current_year, &mut rng);
    player.squad_role = SquadRole::Youth;
    player.transfer_listed = false;
    player.loan_listed = false;
    player
}

/// Assign fresh prospects names that do not collide with the current career.
/// This is called before reports are shown; existing identities stay untouched.
pub(crate) fn disambiguate_generated_recruits(
    recruits: &mut [Player],
    occupied: impl Iterator<Item = String>,
) {
    let mut used = occupied
        .map(|name| name_diversity::normalize(&name))
        .collect();
    name_diversity::disambiguate(
        recruits,
        &default_names_definition(),
        &mut used,
        &mut rand::rng(),
    );
}
