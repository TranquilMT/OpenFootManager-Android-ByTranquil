mod fitness_warnings;
pub use fitness_warnings::check_squad_fitness_warnings;

use crate::game::Game;
use crate::player_rating::refresh_player_derived;
use domain::message::{
    ActionType, InboxMessage, MessageAction, MessageCategory, MessageContext, MessagePriority,
};
use domain::player::{Player, PlayerAttributes, SquadRole};
use domain::staff::{CoachingSpecialization, StaffRole};
use domain::team::{TrainingFocus, TrainingIntensity, TrainingSchedule};
use rand::Rng;

/// Computed coaching quality for a team's staff.
pub struct TeamCoachingBonus {
    pub coaching_mult: f64, // Overall coaching quality multiplier (1.0 = no staff)
    pub specialization_mult: f64, // Extra bonus if a coach specializes in the current focus
    pub physio_mult: f64,   // Recovery bonus from physio staff
    pub youth_mult: f64,
}

/// Compute coaching bonuses from a team's staff.
fn index_staff_by_team(
    staff: &[domain::staff::Staff],
) -> std::collections::HashMap<&str, Vec<&domain::staff::Staff>> {
    let mut indexed = std::collections::HashMap::<&str, Vec<&domain::staff::Staff>>::new();
    for member in staff {
        if let Some(team_id) = member.team_id.as_deref() {
            indexed.entry(team_id).or_default().push(member);
        }
    }
    indexed
}

fn compute_coaching_bonus(
    team_staff: &[&domain::staff::Staff],
    focus: &TrainingFocus,
) -> TeamCoachingBonus {
    // Average coaching rating of coaches + assistant managers
    let coaching_staff: Vec<_> = team_staff
        .iter()
        .filter(|s| matches!(s.role, StaffRole::Coach | StaffRole::AssistantManager))
        .collect();

    let coaching_mult = if coaching_staff.is_empty() {
        0.8 // Penalty for having no coaching staff
    } else {
        let avg_coaching: f64 = coaching_staff
            .iter()
            .map(|s| s.attributes.coaching as f64)
            .sum::<f64>()
            / coaching_staff.len() as f64;
        // Range: 0.85 (coaching=0) to 1.35 (coaching=100)
        0.85 + (avg_coaching / 100.0) * 0.5
    };

    // Check if any coach specializes in the current training focus
    let focus_spec = match focus {
        TrainingFocus::Physical => Some(CoachingSpecialization::Fitness),
        TrainingFocus::Technical => Some(CoachingSpecialization::Technique),
        TrainingFocus::Tactical => Some(CoachingSpecialization::Tactics),
        TrainingFocus::Defending => Some(CoachingSpecialization::Defending),
        TrainingFocus::Attacking => Some(CoachingSpecialization::Attacking),
        TrainingFocus::Recovery => None,
    };

    let specialization_mult = if let Some(target_spec) = focus_spec {
        let has_specialist = coaching_staff
            .iter()
            .any(|s| s.specialization.as_ref() == Some(&target_spec));
        if has_specialist { 1.25 } else { 1.0 }
    } else {
        1.0
    };

    // Physio bonus for recovery
    let physio_staff: Vec<_> = team_staff
        .iter()
        .filter(|s| matches!(s.role, StaffRole::Physio))
        .collect();

    let physio_mult = if physio_staff.is_empty() {
        1.0
    } else {
        let avg_physio: f64 = physio_staff
            .iter()
            .map(|s| s.attributes.physiotherapy as f64)
            .sum::<f64>()
            / physio_staff.len() as f64;
        // Range: 1.0 (physio=0) to 1.4 (physio=100)
        1.0 + (avg_physio / 100.0) * 0.4
    };

    let youth_mult = coaching_staff
        .iter()
        .filter(|staff| staff.specialization.as_ref() == Some(&CoachingSpecialization::Youth))
        .map(|staff| 1.1 + f64::from(staff.attributes.coaching) / 500.0)
        .fold(1.0_f64, f64::max);

    TeamCoachingBonus {
        coaching_mult,
        specialization_mult,
        physio_mult,
        youth_mult,
    }
}

struct TrainingDay {
    weekday_num: u32,
    year: u32,
}

