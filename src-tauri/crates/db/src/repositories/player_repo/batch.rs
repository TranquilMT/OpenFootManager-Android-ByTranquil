use super::{GAME_PERSISTENCE_WRITE_ERROR, upsert_player};
use domain::player::Player;
use rusqlite::{Connection, params};

/// Save a squad atomically, allowing valid shirt swaps across existing rows.
pub fn upsert_players(conn: &Connection, players: &[Player]) -> Result<(), String> {
    // A savepoint also works inside the game writer's transaction. Release only
    // changing players' old shirts before writing the final assignments, so the
    // unique index still protects players omitted from a partial batch.
    conn.execute_batch("SAVEPOINT ofm_player_batch")
        .map_err(|_| GAME_PERSISTENCE_WRITE_ERROR.to_string())?;
    let result = (|| {
        let mut release_shirt = conn
            .prepare(
                "UPDATE players SET jersey_number = NULL WHERE id = ?1
                 AND (team_id IS NOT ?2 OR jersey_number IS NOT ?3)",
            )
            .map_err(|_| GAME_PERSISTENCE_WRITE_ERROR.to_string())?;
        for player in players {
            release_shirt
                .execute(params![player.id, player.team_id, player.jersey_number])
                .map_err(|_| GAME_PERSISTENCE_WRITE_ERROR.to_string())?;
        }
        for player in players {
            upsert_player(conn, player)?;
        }
        Ok(())
    })();
    if let Err(error) = result {
        conn.execute_batch("ROLLBACK TO ofm_player_batch; RELEASE ofm_player_batch")
            .map_err(|_| GAME_PERSISTENCE_WRITE_ERROR.to_string())?;
        return Err(error);
    }
    conn.execute_batch("RELEASE ofm_player_batch")
        .map_err(|_| GAME_PERSISTENCE_WRITE_ERROR.to_string())
}
