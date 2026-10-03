use super::*;

fn sponsor_message(amount: u64) -> InboxMessage {
    let mut params = HashMap::new();
    params.insert("amount".to_string(), amount.to_string());
    params.insert("sponsor".to_string(), "Test Sponsor".to_string());
    InboxMessage {
        id: "sponsor_2025-06-15".to_string(),
        subject: "Sponsorship Offer".to_string(),
        body: "Test sponsor offer".to_string(),
        sender: "Commercial Director".to_string(),
        sender_role: "Commercial Director".to_string(),
        date: "2025-06-15".to_string(),
        read: false,
        category: MessageCategory::Finance,
        priority: MessagePriority::Normal,
        actions: vec![MessageAction {
            id: "respond".to_string(),
            label: "Respond".to_string(),
            action_type: ActionType::ChooseOption {
                options: vec![
                    ActionOption {
                        id: "accept".to_string(),
                        label: "Accept".to_string(),
                        description: "Accept the deal".to_string(),
                        label_key: None,
                        description_key: None,
                    },
                    ActionOption {
                        id: "decline".to_string(),
                        label: "Decline".to_string(),
                        description: "Decline the offer".to_string(),
                        label_key: None,
                        description_key: None,
                    },
                ],
            },
            resolved: false,
            label_key: None,
        }],
        context: MessageContext::default(),
        subject_key: None,
        body_key: None,
        sender_key: None,
        sender_role_key: None,
        i18n_params: params,
    }
}

#[test]
fn apply_sponsor_accept_adds_finance() {
    let mut game = make_game();
    let initial_finance = game.teams[0].finance;
    game.messages.push(sponsor_message(100_000));

    let result = apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept");

    assert!(result.is_some());
    let effect = result.unwrap();
    assert_eq!(effect.i18n_key, "be.msg.sponsor.effects.accepted");
    assert_eq!(
        effect.i18n_params.get("amount"),
        Some(&"100000".to_string())
    );
    assert_eq!(game.teams[0].finance, initial_finance);
    assert_eq!(game.teams[0].season_income, 0);
    let sponsorship = game.teams[0]
        .sponsorship
        .as_ref()
        .expect("accepted sponsor should create active sponsorship state");
    assert_eq!(sponsorship.base_value, 100_000);
    assert_eq!(sponsorship.remaining_weeks, 12);
    assert_eq!(sponsorship.sponsor_name, "Test Sponsor");
    assert!(matches!(
        sponsorship.bonus_criteria.as_slice(),
        [SponsorshipBonusCriterion::UnbeatenRun { .. }]
    ));
    // Actions should be resolved
    let msg = game
        .messages
        .iter()
        .find(|m| m.id == "sponsor_2025-06-15")
        .unwrap();
    assert!(msg.actions.iter().all(|a| a.resolved));
}

#[test]
fn apply_sponsor_decline_no_finance_change() {
    let mut game = make_game();
    let initial_finance = game.teams[0].finance;
    game.messages.push(sponsor_message(100_000));

    let result = apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "decline");

    assert!(result.is_some());
    assert_eq!(result.unwrap().i18n_key, "be.msg.sponsor.effects.declined");
    assert_eq!(game.teams[0].finance, initial_finance);
    assert!(game.teams[0].sponsorship.is_none());
    let msg = game
        .messages
        .iter()
        .find(|m| m.id == "sponsor_2025-06-15")
        .unwrap();
    assert!(msg.actions.iter().all(|a| a.resolved));
}

#[test]
fn apply_sponsor_unknown_option_returns_none() {
    let mut game = make_game();
    game.messages.push(sponsor_message(100_000));
    let result = apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "unknown");
    assert!(result.is_none());
}

#[test]
fn apply_sponsor_no_manager_team_returns_none() {
    let mut game = make_game();
    game.manager.team_id = None;
    game.messages.push(sponsor_message(100_000));
    let result = apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept");
    assert!(result.is_none());
}

#[test]
fn apply_sponsor_accept_parses_formatted_amount_param() {
    let mut game = make_game();
    let mut message = sponsor_message(100_000);
    message
        .i18n_params
        .insert("amount".to_string(), "100,000".to_string());
    game.messages.push(message);

    let result = apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept");

    assert!(result.is_some());
    let sponsorship = game.teams[0]
        .sponsorship
        .as_ref()
        .expect("accepted sponsor should create active sponsorship state");
    assert_eq!(sponsorship.base_value, 100_000);
}

#[test]
fn apply_sponsor_accept_parses_compact_amount_param_from_existing_messages() {
    let mut game = make_game();
    let mut message = sponsor_message(100_000);
    message
        .i18n_params
        .insert("amount".to_string(), "1.2M".to_string());
    game.messages.push(message);

    let result = apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept");

    assert!(result.is_some());
    let sponsorship = game.teams[0]
        .sponsorship
        .as_ref()
        .expect("accepted sponsor should create active sponsorship state");
    assert_eq!(sponsorship.base_value, 1_200_000);
}


#[test]
fn sponsor_response_cannot_replace_active_contract_or_replay() {
    let mut game = make_game();
    game.messages.push(sponsor_message(100_000));
    assert!(apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept").is_some());
    let existing = game.teams[0].sponsorship.clone();
    game.messages.push(sponsor_message(200_000));
    assert!(apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept").is_none());
    assert_eq!(game.teams[0].sponsorship, existing);
}

#[test]
fn missing_sponsor_amount_never_invents_a_contract() {
    let mut game = make_game();
    let mut message = sponsor_message(100_000);
    message.i18n_params.remove("amount");
    game.messages.push(message);
    assert!(apply_event_response(&mut game, "sponsor_2025-06-15", "respond", "accept").is_none());
    assert!(game.teams[0].sponsorship.is_none());
}