/// Match exposure helps young players turn training into ability. An unused
/// prospect still develops in training, but more slowly than a regular player.
fn playing_time_growth_factor(age: u32, minutes: u32) -> f64 {
    if age > 23 {
        return 1.0;
    }
    match minutes {
        0..=299 => 0.55,
        300..=899 => 0.8,
        900..=1799 => 1.0,
        _ => 1.1,
    }
}

/// Below this individual condition, an AI-managed player is automatically rested
/// in training (treated as Recovery focus) regardless of the team's plan. The AI
/// sets one team-wide intensity from the squad's *average* condition, but the
/// per-player condition cost is flat — so a player who is individually exhausted
/// in an otherwise-okay squad keeps net-losing condition (cost > their diminished
/// recovery) and never climbs out. This guard breaks that fatigue spiral so a
/// rested bench can recover and the condition-aware lineup picker can rotate.
/// The user's own team is exempt — managers have manual control over training.
const FATIGUE_GUARD_CONDITION: u8 = 45;

/// Per-team data collected before mutating players.
struct TeamTrainingPlan {
    default_focus: TrainingFocus,
    intensity: TrainingIntensity,
    schedule: TrainingSchedule,
    bonus: TeamCoachingBonus,
    medical_facility_mult: f64,
    /// player_id → group focus override (players not in any group use default_focus)
    group_overrides: std::collections::HashMap<String, TrainingFocus>,
}

/// Process daily training for all teams.
/// On non-match days each team's players train according to the team's
/// current focus, intensity, and schedule. Rest days (determined by the
/// weekly schedule) give full condition recovery with no training cost.
/// Players assigned to a training group use that group's focus instead of
/// the team default.
/// `weekday_num` is 0=Mon .. 6=Sun (chrono Weekday::num_days_from_monday()).
pub fn process_training(game: &mut Game, weekday_num: u32) {
    // Derive the current year from the game clock for accurate age calculations.
    let current_year = game
        .clock
        .current_date
        .format("%Y")
        .to_string()
        .parse::<u32>()
        .unwrap_or(2026);

    // Index each team's plan by id so players are visited once (O(teams + players))
    // instead of rescanning every player for every team (O(teams * players)).
    let staff_by_team = index_staff_by_team(&game.staff);
    let plans: std::collections::HashMap<String, TeamTrainingPlan> = game
        .teams
        .iter()
        .map(|t| {
            let mut bonus = compute_coaching_bonus(
                staff_by_team.get(t.id.as_str()).map_or(&[], Vec::as_slice),
                &t.training_focus,
            );
            if game.manager.team_id.as_deref() == Some(t.id.as_str()) {
                bonus.coaching_mult *= 1.0
                    + f64::from(game.manager.career_stats.progression.training_percent()) / 100.0;
            }
            bonus.coaching_mult *= 1.0 + f64::from(t.facilities.training.saturating_sub(1).min(9)) * 0.05;
            let medical_facility_mult =
                1.0 + f64::from(t.facilities.medical.saturating_sub(1)) * 0.1;
            let mut group_overrides = std::collections::HashMap::new();
            for group in &t.training_groups {
                for pid in &group.player_ids {
                    group_overrides.insert(pid.clone(), group.focus.clone());
                }
            }
            (
                t.id.clone(),
                TeamTrainingPlan {
                    default_focus: t.training_focus.clone(),
                    intensity: t.training_intensity.clone(),
                    schedule: t.training_schedule.clone(),
                    bonus,
                    medical_facility_mult,
                    group_overrides,
                },
            )
        })
        .collect();

    let day = TrainingDay {
        weekday_num,
        year: current_year,
    };
    let mut rng = rand::rng();
    for player in game.players.iter_mut() {
        let Some(plan) = player.team_id.as_deref().and_then(|id| plans.get(id)) else {
            continue;
        };
        train_player(player, plan, &day, &mut rng);
    }
}

