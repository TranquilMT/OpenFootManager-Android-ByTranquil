# Android Mobile-First Requirements

## Product direction

OpenFootManager Android must preserve the gameplay depth, systems and management features of desktop OpenFootManager, but it must NOT reproduce or squeeze the desktop interface onto a phone.

The Android application is a native-feeling, mobile-first adaptation designed around touch screens.

## Core principles

- Desktop gameplay/features are the functional reference; desktop UI is not.
- Generated worlds and generated players are the starter-build baseline.
- Portrait and landscape receive intentional layouts rather than simple scaling.
- Primary navigation uses mobile patterns such as bottom navigation, tabs, drawers, cards, sheets and full-screen detail views.
- No gameplay action may depend on hover, right-click, mouse wheel or a physical keyboard.
- Touch targets should normally be at least 48dp.
- Android Back closes sheets/dialogs first, then navigates back, and must not accidentally destroy a career.
- Use haptic feedback selectively for meaningful actions where supported.
- Respect display cutouts, gesture-navigation insets and the software keyboard.

## Mobile information architecture

### Home / Manager Hub

Provide a glanceable dashboard with next fixture, inbox, club status, league position, objectives and actionable alerts. Avoid desktop-style information walls.

### Navigation

Keep the most frequent destinations immediately accessible. Less frequent management sections belong in a clearly structured More/Menu surface rather than an oversized desktop sidebar.

### Squad

Use mobile-friendly player rows/cards with sorting and filtering. Opening a player moves to a dedicated detail view. Preserve detailed data through tabs/sections rather than forcing a desktop table onto a narrow display.

### Tactics

Provide a touch-native pitch. Tap a player or position to select/change it. Drag-and-drop may be optional, but every operation must have a tap-based equivalent. Formation, roles, mentality and instructions should use sheets/tabs suitable for a phone.

### Match day

Prioritize score, clock, events and essential match controls. Statistics, commentary, tactics and substitutions should be reachable through mobile tabs/sheets. Controls must remain usable one-handed where practical.

### Transfers and scouting

Use search/filter surfaces designed for touch, compact result cards/rows, saved shortlists and dedicated player detail screens. Do not expose desktop filter panels unchanged.

### Competitions and fixtures

Use mobile fixture cards, tabs and vertically readable tables. Detailed standings may scroll where necessary, but the default presentation should prioritize key columns.

### Inbox / news

Use a mobile message list and full-screen message reader with clear contextual actions.

### Club / finance / staff

Use summary cards and drill-down screens. Preserve all management information while progressively disclosing detail.

## Orientation

Portrait is a first-class experience and should be comfortable for normal management. Landscape may expose richer pitch/match layouts and additional simultaneous information, but must not be required to access features.

## Starter build completion gate

A starter build is playable only when a user can, entirely by touch:

1. Launch the Android app.
2. Create a generated New Career.
3. Select/manage a club.
4. Navigate the core management areas.
5. Select a team and change tactics.
6. Play a complete match.
7. Use transfers/scouting and inbox flows sufficiently for career progression.
8. Save the career.
9. Close/reopen the application.
10. Load and continue the saved career.

The ARM64 APK must then be produced and its artifact, package, ABI and signing state verified.

## Deferred

External real-player, ratings and World Cup database integration remains deferred until this generated-world mobile baseline is stable.
