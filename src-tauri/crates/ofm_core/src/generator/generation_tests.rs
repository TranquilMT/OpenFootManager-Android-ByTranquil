use super::*;

    #[test]
    fn generated_opening_squad_fills_a_natural_four_four_two() {
        use rand::SeedableRng;
        let mut rng = rand::rngs::StdRng::seed_from_u64(42);
        let names = super::super::definitions::default_names_definition();
        let mut players: Vec<_> = (0..SQUAD_SLOTS)
            .map(|slot| {
                generate_random_player_from_def("club", slot, "ENG", 2026, &names, &mut rng)
            })
            .collect();
        super::super::seed_opening_youth_academy(&mut players, 2026);
        assert_eq!(
            players
                .iter()
                .filter(|player| player.squad_role == domain::player::SquadRole::Youth)
                .count(),
            3,
        );
        for (position, count) in [
            (Position::Goalkeeper, 1),
            (Position::LeftBack, 1),
            (Position::CenterBack, 2),
            (Position::RightBack, 1),
            (Position::LeftMidfielder, 1),
            (Position::CentralMidfielder, 2),
            (Position::RightMidfielder, 1),
            (Position::Striker, 2),
        ] {
            assert!(
                players
                    .iter()
                    .filter(
                        |player| player.squad_role == domain::player::SquadRole::Senior
                            && player.natural_position == position
                    )
                    .count()
                    >= count,
                "missing natural {position:?} starters"
            );
        }
    }

    /// Build a `PlayerDef` from JSON rather than a struct literal.
    ///
    /// Deliberate: `potential` is new, so a struct literal naming it would not
    /// compile on a tree that predates the field — and this project requires a
    /// regression test to be *run* against the unfixed code. `PlayerDef` has no
    /// `deny_unknown_fields`, so the old tree ignores the key and these tests
    /// fail on behaviour rather than failing to build.
    fn player_def_from_json(value: serde_json::Value) -> super::super::package::PlayerDef {
        serde_json::from_value(value).expect("the fixture deserializes")
    }

    fn generate_from_json(value: serde_json::Value, opening_year: u32) -> Player {
        let names_def = super::super::definitions::default_names_definition();
        let mut rng = rand::rng();
        generate_player_from_def(
            &player_def_from_json(value),
            "club-id",
            opening_year,
            &names_def,
            &mut rng,
        )
    }

    /// An authored ceiling is the author's to set.
    ///
    /// A package could set a player's current ability but never their ceiling —
    /// it was always rolled from `ovr` and age, so a modder could write a
    /// 17-year-old at 55 but not say that he becomes a 92.
    #[test]
    fn an_authored_potential_is_kept() {
        let player = generate_from_json(
            serde_json::json!({
                "id": "wonder-kid",
                "firstName": "Wonder",
                "lastName": "Kid",
                "club": "club-id",
                "nationality": "ENG",
                "position": "Striker",
                "dateOfBirth": "2009-01-01",
                "overall": 55,
                "potential": 92,
            }),
            2026,
        );

        assert_eq!(player.potential, 92, "the authored ceiling was overwritten");
    }

    /// The same, for the author who specifies attributes rather than an overall.
    #[test]
    fn an_authored_potential_is_kept_in_attributes_mode() {
        let player = generate_from_json(
            serde_json::json!({
                "id": "precise-kid",
                "firstName": "Precise",
                "lastName": "Kid",
                "club": "club-id",
                "nationality": "ENG",
                "position": "CentralMidfielder",
                "dateOfBirth": "2009-01-01",
                "attributes": {
                    "pace": 50, "stamina": 50, "strength": 50,
                    "passing": 50, "shooting": 50, "tackling": 50,
                    "dribbling": 50, "defending": 50,
                    "positioning": 50, "vision": 50, "decisions": 50,
                },
                "potential": 88,
            }),
            2026,
        );

        assert_eq!(player.potential, 88, "the authored ceiling was overwritten");
    }

    /// Omitting it keeps the roll. The back-compat guarantee for every package
    /// already in the wild.
    ///
    /// Asserted against the age bonus band rather than "non-zero and >= ovr",
    /// which a regression that simply set `potential = ovr` would also pass.
    #[test]
    fn an_omitted_potential_is_still_rolled() {
        let player = generate_from_json(
            serde_json::json!({
                "id": "ordinary-kid",
                "firstName": "Ordinary",
                "lastName": "Kid",
                "club": "club-id",
                "nationality": "ENG",
                "position": "Striker",
                "dateOfBirth": "2009-01-01",
                "overall": 55,
            }),
            2026,
        );

        // `generate_potential` gives an under-18 a 15..=30 bonus over ovr,
        // capped at 99.
        let floor = player.ovr.saturating_add(15).min(99);
        let ceiling = player.ovr.saturating_add(30).min(99);
        assert!(
            (floor..=ceiling).contains(&player.potential),
            "a 17-year-old's rolled ceiling should sit {floor}..={ceiling}, got {}",
            player.potential
        );
    }

    /// An authored ceiling is exact, not a suggestion.
    ///
    /// An `overall` is turned into a *jittered* attribute spread and the real ovr
    /// derived from that, so it lands near the target rather than on it. Since
    /// `refresh_player_derived` floors potential at ovr, a ceiling the author
    /// wrote could be quietly raised — measured at 26-32% for mid-range
    /// abilities, and every single time below the attribute clamp floor.
    #[test]
    fn an_authored_ceiling_is_never_raised_by_attribute_jitter() {
        for _ in 0..200 {
            let player = generate_from_json(
                serde_json::json!({
                    "id": "veteran",
                    "firstName": "Fin", "lastName": "Ished",
                    "club": "club-id", "nationality": "ENG", "position": "Striker",
                    "dateOfBirth": "1990-01-01",
                    "overall": 70,
                    "potential": 70,
                }),
                2026,
            );
            assert_eq!(
                player.potential, 70,
                "the authored ceiling was raised to match a jittered ovr of {}",
                player.ovr
            );
        }
    }

    /// The same, where it used to fail every time rather than sometimes.
    ///
    /// Attributes are clamped to a floor of 30 (`jitter(base, 8, 30, 97, ..)`),
    /// so a deliberately poor player could never be generated at the ability
    /// they were authored with, and their ceiling rose with it.
    #[test]
    fn a_deliberately_limited_player_keeps_their_low_ceiling() {
        let player = generate_from_json(
            serde_json::json!({
                "id": "journeyman",
                "firstName": "Jour", "lastName": "Neyman",
                "club": "club-id", "nationality": "ENG", "position": "Striker",
                "dateOfBirth": "1990-01-01",
                "overall": 10,
                "potential": 10,
            }),
            2026,
        );

        assert_eq!(player.potential, 10, "the authored ceiling was raised");
        assert!(
            player.ovr <= 10,
            "a player cannot be generated above their own ceiling, got ovr {}",
            player.ovr
        );
    }

    /// Authoring a ceiling for a youth prospect is the case the field exists for.
    #[test]
    fn a_youth_prospect_keeps_both_their_squad_role_and_their_ceiling() {
        let player = generate_from_json(
            serde_json::json!({
                "id": "academy-star",
                "firstName": "Academy", "lastName": "Star",
                "club": "club-id", "nationality": "ENG", "position": "AttackingMidfielder",
                "dateOfBirth": "2009-06-02",
                "overall": 58,
                "potential": 88,
                "youth": true,
            }),
            2026,
        );

        assert_eq!(player.potential, 88);
        assert_eq!(player.squad_role, domain::player::SquadRole::Youth);
    }

    /// Authoring a generational talent also authors the badge.
    ///
    /// `refresh_player_derived` awards Wonderkid from age, ceiling and headroom,
    /// so it follows from the ceiling rather than being set separately. The
    /// modding reference promises this; without a test the promise is unbacked.
    #[test]
    fn an_authored_ceiling_can_earn_the_wonderkid_trait() {
        let player = generate_from_json(
            serde_json::json!({
                "id": "generational",
                "firstName": "Gene", "lastName": "Rational",
                "club": "club-id", "nationality": "ENG", "position": "Striker",
                "dateOfBirth": "2009-01-01",
                "overall": 55,
                "potential": 92,
            }),
            2026,
        );

        assert!(
            player
                .traits
                .contains(&domain::player::PlayerTrait::Wonderkid),
            "17, ceiling 92, ovr {} — that is a wonderkid: {:?}",
            player.ovr,
            player.traits
        );
    }

    /// And only then. Otherwise every authored ceiling would earn the badge.
    #[test]
    fn an_authored_ceiling_alone_does_not_earn_the_wonderkid_trait() {
        // Old enough that the age gate refuses regardless of the ceiling.
        let veteran = generate_from_json(
            serde_json::json!({
                "id": "late-bloomer",
                "firstName": "Late", "lastName": "Bloomer",
                "club": "club-id", "nationality": "ENG", "position": "Striker",
                "dateOfBirth": "1996-01-01",
                "overall": 70,
                "potential": 95,
            }),
            2026,
        );
        assert!(
            !veteran
                .traits
                .contains(&domain::player::PlayerTrait::Wonderkid),
            "a 30-year-old is not a wonderkid whatever his ceiling: {:?}",
            veteran.traits
        );

        // Young, but the ceiling is nowhere near the elite threshold.
        let ordinary = generate_from_json(
            serde_json::json!({
                "id": "ordinary-prospect",
                "firstName": "Ordinary", "lastName": "Prospect",
                "club": "club-id", "nationality": "ENG", "position": "Striker",
                "dateOfBirth": "2009-01-01",
                "overall": 55,
                "potential": 70,
            }),
            2026,
        );
        assert!(
            !ordinary
                .traits
                .contains(&domain::player::PlayerTrait::Wonderkid),
            "a ceiling of 70 is not wonderkid territory: {:?}",
            ordinary.traits
        );
    }

    /// #453: `country_to_iso` recognised 17 country names and answered `"ENG"`
    /// for everything else, so a package with `"country": "Japan"` filled 60% of
    /// every Japanese club with English players — silently.
    #[test]
    fn a_country_name_outside_the_old_hardcoded_list_resolves_to_its_own_code() {
        for (name, expected) in [
            ("Japan", "JP"),
            ("Nigeria", "NG"),
            ("Poland", "PL"),
            ("Mexico", "MX"),
            ("Serbia", "RS"),
        ] {
            assert_eq!(
                resolve_nationality_code(name).as_deref(),
                Some(expected),
                "{name} should resolve to {expected}"
            );
        }
    }

    #[test]
    fn the_country_names_the_old_list_did_know_still_resolve() {
        for (name, expected) in [
            ("England", "ENG"),
            ("Scotland", "SCO"),
            ("Republic of Ireland", "IE"),
            ("Brazil", "BR"),
            ("Sweden", "SE"),
        ] {
            assert_eq!(resolve_nationality_code(name).as_deref(), Some(expected));
        }
    }

    #[test]
    fn a_code_resolves_to_itself() {
        for code in ["JP", "BR", "ENG", "NIR", "GW"] {
            assert_eq!(resolve_nationality_code(code).as_deref(), Some(code));
        }
    }

    /// A package may declare its own country with a slug id (`scaffold` emits
    /// one for any country outside the catalog). That is unresolvable — and the
    /// answer must be "unknown", not a real, specific, wrong nationality.
    #[test]
    fn an_unresolvable_country_is_unknown_rather_than_england() {
        for unknown in ["atlantis", "Fictland", "", "   "] {
            assert_eq!(
                resolve_nationality_code(unknown),
                None,
                "{unknown:?} must not resolve to a real nation"
            );
        }
    }

    /// The length heuristic passed any 2–3 character string straight through as
    /// though it were a code — a different wrong answer for a different input.
    ///
    /// This is about the *catalog* resolver alone: `zz` names no real nation, so
    /// on its own it is unresolvable. It is emphatically not a statement that a
    /// two-letter id can never be a nationality — a package declaring `ZZ` makes
    /// it one, which `a_package_declared_country_supplies_its_own_clubs` covers.
    #[test]
    fn a_short_string_that_is_not_a_nation_code_is_not_treated_as_one() {
        assert_eq!(resolve_nationality_code("zz"), None);
        assert_eq!(resolve_nationality_code("xyz"), None);
    }

    #[test]
    fn an_unresolvable_club_country_never_produces_an_english_squad() {
        let mut rng = rand::rng();
        let pool = nationality_distribution();

        let drawn: Vec<String> = (0..400)
            .map(|_| pick_nationality_from_def("atlantis", pool, &mut rng))
            .collect();
        let english = drawn.iter().filter(|code| *code == "ENG").count();

        // With the old code every one of these was ENG. Drawn from the whole
        // distribution, England is one nation among 211 — a handful is fine, a
        // majority is the bug.
        assert!(
            english < drawn.len() / 4,
            "{english}/{} drawn as English for an unresolvable country",
            drawn.len()
        );
    }

    /// A package declares its own country, and its clubs must be staffed with
    /// people from it. This is the whole point of authoring a package, and the
    /// catalog cannot help: `ZZ` is in neither list, so drawing from the static
    /// distribution alone leaves a Zedlandian club with no Zedlandians at all.
    #[test]
    fn a_package_declared_country_supplies_its_own_clubs() {
        let mut rng = rand::rng();
        let pool = nationality_distribution_including(["ZZ"].into_iter());

        assert!(
            pool.iter().any(|code| code == "ZZ"),
            "a declared country must be drawable"
        );

        let drawn: Vec<String> = (0..400)
            .map(|_| pick_nationality_from_def("ZZ", &pool, &mut rng))
            .collect();
        let local = drawn.iter().filter(|code| *code == "ZZ").count();

        // The local share is 60%; allow generous slack for the draw. The bug
        // being guarded is zero, not a few points either way.
        assert!(
            local > drawn.len() / 3,
            "{local}/{} drawn from the club's own declared country",
            drawn.len()
        );
    }

    /// A declared id that is already a catalog code must not be appended a
    /// second time — it is in the pool at its proper weight already, and
    /// stacking would quietly promote whichever real nations a package happens
    /// to name.
    #[test]
    fn declaring_a_country_the_catalog_already_has_does_not_promote_it() {
        let baseline = nationality_distribution()
            .iter()
            .filter(|c| *c == "BR")
            .count();
        let pool = nationality_distribution_including(["BR", "br"].into_iter());
        let after = pool.iter().filter(|c| *c == "BR").count();

        assert_eq!(after, baseline, "Brazil must keep its catalog weight");
    }

    /// #452: the draw used to be over the 17 name-pool keys, so a world could
    /// only ever contain ~16 nationalities however many countries it held.
    #[test]
    fn the_nationality_distribution_spans_the_whole_catalog() {
        let pool = nationality_distribution();
        let distinct: std::collections::HashSet<&String> = pool.iter().collect();

        assert!(
            distinct.len() > 200,
            "the draw should span the catalog, got {} nationalities",
            distinct.len()
        );
        for code in ["JP", "NG", "PL", "MX", "RS"] {
            assert!(
                distinct.contains(&code.to_string()),
                "{code} should be drawable"
            );
        }
    }

    /// Weighted, not uniform — the issue is explicit that "uniform across all
    /// nations would be as wrong as today's behaviour, just differently".
    #[test]
    fn stronger_footballing_nations_are_drawn_more_often() {
        let pool = nationality_distribution();
        let count = |code: &str| pool.iter().filter(|entry| *entry == code).count();

        // Top of its region beats a lower-ranked neighbour, which beats a
        // merely-selectable nation.
        assert!(
            count("FR") > count("PL"),
            "FR {} vs PL {}",
            count("FR"),
            count("PL")
        );
        assert!(
            count("PL") > count("AD"),
            "PL {} vs AD {}",
            count("PL"),
            count("AD")
        );
        assert!(
            count("BR") > count("BO"),
            "BR {} vs BO {}",
            count("BR"),
            count("BO")
        );
    }

    /// Rank is only meaningful inside a region, so the assertions above cannot
    /// see the failure that matters most: with no region factor, the top of
    /// every region weighs the same and Costa Rica draws as often as Brazil.
    #[test]
    fn a_regions_depth_counts_not_just_rank_within_it() {
        let pool = nationality_distribution();
        let count = |code: &str| pool.iter().filter(|entry| *entry == code).count();

        // Each pair is top-of-region against top-of-region, so rank alone ties
        // them and only the region factor can separate them.
        assert!(
            count("BR") > count("CR"),
            "BR {} vs CR {}",
            count("BR"),
            count("CR")
        );
        assert!(
            count("FR") > count("CR"),
            "FR {} vs CR {}",
            count("FR"),
            count("CR")
        );
        assert!(
            count("BR") > count("NZ"),
            "BR {} vs NZ {}",
            count("BR"),
            count("NZ")
        );

        // And a mid-table European outranks the best of a shallow region.
        assert!(
            count("IT") > count("NZ"),
            "IT {} vs NZ {}",
            count("IT"),
            count("NZ")
        );

        // South America must out-supply Central America overall, which was
        // inverted while rank was the only factor.
        let region_share = |region: &str| {
            pool.iter()
                .filter(|code| nations::region_for_code(code) == region)
                .count()
        };
        assert!(
            region_share("south-america") > region_share("central-america"),
            "south-america {} vs central-america {}",
            region_share("south-america"),
            region_share("central-america")
        );
    }

    /// The pool is indexed with the RNG, so its order has to be stable or the
    /// same seed stops producing the same world.
    ///
    /// Built from scratch rather than compared against the memoised copy:
    /// `nationality_distribution()` returns the same `&'static` reference every
    /// time, so asserting it equals itself passes even if the builder iterated
    /// a `HashMap` and produced a different order on every run.
    #[test]
    fn the_distribution_is_stable_across_builds() {
        let build = || {
            let mut pool = Vec::new();
            let mut seen_in_region: std::collections::HashMap<&str, usize> =
                std::collections::HashMap::new();
            for nation in nations::NATION_CATALOG {
                let rank = seen_in_region.entry(nation.region_id).or_insert(0);
                let weight = 12usize.saturating_sub(*rank).max(2) * region_weight(nation.region_id);
                *rank += 1;
                for _ in 0..weight {
                    pool.push(nation.code.to_string());
                }
            }
            for nation in nations::ADDITIONAL_NATIONS {
                pool.push(nation.code.to_string());
            }
            pool
        };

        assert_eq!(build(), build(), "two independent builds must agree");
        assert_eq!(
            &build(),
            nationality_distribution(),
            "and must agree with the memoised pool"
        );
    }