/// A monthly coaching review follows actual training gains and points managers
/// to the academy; promotion remains a manager decision.
pub fn report_youth_development(game: &mut Game) {
    use chrono::Datelike;

    if game.clock.current_date.day() != 1 {
        return;
    }
    let Some(team_id) = game.manager.team_id.clone() else {
        return;
    };
    let coach = game
        .staff
        .iter()
        .find(|staff| {
            staff.team_id.as_deref() == Some(team_id.as_str())
                && staff.role == StaffRole::Coach
                && staff.specialization.as_ref() == Some(&CoachingSpecialization::Youth)
        })
        .or_else(|| {
            game.staff.iter().find(|staff| {
                staff.team_id.as_deref() == Some(team_id.as_str()) && staff.role == StaffRole::Coach
            })
        });
    let sender = coach
        .map(|staff| format!("{} {}", staff.first_name, staff.last_name))
        .unwrap_or_default();
    let date = game.clock.current_date.format("%Y-%m-%d").to_string();
    let month = game.clock.current_date.format("%Y-%m").to_string();
    let reports: Vec<_> = game
        .players
        .iter()
        .filter(|player| {
            player.team_id.as_deref() == Some(team_id.as_str())
                && player.squad_role == SquadRole::Youth
        })
        .map(|player| {
            (
                player.id.clone(),
                player.match_name.clone(),
                player.ovr,
                player.potential,
            )
        })
        .collect();
    for (player_id, player_name, ovr, potential) in reports {
        let ready = ovr >= 68 && potential >= 78;
        let id = format!("academy_review_{player_id}_{month}");
        crate::inbox::emit_once(game, &id, || {
            InboxMessage::new(
                id.clone(),
                String::new(),
                String::new(),
                sender.clone(),
                date.clone(),
            )
            .with_category(MessageCategory::Training)
            .with_priority(if ready {
                MessagePriority::High
            } else {
                MessagePriority::Normal
            })
            .with_action(MessageAction {
                id: "ack".to_string(),
                label: String::new(),
                action_type: ActionType::Acknowledge,
                resolved: false,
                label_key: Some("be.msg.event.ack".to_string()),
            })
            .with_context(MessageContext {
                player_id: Some(player_id.clone()),
                team_id: Some(team_id.clone()),
                ..Default::default()
            })
            .with_i18n(
                "be.msg.academyReview.subject",
                if ready {
                    "be.msg.academyReview.ready"
                } else {
                    "be.msg.academyReview.progress"
                },
                [
                    ("player".to_string(), player_name.clone()),
                    ("ovr".to_string(), ovr.to_string()),
                    ("potential".to_string(), potential.to_string()),
                ]
                .into_iter()
                .collect(),
            )
            .with_sender_i18n("be.sender.youthCoach", "be.role.youthCoach")
        });
    }
}

