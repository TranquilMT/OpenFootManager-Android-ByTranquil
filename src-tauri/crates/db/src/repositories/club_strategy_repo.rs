use ofm_core::club_strategy::CareerStrategy;
use rusqlite::Connection;
use std::collections::HashMap;

pub fn save(conn: &Connection, states: &HashMap<String, CareerStrategy>) -> Result<(), String> {
    let error = || "be.error.gamePersistence.writeFailed".to_string();
    conn.execute("DELETE FROM club_strategies", [])
        .map_err(|_| error())?;
    for (id, state) in states {
        let json = serde_json::to_string(state).map_err(|_| error())?;
        conn.execute(
            "INSERT INTO club_strategies (team_id, state_json) VALUES (?1, ?2)",
            rusqlite::params![id, json],
        )
        .map_err(|_| error())?;
    }
    Ok(())
}

pub fn load(conn: &Connection) -> Result<HashMap<String, CareerStrategy>, String> {
    let error = || "be.error.gamePersistence.loadFailed".to_string();
    let mut stmt = conn
        .prepare("SELECT team_id, state_json FROM club_strategies")
        .map_err(|_| error())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|_| error())?;
    let mut states = HashMap::new();
    for row in rows {
        let (id, json) = row.map_err(|_| error())?;
        states.insert(id, serde_json::from_str(&json).map_err(|_| error())?);
    }
    Ok(states)
}

#[cfg(test)]
mod tests {
    use super::*;
    use ofm_core::club_strategy::{ClubStrategy, RecruitmentPhilosophy, StrategicStatus};

    #[test]
    fn strategy_and_review_year_survive_save_reload_and_replacement() {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::migrations::all_migrations()
            .to_latest(&mut conn)
            .unwrap();
        let states = HashMap::from([(
            "club".into(),
            CareerStrategy {
                strategy: ClubStrategy {
                    status: StrategicStatus::Rebuild,
                    recruitment: RecruitmentPhilosophy::Rebuild,
                    preferred_squad_age: 24,
                    ..ClubStrategy::default()
                },
                reviewed_season: 2026,
            },
        )]);
        save(&conn, &states).unwrap();
        assert_eq!(load(&conn).unwrap(), states);
        save(&conn, &HashMap::new()).unwrap();
        assert!(load(&conn).unwrap().is_empty());
    }

    #[test]
    fn previous_schema_migrates_to_an_empty_strategy_store() {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::migrations::all_migrations()
            .to_version(&mut conn, 46)
            .unwrap();
        crate::migrations::all_migrations()
            .to_latest(&mut conn)
            .unwrap();
        assert!(load(&conn).unwrap().is_empty());
    }
}
