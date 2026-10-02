use serde::{Deserialize, Serialize};

/// One-time career rewards are stored with the manager, independent of their club.
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub struct ManagerProgression {
    #[serde(default)]
    pub youth_team_id: Option<String>,
    #[serde(default)]
    pub youth_season: Option<u32>,
    #[serde(default)]
    pub youth_minutes: u32,
    #[serde(default)]
    pub unlocked: Vec<AchievementUnlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AchievementUnlock {
    pub id: String,
    pub date: String,
}

// XP comes from known IDs, not a mutable cached total or imported arbitrary rewards.
pub const ACHIEVEMENTS: [(&str, u32); 10] = [
    ("debut", 50),
    ("first_win", 100),
    ("ten_wins", 150),
    ("fifty_matches", 200),
    ("trophy", 300),
    ("promotion", 250),
    ("board_goal", 150),
    ("player_development", 150),
    ("academy_minutes", 200),
    ("career_year", 150),
];

impl ManagerProgression {
    pub fn xp(&self) -> u32 {
        ACHIEVEMENTS
            .iter()
            .filter(|(id, _)| self.unlocked.iter().any(|entry| entry.id == *id))
            .map(|(_, xp)| xp)
            .sum()
    }
    pub fn level(&self) -> u8 {
        (1 + self.xp() / 300).min(6) as u8
    }
    pub fn training_percent(&self) -> u8 {
        (self.level() - 1) * 2
    }
    pub fn performance_bonus(&self) -> u8 {
        ((self.level() - 1) / 2).min(2)
    }
    pub fn unlock(&mut self, id: &str, date: &str) -> bool {
        if !ACHIEVEMENTS.iter().any(|(known, _)| *known == id)
            || self.unlocked.iter().any(|entry| entry.id == id)
        {
            return false;
        }
        self.unlocked.push(AchievementUnlock {
            id: id.into(),
            date: date.into(),
        });
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rewards_are_one_time_known_and_capped_even_for_duplicate_imports() {
        let mut rewards = ManagerProgression::default();
        assert_eq!(rewards.level(), 1);
        assert!(rewards.unlock("trophy", "2026-09-01"));
        assert!(!rewards.unlock("trophy", "2026-09-02"));
        assert!(!rewards.unlock("unknown", "2026-09-02"));
        assert_eq!(rewards.xp(), 300);
        for (id, _) in ACHIEVEMENTS {
            rewards.unlock(id, "2026-09-02");
        }
        let saved = serde_json::to_string(&rewards).unwrap();
        let mut loaded: ManagerProgression = serde_json::from_str(&saved).unwrap();
        loaded.unlocked.extend(rewards.unlocked);
        assert_eq!(loaded.xp(), 1700);
        assert_eq!(loaded.level(), 6);
        assert_eq!(loaded.training_percent(), 10);
        assert_eq!(loaded.performance_bonus(), 2);
    }
}