fn train_player(
    player: &mut Player,
    plan: &TeamTrainingPlan,
    day: &TrainingDay,
    rng: &mut impl Rng,
) {
    let is_training_day = plan.schedule.is_training_day(day.weekday_num);
    let intensity_mult = match &plan.intensity {
        TrainingIntensity::Low => 0.5,
        TrainingIntensity::Medium => 1.0,
        TrainingIntensity::High => 1.5,
    };

    // AI fatigue guard: an exhausted player on an AI team is automatically rested
    // (treated as Recovery focus) so they can recover instead of being run further
    // into the ground by the squad-average-driven team intensity. See
    // `FATIGUE_GUARD_CONDITION`. The user's team is exempt — it has manual agency.
    // Injured players are exempt: they don't train regardless, and routing them
    // through Recovery focus here would inflate the injured-recovery base below
    // (9.0 instead of 3.0), giving exhausted injured AI players ~3x recovery.
    let recovery_focus = TrainingFocus::Recovery;
    let player_focus =
        if is_training_day && player.injury.is_none() && player.condition < FATIGUE_GUARD_CONDITION
        {
            &recovery_focus
        } else {
            // Determine this player's effective focus:
            // player override > group override > team default
            player
                .training_focus
                .as_ref()
                .or_else(|| plan.group_overrides.get(&player.id))
                .unwrap_or(&plan.default_focus)
        };

    // On rest days or Recovery focus: no training cost
    let condition_cost: u8 = if !is_training_day {
        0
    } else {
        match (player_focus, &plan.intensity) {
            (TrainingFocus::Recovery, _) => 0,
            (_, TrainingIntensity::Low) => 1,
            (_, TrainingIntensity::Medium) => 2,
            (_, TrainingIntensity::High) => 4,
        }
    };

    // Recovery amount: rest days get boosted recovery (like Recovery focus)
    let recovery_base: f64 = if !is_training_day {
        10.0 * plan.bonus.physio_mult * plan.medical_facility_mult
    } else {
        match player_focus {
            TrainingFocus::Recovery => 12.0 * plan.bonus.physio_mult * plan.medical_facility_mult,
            _ => 4.0 * plan.bonus.physio_mult * plan.medical_facility_mult,
        }
    };

    // Age, morale, and current condition all affect recovery rate.
    // Older players recover more slowly; high morale aids recovery;
    // severely fatigued players have a harder time bouncing back.
    let age = estimate_age(&player.date_of_birth, day.year);
    let age_rec = recovery_factor_from_age(age);
    let morale_rec = recovery_factor_from_morale(player.morale);
    let condition_rec = recovery_factor_from_condition(player.condition);
    let fitness_rec = recovery_factor_from_fitness(player.fitness);

    // Injured players: half base recovery, scaled by age and morale.
    // Fitness decays slowly during injury (inactive = losing sharpness).
    if player.injury.is_some() {
        let recovery = (recovery_base * 0.5 * age_rec * morale_rec * fitness_rec) as u8;
        player.condition = (player.condition + recovery).min(100);
        player.fitness = clamp_fitness(player.fitness as i16 - 1);
        return;
    }

    // On rest days: only recovery, no attribute gains
    if !is_training_day {
        let stamina_factor = player.attributes.stamina as f64 / 100.0;
        let recovery = (recovery_base
            * (0.5 + stamina_factor * 0.5)
            * age_rec
            * morale_rec
            * condition_rec
            * fitness_rec) as u8;
        player.condition = (player.condition + recovery).min(100);
        return;
    }

    // Age factor for attribute gains: younger players grow faster, older players slower
    let age_factor = if age <= 21 {
        1.5
    } else if age <= 25 {
        1.2
    } else if age <= 29 {
        1.0
    } else if age <= 33 {
        0.6
    } else {
        0.3
    };

    // Base gain per attribute per session, boosted by coaching staff
    let gain = 0.025
        * intensity_mult
        * age_factor
        * (f64::from(player.potential.saturating_sub(player.ovr)) / 20.0).clamp(0.15, 1.0)
        * (f64::from(player.condition) / 90.0).clamp(0.35, 1.0)
        * playing_time_growth_factor(age, player.stats.minutes_played)
        * plan.bonus.coaching_mult
        * plan.bonus.specialization_mult
        * if player.squad_role == SquadRole::Youth {
            plan.bonus.youth_mult
        } else {
            1.0
        };

    // Peaked players (ovr == potential) get no attribute gains. Without this
    // gate, attribute drift lifts ovr, and `refresh_player_derived`'s
    // `potential = max(potential, ovr)` invariant silently raises the career
    // ceiling in lockstep — the ceiling stops being a ceiling.
    if player.potential > player.ovr {
        if player.natural_position.to_group_position() == domain::player::Position::Goalkeeper {
            apply_goalkeeper_gains(&mut player.attributes, player_focus, gain, rng);
        } else {
            apply_focus_gains(&mut player.attributes, player_focus, gain, rng);
        }
    }
    apply_fitness_change(&mut player.fitness, player_focus, intensity_mult, rng);

    // Refresh position-weighted OVR and traits after attribute gains.
    refresh_player_derived(player, day.year);

    // Apply condition: deplete from training, then recover
    player.condition = player.condition.saturating_sub(condition_cost);
    let stamina_factor = player.attributes.stamina as f64 / 100.0;
    let recovery = (recovery_base
        * (0.5 + stamina_factor * 0.5)
        * age_rec
        * morale_rec
        * condition_rec
        * fitness_rec) as u8;
    player.condition = (player.condition + recovery).min(100);
}

