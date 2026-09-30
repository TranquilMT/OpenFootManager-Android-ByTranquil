use super::definitions::NamesDefinition;
use rand::Rng;
use std::collections::HashSet;

pub(super) fn normalize(name: &str) -> String {
    name.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}

fn unique_name(
    nationality: &str,
    names: &NamesDefinition,
    used: &HashSet<String>,
    rng: &mut impl Rng,
) -> (String, String) {
    for _ in 0..64 {
        let pair = super::generation::pick_name_from_def(nationality, names, rng);
        if !used.contains(&normalize(&format!("{} {}", pair.0, pair.1))) {
            return pair;
        }
    }
    if let Some(pool) = names.pools.get(nationality) {
        for first in &pool.first_names {
            for last in &pool.last_names {
                if !used.contains(&normalize(&format!("{first} {last}"))) {
                    return (first.clone(), last.clone());
                }
            }
        }
        // Middle names retain regional identity when a small custom pool runs out.
        for first in &pool.first_names {
            for middle in &pool.first_names {
                for last in &pool.last_names {
                    let given = format!("{first} {middle}");
                    if !used.contains(&normalize(&format!("{given} {last}"))) {
                        return (given, last.clone());
                    }
                }
            }
        }
    }
    // Even an empty or exhausted mod must finish. There are more candidates
    // than existing identities, so this final bounded search always succeeds.
    let (first, last) = super::generation::pick_name_from_def(nationality, names, rng);
    for suffix in 1..=used.len() + 1 {
        let given = std::iter::repeat_n(first.as_str(), suffix + 1)
            .collect::<Vec<_>>()
            .join(" ");
        if !used.contains(&normalize(&format!("{given} {last}"))) {
            return (given, last);
        }
    }
    unreachable!("bounded identity search exhausted")
}

pub(super) fn disambiguate(
    players: &mut [domain::player::Player],
    names: &NamesDefinition,
    used: &mut HashSet<String>,
    rng: &mut impl Rng,
) {
    for player in players {
        if used.insert(normalize(&player.full_name)) {
            continue;
        }
        let (first, last) = unique_name(&player.nationality, names, used, rng);
        player.full_name = format!("{first} {last}");
        player.match_name = last;
        used.insert(normalize(&player.full_name));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::{SeedableRng, rngs::StdRng};
    use std::collections::HashSet;

    #[test]
    fn collisions_pick_an_unused_name_from_the_same_nationality() {
        let names = super::super::definitions::default_names_definition();
        let mut used = HashSet::new();
        let mut rng = StdRng::seed_from_u64(61);
        for _ in 0..350 {
            let (first, last) = unique_name("JP", &names, &used, &mut rng);
            assert!(names.pools["JP"].first_names.contains(&first));
            assert!(names.pools["JP"].last_names.contains(&last));
            assert!(used.insert(normalize(&format!("{first} {last}"))));
        }
    }

    #[test]
    fn identity_comparison_ignores_case_and_whitespace() {
        assert_eq!(normalize("  ALI   Hassan "), normalize("Ali Hassan"));
    }

    #[test]
    fn tiny_custom_pools_do_not_loop_when_exhausted() {
        let names = super::super::definitions::NamesDefinition {
            version: 1,
            description: String::new(),
            pools: std::collections::HashMap::from([(
                "JP".into(),
                super::super::definitions::NamePool {
                    first_names: vec!["Ren".into()],
                    last_names: vec!["Sato".into()],
                },
            )]),
        };
        let mut rng = StdRng::seed_from_u64(62);
        let used = HashSet::from([normalize("Ren Sato")]);
        let (first, last) = unique_name("JP", &names, &used, &mut rng);
        assert!(!used.contains(&normalize(&format!("{first} {last}"))));
        assert_eq!(last, "Sato");
    }
}
