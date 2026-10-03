use super::*;

#[test]
fn physical_focus_can_improve_physical_attrs() {
    let mut game = make_game();
    game.teams[0].training_focus = TrainingFocus::Physical;
    game.teams[0].training_intensity = TrainingIntensity::High;
    game.teams[0].training_schedule = TrainingSchedule::Intense;

    // Record initial stats
    let initial_pace: Vec<u8> = game.players.iter().map(|p| p.attributes.pace).collect();
    let initial_stamina: Vec<u8> = game.players.iter().map(|p| p.attributes.stamina).collect();

    // Train many sessions to make probabilistic gains likely
    for _ in 0..365 {
        for p in game.players.iter_mut() {
            p.condition = 90;
            p.potential = 85;
            p.stats.minutes_played = 1800; // Keep condition high so training continues
        }
        training::process_training(&mut game, 0); // Monday = training day
    }

    let final_pace: Vec<u8> = game.players.iter().map(|p| p.attributes.pace).collect();
    let final_stamina: Vec<u8> = game.players.iter().map(|p| p.attributes.stamina).collect();

    // At least one player should have gained in pace or stamina after 100 sessions
    let any_pace_gain = initial_pace
        .iter()
        .zip(final_pace.iter())
        .any(|(i, f)| f > i);
    let any_stamina_gain = initial_stamina
        .iter()
        .zip(final_stamina.iter())
        .any(|(i, f)| f > i);

    assert!(
        any_pace_gain || any_stamina_gain,
        "Physical focus should improve pace or stamina after many sessions"
    );
}

#[test]
fn technical_focus_can_improve_technical_attrs() {
    let mut game = make_game();
    game.teams[0].training_focus = TrainingFocus::Technical;
    game.teams[0].training_intensity = TrainingIntensity::High;
    game.teams[0].training_schedule = TrainingSchedule::Intense;

    let initial_passing: Vec<u8> = game.players.iter().map(|p| p.attributes.passing).collect();

    for _ in 0..365 {
        for p in game.players.iter_mut() {
            p.condition = 90;
            p.potential = 85;
            p.stats.minutes_played = 1800;
        }
        training::process_training(&mut game, 0);
    }

    let final_passing: Vec<u8> = game.players.iter().map(|p| p.attributes.passing).collect();
    let any_gain = initial_passing
        .iter()
        .zip(final_passing.iter())
        .any(|(i, f)| f > i);
    assert!(
        any_gain,
        "Technical focus should improve passing after many sessions"
    );
}