/// Apply fitness changes based on training focus.
/// Physical training builds fitness (probabilistic small gains).
/// Recovery focus gives a tiny boost. Non-physical training slowly decays high fitness.
fn apply_fitness_change(
    fitness: &mut u8,
    focus: &TrainingFocus,
    intensity_mult: f64,
    rng: &mut impl Rng,
) {
    use rand::RngExt;
    match focus {
        TrainingFocus::Physical => {
            // Physical training is the primary way to build fitness.
            // Higher intensity → higher gain probability.
            let gain_prob = 0.015 * intensity_mult; // 0.0075–0.0225 per session
            let roll: f64 = rng.random_range(0.0..1.0);
            if roll < gain_prob && *fitness < 100 {
                *fitness = fitness.saturating_add(1);
            }
        }
        TrainingFocus::Recovery => {
            // Recovery days give a tiny fitness nudge.
            let roll: f64 = rng.random_range(0.0..1.0);
            if roll < 0.05 && *fitness < 100 {
                *fitness = fitness.saturating_add(1);
            }
        }
        _ => {
            // Non-physical training: very slight decay if player is already very fit
            // (fitness above 85 needs active maintenance).
            if *fitness > 85 {
                let roll: f64 = rng.random_range(0.0..1.0);
                if roll < 0.05 {
                    *fitness = fitness.saturating_sub(1);
                }
            }
        }
    }
}

fn try_gain(current: &mut u8, gain: f64, rng: &mut impl Rng) {
    use rand::RngExt;
    if *current >= 99 {
        return;
    }
    let roll: f64 = rng.random_range(0.0..1.0);
    if roll < gain {
        *current = (*current + 1).min(99);
    }
}

/// Apply attribute gains based on training focus.
fn apply_focus_gains(
    attrs: &mut PlayerAttributes,
    focus: &TrainingFocus,
    gain: f64,
    rng: &mut impl Rng,
) {
    match focus {
        TrainingFocus::Physical => {
            try_gain(&mut attrs.pace, gain, rng);
            try_gain(&mut attrs.stamina, gain, rng);
            try_gain(&mut attrs.strength, gain, rng);
            try_gain(&mut attrs.agility, gain, rng);
        }
        TrainingFocus::Technical => {
            try_gain(&mut attrs.passing, gain, rng);
            try_gain(&mut attrs.shooting, gain, rng);
            try_gain(&mut attrs.dribbling, gain, rng);
        }
        TrainingFocus::Tactical => {
            try_gain(&mut attrs.positioning, gain, rng);
            try_gain(&mut attrs.vision, gain, rng);
            try_gain(&mut attrs.decisions, gain, rng);
            try_gain(&mut attrs.composure, gain, rng);
        }
        TrainingFocus::Defending => {
            try_gain(&mut attrs.tackling, gain, rng);
            try_gain(&mut attrs.defending, gain, rng);
            try_gain(&mut attrs.strength, gain * 0.5, rng);
            try_gain(&mut attrs.positioning, gain * 0.5, rng);
        }
        TrainingFocus::Attacking => {
            try_gain(&mut attrs.shooting, gain, rng);
            try_gain(&mut attrs.dribbling, gain, rng);
            try_gain(&mut attrs.pace, gain * 0.5, rng);
        }
        TrainingFocus::Recovery => {
            // No attribute gains on recovery days
        }
    }
}

/// Estimate player age from date_of_birth string ("YYYY-MM-DD").
fn estimate_age(dob: &str, as_of_year: u32) -> u32 {
    let parts: Vec<&str> = dob.split('-').collect();
    if parts.is_empty() {
        return 25; // fallback
    }
    let birth_year: u32 = parts[0].parse().unwrap_or(2000);
    as_of_year.saturating_sub(birth_year)
}

/// Recovery multiplier from age: younger players bounce back faster.
fn recovery_factor_from_age(age: u32) -> f64 {
    if age <= 21 {
        1.10
    } else if age <= 25 {
        1.05
    } else if age <= 29 {
        1.00
    } else if age <= 33 {
        0.85
    } else {
        0.70
    }
}

/// Recovery multiplier from morale: players in good spirits recover better.
fn recovery_factor_from_morale(morale: u8) -> f64 {
    if morale >= 70 {
        1.10
    } else if morale >= 40 {
        1.00
    } else {
        0.90
    }
}

