use ofm_core::game::Game;

/// Every migration has its own completion marker; an older completed upgrade
/// must not hide later repairs. Only actual changes request another DB write.
pub(crate) fn upgrade(game: &mut Game) -> Result<bool, String> {
    if ["economy:0.6.5", "economy:0.6.7", "economy:0.6.8"]
        .iter()
        .all(|marker| game.emitted_events.contains(*marker))
    {
        return Ok(false);
    }
    let before = game.emitted_events.len();
    ofm_core::club_economy::upgrade_generated_career(game)?;
    Ok(game.emitted_events.len() != before)
}
