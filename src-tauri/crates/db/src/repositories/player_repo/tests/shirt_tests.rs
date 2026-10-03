use super::*;

#[test]
fn batch_shirt_swap_preserves_both_players() {
    let db = test_db();
    let mut keeper = sample_player("keeper", Some("team-001"));
    keeper.jersey_number = Some(2);
    let mut outfield = sample_player("outfield", Some("team-001"));
    outfield.jersey_number = Some(1);
    upsert_players(db.conn(), &[keeper.clone(), outfield.clone()]).unwrap();
    keeper.jersey_number = Some(1);
    outfield.jersey_number = Some(2);
    upsert_players(db.conn(), &[keeper, outfield]).unwrap();
    let saved = load_all_players(db.conn()).unwrap();
    assert_eq!(saved.len(), 2);
    assert_eq!(
        saved
            .iter()
            .find(|p| p.id == "keeper")
            .unwrap()
            .jersey_number,
        Some(1)
    );
    assert_eq!(
        saved
            .iter()
            .find(|p| p.id == "outfield")
            .unwrap()
            .jersey_number,
        Some(2)
    );
}

#[test]
fn invalid_batch_shirts_roll_back_every_player_change() {
    let db = test_db();
    let mut first = sample_player("first", Some("team-001"));
    first.jersey_number = Some(1);
    let mut second = sample_player("second", Some("team-001"));
    second.jersey_number = Some(2);
    upsert_players(db.conn(), &[first.clone(), second.clone()]).unwrap();
    first.jersey_number = Some(3);
    first.wage = 99_999;
    second.jersey_number = Some(3);
    assert!(upsert_players(db.conn(), &[first, second]).is_err());
    let saved = load_all_players(db.conn()).unwrap();
    assert_eq!(saved.len(), 2);
    let first = saved.iter().find(|p| p.id == "first").unwrap();
    assert_eq!(first.jersey_number, Some(1));
    assert_eq!(first.wage, 5000);
    assert_eq!(
        saved
            .iter()
            .find(|p| p.id == "second")
            .unwrap()
            .jersey_number,
        Some(2)
    );
}

#[test]
fn batch_cannot_take_a_shirt_from_an_omitted_player() {
    let db = test_db();
    let mut existing = sample_player("existing", Some("team-001"));
    existing.jersey_number = Some(1);
    upsert_player(db.conn(), &existing).unwrap();
    let mut newcomer = sample_player("newcomer", Some("team-001"));
    newcomer.jersey_number = Some(1);
    assert!(upsert_players(db.conn(), &[newcomer]).is_err());
    let saved = load_all_players(db.conn()).unwrap();
    assert_eq!(saved.len(), 1);
    assert_eq!(saved[0].id, "existing");
    assert_eq!(saved[0].jersey_number, Some(1));
}