/// Recovery multiplier from current condition: severely fatigued players recover more slowly.
fn recovery_factor_from_condition(condition: u8) -> f64 {
    if condition < 30 {
        1.20
    } else if condition < 50 {
        1.10
    } else {
        1.00
    }
}

/// Recovery multiplier from fitness: fitter players recover condition faster.
fn recovery_factor_from_fitness(fitness: u8) -> f64 {
    if fitness < 30 {
        0.95
    } else if fitness < 50 {
        0.98
    } else if fitness < 70 {
        1.00
    } else if fitness < 90 {
        1.12
    } else {
        1.20
    }
}

/// Clamp a fitness value to 0–100.
fn clamp_fitness(val: i16) -> u8 {
    val.clamp(0, 100) as u8
}

fn apply_goalkeeper_gains(attrs: &mut PlayerAttributes, focus: &TrainingFocus, gain: f64, rng: &mut impl Rng) {
    match focus {
        TrainingFocus::Technical => { try_gain(&mut attrs.handling, gain, rng); try_gain(&mut attrs.reflexes, gain, rng); try_gain(&mut attrs.passing, gain * 0.5, rng); }
        TrainingFocus::Defending => { try_gain(&mut attrs.positioning, gain, rng); try_gain(&mut attrs.aerial, gain, rng); try_gain(&mut attrs.handling, gain * 0.5, rng); }
        TrainingFocus::Attacking => { try_gain(&mut attrs.passing, gain, rng); try_gain(&mut attrs.decisions, gain * 0.5, rng); }
        _ => apply_focus_gains(attrs, focus, gain, rng),
    }
}

#[cfg(test)]
mod development_tests {
    use super::playing_time_growth_factor;

    #[test]
    fn young_regulars_develop_faster_than_unused_prospects() {
        assert!(playing_time_growth_factor(19, 1200) > playing_time_growth_factor(19, 0));
        assert_eq!(playing_time_growth_factor(19, 350), 0.8);
        assert_eq!(playing_time_growth_factor(29, 1200), 1.0);
    }
}

#[cfg(test)]
mod staff_index_tests {
    use super::*;
    use domain::staff::{Staff, StaffAttributes};

    fn coach(id: &str, team: Option<&str>, rating: u8) -> Staff {
        let mut value = Staff::new(
            id.into(),
            "Coach".into(),
            id.into(),
            "1980-01-01".into(),
            StaffRole::Coach,
            StaffAttributes {
                coaching: rating,
                judging_ability: 50,
                judging_potential: 50,
                physiotherapy: 50,
            },
        );
        value.team_id = team.map(str::to_string);
        value
    }

    #[test]
    fn staff_index_keeps_clubs_separate_and_excludes_unemployed_staff() {
        let staff = vec![
            coach("ours", Some("a"), 40),
            coach("theirs", Some("b"), 100),
            coach("free", None, 100),
        ];
        let indexed = index_staff_by_team(&staff);
        let bonus = compute_coaching_bonus(indexed.get("a").unwrap(), &TrainingFocus::Physical);
        assert!((bonus.coaching_mult - 1.05).abs() < f64::EPSILON);
        assert_eq!(indexed.len(), 2);
        assert_eq!(
            compute_coaching_bonus(&[], &TrainingFocus::Physical).coaching_mult,
            0.8
        );
    }

    #[test]
    #[ignore = "manual timing evidence; no machine-dependent assertion"]
    fn benchmark_world_staff_lookup() {
        use std::hint::black_box;
        use std::time::Instant;
        let teams: Vec<_> = (0..1200).map(|id| format!("team-{id}")).collect();
        let staff: Vec<_> = teams
            .iter()
            .flat_map(|team| (0..6).map(move |id| coach(&format!("{team}-{id}"), Some(team), 60)))
            .collect();
        let start = Instant::now();
        for _ in 0..20 {
            for team in &teams {
                let selected: Vec<_> = staff
                    .iter()
                    .filter(|s| s.team_id.as_deref() == Some(team.as_str()))
                    .collect();
                black_box(compute_coaching_bonus(&selected, &TrainingFocus::Physical));
            }
        }
        let scan = start.elapsed();
        let start = Instant::now();
        for _ in 0..20 {
            let indexed = index_staff_by_team(&staff);
            for team in &teams {
                black_box(compute_coaching_bonus(
                    indexed.get(team.as_str()).unwrap(),
                    &TrainingFocus::Physical,
                ));
            }
        }
        println!(
            "1200 clubs, 7200 staff, 20 days: scan={scan:?}, indexed={:?}",
            start.elapsed()
        );
    }
}

