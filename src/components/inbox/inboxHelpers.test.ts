import { describe, expect, it } from "vitest";

import type { MessageData } from "../../store/gameStore";
import {
  getFilteredMessages,
  DECISIONS_FILTER,
  sortDecisionMessages,
  getNavigationTarget,
  isPlayerEventMessage,
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
      shouldResolveAction: true,
    });

    expect(getNavigationTarget("/transfers")).toEqual({
      tab: "Transfers",
      shouldResolveAction: true,
    });
  });

  it("recognizes player-event message prefixes", () => {
    expect(isPlayerEventMessage("morale_talk_p1")).toBe(true);
    expect(isPlayerEventMessage("contract_concern_p2")).toBe(true);
    expect(isPlayerEventMessage("plain_message")).toBe(false);
  });
});
