use super::*;

#[test]
fn old_career_keeper_shirt_swap_survives_migration_and_reload() {
    let dir = tempfile::tempdir().unwrap();
    let mut sm = SaveManager::init(&dir.path().join("saves")).unwrap();
    let mut game = sample_game();
    let team = &mut game.teams[0];
    team.name = "Manchester United".into();
    team.reputation = 900;
    team.economy.version = 2;
    team.economy.annual_operating_income = 500_000_000;
    let mut keeper = game.players[0].clone();
    keeper.id = "keeper".into();
    keeper.position = Position::Goalkeeper;
    keeper.squad_role = domain::player::SquadRole::Senior;
    keeper.jersey_number = Some(2);
    keeper.team_id = Some(team.id.clone());
    game.players[0].team_id = keeper.team_id.clone();
    game.players[0].jersey_number = Some(1);
    game.players.push(keeper);
    game.emitted_events
        .extend(["economy:0.6.5".into(), "economy:0.6.7".into()]);
    let id = sm.create_save(&game, "keeper shirt migration").unwrap();
    let loaded = sm.load_game(&id).unwrap();
    assert_eq!(
        loaded
            .players
            .iter()
            .find(|p| p.id == "keeper")
            .unwrap()
            .jersey_number,
        Some(1)
    );
    assert_eq!(
        loaded
            .players
            .iter()
            .find(|p| p.id == game.players[0].id)
            .unwrap()
            .jersey_number,
        Some(2)
    );
    let again = sm.load_game(&id).unwrap();
    assert_eq!(
        again
            .players
            .iter()
            .find(|p| p.id == "keeper")
            .unwrap()
            .jersey_number,
        Some(1)
    );
}

#[test]
fn already_upgraded_067_save_receives_068_polish_only_once() {
    let dir = tempfile::tempdir().unwrap();
    let mut sm = SaveManager::init(&dir.path().join("saves")).unwrap();
    let mut game = sample_game();
    let team = &mut game.teams[0];
    team.name = "Manchester United".into();
    team.reputation = 900;
    team.economy.version = 2;
    team.economy.annual_operating_income = 500_000_000;
    team.economy.annual_operating_cost = 250_000_000;
    let cash = team.finance;
    let wages: Vec<_> = game.players.iter().map(|p| p.wage).collect();
    game.emitted_events
        .extend(["economy:0.6.5".into(), "economy:0.6.7".into()]);
    let id = sm.create_save(&game, "0.6.7 upgrade regression").unwrap();
    let loaded = sm.load_game(&id).unwrap();
    assert!(loaded.emitted_events.contains("economy:0.6.8"));
    assert_eq!(loaded.teams[0].economy.version, 3);
    assert!(loaded.teams[0].sponsorship.as_ref().unwrap().auto_renew);
    assert_eq!(loaded.teams[0].finance, cash);
    assert_eq!(
        loaded.players.iter().map(|p| p.wage).collect::<Vec<_>>(),
        wages
    );
    let again = sm.load_game(&id).unwrap();
    assert_eq!(again.teams[0].economy, loaded.teams[0].economy);
    assert_eq!(again.teams[0].sponsorship, loaded.teams[0].sponsorship);
    assert_eq!(again.teams[0].finance, cash);
}