#[cfg(test)]
mod season_balance_tests {
    use super::*;
    use rand::SeedableRng;
    fn cohort_gain(age: u32, minutes: u32) -> f64 {
        let mut sum = 0.0;
        for seed in 0..64 {
            let attrs = serde_json::from_value(serde_json::json!({"pace":60,"stamina":60,"strength":60,"agility":60,"passing":60,"shooting":60,"tackling":60,"dribbling":60,"defending":60,"positioning":60,"vision":60,"decisions":60})).unwrap();
            let mut player = Player::new("p".into(), "P".into(), "Player".into(), format!("{}-01-01", 2026-age), "GB".into(), domain::player::Position::Forward, attrs);
            player.potential = 85;
            player.stats.minutes_played = minutes;
            player.morale = 80;
            refresh_player_derived(&mut player, 2026);
            let initial = player.ovr;
            let mut plan = TeamTrainingPlan { default_focus: TrainingFocus::Technical, intensity: TrainingIntensity::Medium, schedule: TrainingSchedule::Balanced,
                bonus: TeamCoachingBonus { coaching_mult: 1.3, specialization_mult: 1.25, physio_mult: 1.2, youth_mult: 1.2 }, medical_facility_mult: 1.2, group_overrides: Default::default() };
            let mut rng = rand::rngs::StdRng::seed_from_u64(seed);
            for day in 0..365 {
                plan.default_focus = match (day/28)%4 { 0 => TrainingFocus::Physical, 1 => TrainingFocus::Technical, 2 => TrainingFocus::Tactical, _ => TrainingFocus::Attacking };
                player.condition = 92;
                train_player(&mut player, &plan, &TrainingDay { weekday_num: day%7, year: 2026 }, &mut rng);
            }
            sum += f64::from(player.ovr.saturating_sub(initial));
        }
        sum / 64.0
    }
    #[test]
    fn goalkeepers_train_handling_and_reflexes_without_striker_gains() {
        let attrs = serde_json::from_value(serde_json::json!({"pace":60,"stamina":60,"strength":60,"agility":60,"passing":60,"shooting":60,"tackling":60,"dribbling":60,"defending":60,"positioning":60,"vision":60,"decisions":60,"handling":60,"reflexes":60,"aerial":60})).unwrap();
        let mut player = Player::new("keeper".into(), "G".into(), "Keeper".into(), "2007-01-01".into(), "GB".into(), domain::player::Position::Goalkeeper, attrs);
        player.potential = 85;
        player.stats.minutes_played = 1800;
        let plan = TeamTrainingPlan { default_focus: TrainingFocus::Technical, intensity: TrainingIntensity::Medium, schedule: TrainingSchedule::Balanced, bonus: TeamCoachingBonus { coaching_mult: 1.3, specialization_mult: 1.25, physio_mult: 1.2, youth_mult: 1.2 }, medical_facility_mult: 1.2, group_overrides: Default::default() };
        let mut rng = rand::rngs::StdRng::seed_from_u64(67);
        for day in 0..365 {
            player.condition = 92;
            train_player(&mut player, &plan, &TrainingDay { weekday_num: day % 7, year: 2026 }, &mut rng);
        }
        assert!(player.attributes.handling > 60);
        assert!(player.attributes.reflexes > 60);
        assert_eq!(player.attributes.shooting, 60);
        assert_eq!(player.attributes.dribbling, 60);
    }

    #[test]
    fn one_season_development_is_gradual_and_playing_time_matters() {
        let youth = cohort_gain(19, 1800);
        let unused = cohort_gain(19, 0);
        let veteran = cohort_gain(33, 1800);
        println!("365 days, 64 seeded players: youth={youth:.2}, unused={unused:.2}, veteran={veteran:.2} OVR");
        assert!((1.0..=6.0).contains(&youth));
        assert!(unused < youth * 0.8);
        assert!(veteran < youth * 0.6);
    }
}

