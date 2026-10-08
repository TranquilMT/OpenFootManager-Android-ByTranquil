import { describe, expect, it } from "vitest";

import type { MessageData } from "../../store/gameStore";
import {
  getFilteredMessages,
  DECISIONS_FILTER,
  sortDecisionMessages,
  getNavigationTarget,
  isNavigateAction,
  isChooseOptionAction,
  isPlayerEventMessage,
  isOfferReviewNavigation,
  sortInboxMessages,
  UNREAD_FILTER,
} from "./inboxHelpers";

function createMessage(overrides: Partial<MessageData> = {}): MessageData {
  return {
    id: "m1",
    subject: "Subject",
    body: "Body",
    sender: "Sender",
    sender_role: "Role",
    date: "2025-01-01",
    read: false,
    category: "System",
    priority: "Normal",
    actions: [],
    context: {
      team_id: null,
      player_id: null,
      fixture_id: null,
      match_result: null,
    },
    ...overrides,
  };
}

describe("inboxHelpers", () => {
  it("rejects malformed legacy action payloads without throwing", () => {
    for (const value of [
      null,
      { NavigateTo: null },
      { NavigateTo: { route: 1 } },
      { ChooseOption: null },
    ]) {
      const action = value as unknown as MessageData["actions"][number]["action_type"];
      expect(isNavigateAction(action)).toBe(false);
      expect(isChooseOptionAction(action)).toBe(false);
      expect(
        getFilteredMessages(
          [
            createMessage({
              actions: [{ id: "a", label: "a", resolved: false, action_type: action }],
            }),
          ],
          DECISIONS_FILTER,
        ),
      ).toEqual([]);
    }
  });
  it("parses profile identifiers independently from query and fragment data", () => {
    expect(getNavigationTarget("/player/player%2099?source=inbox#details").context).toEqual({
      messageId: "player 99",
    });
    expect(getNavigationTarget("/dashboard?tab=Squad#details").tab).toBe("Squad");
    expect(getNavigationTarget("/dashboard?tab=NotATab").tab).toBe("Home");
  });
  it("keeps read but unresolved decisions and prioritises urgent choices", () => {
    const choice = {
      id: "choose",
      label: "Choose",
      resolved: false,
      action_type: { ChooseOption: { options: [] } },
    };
    const messages = [
      createMessage({ id: "normal", read: true, actions: [choice], date: "2026-08-20" }),
      createMessage({ id: "urgent", priority: "Urgent", actions: [choice], date: "2026-08-01" }),
      createMessage({ id: "resolved", actions: [{ ...choice, resolved: true }] }),
      createMessage({
        id: "profile",
        actions: [
          {
            id: "view",
            label: "View",
            resolved: false,
            action_type: { NavigateTo: { route: "/player/p1" } },
          },
        ],
      }),
    ];
    const pending = getFilteredMessages(messages, DECISIONS_FILTER);
    expect(sortDecisionMessages(pending, "newest").map((message) => message.id)).toEqual([
      "urgent",
      "normal",
    ]);
  });

  it("includes outstanding transfer reviews without treating profile links as decisions", () => {
    const messages = [
      createMessage({
        id: "transfer_offer_p1",
        actions: [
          {
            id: "review",
            label: "Review",
            resolved: false,
            action_type: { NavigateTo: { route: "/dashboard?tab=Transfers" } },
          },
        ],
      }),
    ];
    expect(getFilteredMessages(messages, DECISIONS_FILTER)).toHaveLength(1);
    messages[0].actions[0].resolved = true;
    expect(getFilteredMessages(messages, DECISIONS_FILTER)).toHaveLength(0);
  });

  it("filters unread and category-specific message sets", () => {
    const messages = [
      createMessage({ id: "m1", read: false, category: "System" }),
      createMessage({ id: "m2", read: true, category: "Finance" }),
      createMessage({ id: "m3", read: false, category: "Finance" }),
    ];

    expect(getFilteredMessages(messages, UNREAD_FILTER).map((message) => message.id)).toEqual([
      "m1",
      "m3",
    ]);
    expect(getFilteredMessages(messages, "Finance").map((message) => message.id)).toEqual([
      "m2",
      "m3",
    ]);
  });

  it("sorts inbox messages by newest or oldest date", () => {
    const messages = [
      createMessage({ id: "m1", date: "2025-01-03" }),
      createMessage({ id: "m2", date: "2025-01-01" }),
      createMessage({ id: "m3", date: "2025-01-02" }),
    ];

    expect(sortInboxMessages(messages, "newest").map((message) => message.id)).toEqual([
      "m1",
      "m3",
      "m2",
    ]);
    expect(sortInboxMessages(messages, "oldest").map((message) => message.id)).toEqual([
      "m2",
      "m3",
      "m1",
    ]);
  });

  it("maps team, tab, and simple routes into dashboard navigation targets", () => {
    expect(getNavigationTarget("/team/team-99")).toEqual({
      tab: "__selectTeam",
      context: { messageId: "team-99" },
      shouldResolveAction: false,
    });

    expect(getNavigationTarget("/player/player-99")).toEqual({
      tab: "__selectPlayer",
      context: { messageId: "player-99" },
      shouldResolveAction: false,
    });

    expect(getNavigationTarget("/dashboard?tab=Squad")).toEqual({
      tab: "Squad",
      shouldResolveAction: false,
    });

    expect(getNavigationTarget("/transfers")).toEqual({
      tab: "Transfers",
      shouldResolveAction: false,
    });
  });

  it("recognizes player-event message prefixes", () => {
    expect(isPlayerEventMessage("morale_talk_p1")).toBe(true);
    expect(isPlayerEventMessage("contract_concern_p2")).toBe(true);
    expect(isPlayerEventMessage("plain_message")).toBe(false);
  });
  it("rejects malformed individual choice options before rendering decision controls", () => {
    for (const option of [null, {}, { id: "x", label: 1, description: "d" }, { id: "x", label: "l", description: null }]) {
      expect(isChooseOptionAction({ ChooseOption: { options: [option] } } as unknown as MessageData["actions"][number]["action_type"])).toBe(false);
    }
  });
  it("rejects ambiguous duplicate identifiers in decision options", () => {
    expect(isChooseOptionAction({ ChooseOption: { options: [{ id: "same", label: "Yes", description: "" }, { id: "same", label: "No", description: "" }] } })).toBe(false);
  });
  it("normalises internal navigation and ignores external or fragment-only destinations", () => {
    expect(getNavigationTarget(" /player/p1 ").tab).toBe("__selectPlayer");
    expect(getNavigationTarget("/manager#notes?tab=Transfers").tab).toBe("Manager");
    expect(getNavigationTarget("https://example.test/?tab=Transfers").tab).toBe("Home");
    expect(getNavigationTarget("//example.test/player/p1?tab=Transfers").tab).toBe("Home");
  });
  it("recognises direct transfer review routes using the shared navigation parser", () => {
    expect(isOfferReviewNavigation("transfer_offer_p1", { NavigateTo: { route: "/transfers" } })).toBe(true);
    expect(isOfferReviewNavigation("loan_offer_p1", { NavigateTo: { route: "/dashboard?tab=transfers#offer" } })).toBe(true);
    expect(isOfferReviewNavigation("transfer_offer_p1", { NavigateTo: { route: "https://example.test/?tab=Transfers" } })).toBe(false);
  });
});
