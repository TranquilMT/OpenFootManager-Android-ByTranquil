# ⚽ OFMtouch

**Build your club. Pick your team. Shape your tactics. Chase trophies.**

**OFMtouch** is a free, open-source football management game for Android, based on OpenFootManager and adapted into a touch-first mobile football-management experience by **TranquilMT**.

> 🧪 **v0.3.1 — NightlyPreRelease** is the active Android development line. Nightly builds are test releases and may contain unfinished features or bugs.

## 🚧 Latest development build

The current `android/migration` development head contains the newest Android optimisation work. GitHub Actions automatically validates new commits and produces numbered Android Nightly builds.

**Current source head:** `157661f`  
**Current Source Verification run:** #292 — running when this README was updated  
**Build identity shown in-game:** `Build #<build number> - v0.3.1 - NightlyPreRelease`

➡️ [Open the latest GitHub Actions builds](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/actions)

Because Nightly builds are generated continuously, use the newest **successful Android Nightly** workflow with an APK artifact rather than assuming the newest source-verification number is already installable.

## 📱 v0.3.1: Android navigation & mobile optimisation

The newest development pass focuses heavily on making OFMtouch behave like a proper Android game rather than a desktop interface running inside a phone window.

### Android gestures & navigation

- Android system Back/edge-swipe navigation is being integrated with the game's navigation history.
- Back gestures on nested game screens are intended to return through the game instead of unexpectedly terminating the application.
- The main-menu/root navigation state is protected against accidental edge-swipe exits.
- Browser/WebView history is now explicitly marked for the native Android runtime.
- Touch scrolling uses Android-friendly momentum behaviour and overscroll containment.
- Horizontal touch areas can use dedicated pan behaviour without making the rest of the interface feel like a desktop page.

### Modern Android display support

- Layout height now uses dynamic viewport sizing (`100dvh`) for modern Android WebViews.
- Safe-area handling accounts for display cut-outs, camera holes and gesture-navigation areas.
- Top navigation can respect the Android status-bar safe area.
- Bottom navigation and controls can respect the Android gesture-bar safe area.
- Full-screen pages have additional protection against buttons becoming trapped behind system UI.
- Fixed-position interface elements are constrained to the phone viewport.

### Better touch controls

- Native mobile buttons and interactive controls target at least 48px touch height.
- Existing game controls retain a minimum 44px accessibility target outside the native-mobile override.
- Tap feedback has been improved for controls designed to behave like mobile buttons.
- Touch controls use `touch-action` rules to reduce delayed or conflicting browser gestures.
- Images cannot be accidentally dragged while managing the game.
- Android long-press callout behaviour is suppressed where it interferes with the game UI.
- Hover-only desktop behaviour is removed on coarse-pointer/touch devices.

### Mobile forms & keyboard behaviour

- Inputs, selectors and text areas use mobile-safe sizing.
- Native mobile form fields use a 16px font size to prevent unwanted WebView/browser zoom when focused.
- Mobile forms can collapse to a single-column layout on narrow screens.
- Action groups can stack vertically where side-by-side desktop buttons would become cramped.
- Scrollable game pages retain room for the Android bottom safe area.

### Accessibility & performance polish

- Reduced-motion preferences disable or heavily shorten unnecessary animations and transitions.
- Touch feedback respects reduced-motion mode.
- High-contrast support remains integrated with the game's settings system.
- Lazy-loaded major screens reduce unnecessary startup work.
- Mobile scrolling is isolated so long management pages do not move the entire WebView unexpectedly.
- Global overscroll is disabled to reduce rubber-band/browser-style movement inside the native game shell.

## 🔎 Scouting & career improvements

Recent builds also expanded the football-management side of the game:

- Players can be added to a career-specific scouting shortlist.
- Shortlist cards expose position, age, overall rating, value and club information more clearly on phones.
- Scouting controls have larger Android-friendly touch targets and improved accessibility labels.
- Android backgrounding can trigger an autosave when unsaved career changes exist and autosave is enabled.
- Existing date-change and exit-save behaviour remains supported.
- The fictional portrait generator now draws from 16 source faces, reducing repeated-looking generated players.
- Portrait sources use original synthetic fictional footballer artwork rather than photographs of real players.

