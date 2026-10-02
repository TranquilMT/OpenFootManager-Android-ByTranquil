//! Bounded, consistent recovery copies. SQLite backup includes WAL changes;
//! copying the database file alone can silently omit the latest transactions.
use rusqlite::{Connection, OpenFlags};
use std::path::{Path, PathBuf};

const KEEP: usize = 3;
const ERROR: &str = "be.error.saveLoad.corrupted";

fn slot(path: &Path, index: usize) -> PathBuf {
    path.with_extension(format!("db.recovery-{index}"))
}

pub(crate) fn snapshot(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }
    let source = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|_| ERROR.to_string())?;
    let check: String = source
        .query_row("PRAGMA quick_check", [], |r| r.get(0))
        .map_err(|_| ERROR.to_string())?;
    // Never replace good recovery copies with a damaged source.
    if check != "ok" {
        return Err(ERROR.to_string());
    }
    let temporary = path.with_extension("db.recovery-pending");
    let _ = std::fs::remove_file(&temporary);
    source
        .backup(rusqlite::DatabaseName::Main, &temporary, None)
        .map_err(|_| ERROR.to_string())?;
    for index in (1..KEEP).rev() {
        let older = slot(path, index + 1);
        if older.exists() {
            std::fs::remove_file(&older).map_err(|_| ERROR.to_string())?;
        }
        let newer = slot(path, index);
        if newer.exists() {
            std::fs::rename(newer, older).map_err(|_| ERROR.to_string())?;
        }
    }
    std::fs::rename(temporary, slot(path, 1)).map_err(|_| ERROR.to_string())
}

pub(crate) fn restore(path: &Path) -> Result<(), String> {
    for index in 1..=KEEP {
        let candidate = slot(path, index);
        if !candidate.exists() {
            continue;
        }
        let Ok(db) = crate::game_database::GameDatabase::open_save(&candidate) else {
            continue;
        };
        let format_ok = crate::repositories::meta_repo::load_meta(db.conn())
            .ok()
            .flatten()
            .is_some_and(|meta| {
                meta.save_format_version
                    <= crate::repositories::meta_repo::CURRENT_SAVE_FORMAT_VERSION
            });
        if !format_ok
            || crate::game_persistence::GamePersistenceReader::read_stats_state(&db).is_err()
            || crate::game_persistence::GamePersistenceReader::read_game(&db).is_err()
        {
            continue;
        }
        let check: String = db
            .conn()
            .query_row("PRAGMA quick_check", [], |r| r.get(0))
            .map_err(|_| ERROR.to_string())?;
        if check != "ok" {
            continue;
        }
        let temporary = path.with_extension("db.restore-pending");
        let _ = std::fs::remove_file(&temporary);
        db.conn()
            .backup(rusqlite::DatabaseName::Main, &temporary, None)
            .map_err(|_| ERROR.to_string())?;
        drop(db);
        // Preserve the failed save for diagnosis rather than discarding it.
        if path.exists() {
            std::fs::copy(path, path.with_extension("db.before-restore"))
                .map_err(|_| ERROR.to_string())?;
        }
        for suffix in ["-wal", "-shm"] {
            let sidecar = PathBuf::from(format!("{}{suffix}", path.display()));
            if sidecar.exists() {
                std::fs::remove_file(sidecar).map_err(|_| ERROR.to_string())?;
            }
        }
        std::fs::rename(temporary, path).map_err(|_| ERROR.to_string())?;
        return Ok(());
    }
    Err(ERROR.to_string())
}

pub(crate) fn remove_copies(path: &Path) -> Result<(), String> {
    let mut paths: Vec<PathBuf> = (1..=KEEP).map(|index| slot(path, index)).collect();
    paths.extend([
        path.with_extension("db.before-restore"),
        path.with_extension("db.recovery-pending"),
        path.with_extension("db.restore-pending"),
    ]);
    for copy in paths {
        if copy.exists() {
            std::fs::remove_file(copy).map_err(|_| ERROR.to_string())?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn snapshots_include_wal_and_keep_only_three_versions() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("save.db");
        let db = Connection::open(&path).unwrap();
        db.execute_batch("PRAGMA journal_mode=WAL; CREATE TABLE example (value INTEGER);")
            .unwrap();
        for value in 1..=5 {
            db.execute("INSERT INTO example VALUES (?1)", [value])
                .unwrap();
            snapshot(&path).unwrap();
        }
        let backup = Connection::open(slot(&path, 1)).unwrap();
        let count: i64 = backup
            .query_row("SELECT COUNT(*) FROM example", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 5);
        assert!(slot(&path, 3).exists());
        assert!(!slot(&path, 4).exists());
    }
    #[test]
    fn damaged_source_does_not_replace_good_backup() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("save.db");
        Connection::open(&path)
            .unwrap()
            .execute_batch("CREATE TABLE example(value INTEGER);")
            .unwrap();
        snapshot(&path).unwrap();
        let before = std::fs::read(slot(&path, 1)).unwrap();
        std::fs::write(&path, b"damaged").unwrap();
        assert!(snapshot(&path).is_err());
        assert_eq!(std::fs::read(slot(&path, 1)).unwrap(), before);
    }
}