## 🌍 2026/27 leagues, clubs & ratings

The generated starting world has received a substantial balancing pass:

- Manchester United, Arsenal, Chelsea and Liverpool are placed in the Premier League.
- Birmingham City is placed in the Championship.
- The English pyramid includes 20 Premier League and 24 Championship clubs.
- Manchester United, Arsenal, Chelsea and Liverpool receive stronger generated squads appropriate to elite English clubs.
- Manchester United's generated starting squad targets an average of at least 86, with comparable balancing applied to other elite clubs.
- Featured European clubs receive club-specific strength profiles, including Bayern München and Paris Saint-Germain.
- Spain, Germany, Italy, France, Portugal and the Netherlands have additional featured-club balancing.
- Brazil and Argentina receive stronger South American club profiles.
- United States clubs receive improved generated-player quality and remain under North America.
- Japan, South Korea and Saudi Arabia receive stronger Asian club profiles.
- Simulation scope can include domestic leagues outside the manager's home region, allowing careers to simulate Europe, the Americas and Asia together.
- Elite players can reach 96 overall, while that level remains deliberately rare.
- Second-tier leagues can still produce standout players capable of influencing promotion races.

These are OFMtouch game-balance ratings. Curated club/division placement is combined with procedurally generated player identities in the default generated world.

## ⚽ Match engine, commentary & gameplay fixes

- Generated top-division clubs can contain featured elite outfield players.
- Rating ceilings, potential, scouting estimates, form and match-strength helpers support the expanded 96-point range.
- Generated clubs receive additional position-balanced free agents in the starting market.
- Match commentary includes substantially more event variation.
- Goal reactions are more expressive.
- Shots can strike the crossbar or post in live and instant simulation.
- Woodwork events have matching commentary.
- Corner and free-kick narration has been expanded.
- Optional spoken commentary is available on supported devices.
- Live-match steps are protected against overlapping Android backend requests.
- Legacy injury identifiers such as `.calfinjury` are converted into readable injury descriptions instead of appearing as raw internal codes.
- Lineup logic better balances player ability and fitness.
- Substitution decisions can consider fatigue and match context.
- Short-term form and morale effects have been rebalanced so they do not overwhelm player quality.
- Injury risk responds more naturally to age and condition.
- Goalkeepers use a different ageing curve from outfield players.

## 🔄 Transfers, contracts & squad building

- AI recruitment considers positional needs.
- Clubs are more reluctant to sell important first-team players.
- Surplus players are more likely to become available.
- Clubs preserve part of their transfer budget instead of automatically spending everything.
- Wage headroom is considered during recruitment.
- Player willingness to move better reflects the clubs involved.
- Young-player loan logic has been improved.
- Free agents have more flexible wage expectations.
- Contract lengths vary with player age and squad role.
- Important players receive greater renewal priority.
- Transfer and loan offers use more touch-friendly mobile controls.
- Accept, reject and counter-offer actions are available without desktop-specific interactions.

## 👤 Player generation & development

- Generated players have a wider ability distribution.
- Club reputation and league level influence generated player quality.
- Lower-level teams can contain players in the 40s and 50s while elite squads can contain genuine stars.
- Elite players are intentionally uncommon.
- Young prospects can have lower current ability but significantly higher potential.
- Position-specific attribute profiles differentiate goalkeepers, defenders, midfielders, wingers and strikers.
- Squad age profiles include prospects, prime-age players and veterans.
- Veteran decline and youth development have been rebalanced.
- Playing time and training can influence development.
- Player values and wage expectations better account for ability, potential, age and club stature.
- Youth-intake quality can benefit from stronger club facilities.

## 📱 Mobile-first interface

Across the wider 0.3.x development line:

- Larger touch targets throughout menus and management screens.
- Improved vertical scrolling on phone displays.
- Better horizontal touch scrolling for data-heavy screens.
- Compact phone cards replace desktop-style tables on more screens.
- Tactics work with taps and tap-and-hold interactions.
- Player swapping does not require desktop drag-and-drop.
- Match-day controls are adapted for small screens.
- Squad management has phone-oriented layouts.
- Scouting and youth recruitment controls are enlarged and reorganised.
- Finance, payroll and facility screens have improved responsive layouts.
- Inbox messages and actions are easier to operate one-handed.
- Fixtures, standings and calendar controls have larger targets.
- Youth academy prospects have a dedicated mobile presentation.
- Staff-management filters and actions are touch-friendly.
- Transfer-market filters and offer controls are adapted for phones.
- Player profiles have responsive layouts and mobile management actions.
- Main-menu and manager-creation flows support smaller displays more reliably.
- Dashboard navigation is designed around touch interaction.
- Settings switches use full touch targets and correctly positioned thumbs.
- Rapid setting changes are saved in order.

## 💾 Career reliability

- Autosave can write progress after the in-game date changes.
- Android backgrounding can protect unsaved progress.
- Confirmation settings can prompt before advancing to the next day.
- Skip-to-match continues through quiet days and stops at a scheduled match or blocking action.
- Fatigue alone does not incorrectly block skip-to-match.
- Inbox replies report failed actions instead of silently appearing successful.
- Older inbox requests cannot overwrite newer reply/update state.
- International fixtures display country names cleanly.
- World Cup squads select highly rated eligible generated players for each nation.

## 🎮 What can you do?

- 🏟️ Manage a football club
- 👥 Build and develop your squad
- 📋 Select your starting XI
- 🧠 Create formations and tactics
- 🔄 Make substitutions and match-day decisions
- 🔎 Scout players and young prospects
- 💰 Buy, sell and loan players
- 📅 Play through fixtures and competitions
- 🏆 Compete for league and cup trophies
- 📈 Develop players over multiple seasons
- 💼 Manage finances, staff and football operations
- 🎓 Build your youth academy
- 🌍 Simulate leagues across multiple regions
- 💾 Save and continue long-term careers

## 🧪 Recent Nightly history

| Build | Highlights |
| --- | --- |
| **#280** | Large gameplay/commentary/settings sweep, expanded 96 OVR support, woodwork events, injury-code fix and mobile regressions. |
| **#281** | 2026/27 league placement and stronger club-specific ratings across Europe, USA, Brazil and Asia. |
| **#283** | Career scouting shortlist, Android background autosave and expanded fictional portrait variety. |
| **#285** | v0.3.1 `NightlyPreRelease` player-facing build identity. |
| **Current development** | Android Back/edge gesture work, safe areas, dynamic viewport sizing, larger native touch targets, touch scrolling and mobile WebView optimisation. |

Nightly numbering can advance more quickly than feature groups because source verification and Android workflows are continuously triggered while development is active.

## 📦 Download & testing

**Version line:** v0.3.1 NightlyPreRelease  
**Platform:** Android  
**Primary target:** ARM64  
**Status:** active pre-release development

➡️ [GitHub Actions — newest builds](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/actions)

For installation, open the newest **successful Android Nightly** workflow and download its APK artifact. Source Verification runs validate the source but do not themselves contain an APK.

Nightly builds are intended for testing. If you encounter a crash, broken screen, incorrect football data, touch-control problem, Android gesture issue, clipped UI or career simulation problem, please report the screen and action that caused it so it can be reproduced.

## 🗺️ Development direction

The current mobile roadmap includes:

- More Android system-gesture integration.
- Deliberate exit confirmation instead of accidental app closure.
- Better portrait-mode compression for dense management screens.
- More one-handed navigation patterns.
- Improved soft-keyboard handling.
- Additional Android lifecycle/save-resume protection.
- Haptic feedback where it improves touch interactions.
- Performance tuning for lower-end Android phones.
- Continued match-engine and career simulation regression testing.
- Further league, club and generated-player balancing.
- More fictional portrait variety.
- Continued accessibility improvements.

## ❤️ Credits

**Original game:** OpenFootManager and its original developers/contributors  
**OFMtouch Android adaptation, mobile enhancements and additional gameplay work:** TranquilMT

OFMtouch is an independent, fan-made open-source project and is not an official upstream OpenFootManager Android release.

The source code and licence information remain available in this repository for anyone who wants to follow development, contribute or improve the project.

---

### ⚽ Your club. Your tactics. Your career.

**OFMtouch v0.3.1 NightlyPreRelease — active Android development.**
