# ⚽ OFMtouch

**Build your club. Pick your team. Shape your tactics. Chase trophies.**

**OFMtouch** is a free, open-source football management game for Android, based on OpenFootManager and adapted for a touch-first mobile experience by **TranquilMT**.

> 🧪 **0.3.0 Nightly is ready for testing** — this is a major gameplay and mobile update. Nightly builds are test releases, so you may still find bugs while playing.

## Next gameplay and narration update

- Generated top-division clubs now have a featured outfield player; many reach 90+, while a 96-rated player remains rare. Clubs in the next tiers can also produce standout players to drive promotion campaigns.
- Rating ceilings, potential, scouting estimates, form and match-strength helpers now accept the expanded 96-point range together.
- Every generated club adds a position-balanced local free agent to the starting market, increasing the number of available players without changing squad limits.
- The portrait generator has two more fictional source faces, and background generation covers more players while prioritising the next opponent across league and cup fixtures.
- Match commentary has 192 additional event lines across all 12 supported languages, plus new corner and free-kick narration. Supported devices can enable optional spoken commentary during live matches.
- Goals now get punchier reactions, and occasional shots genuinely strike the crossbar or post in both live and instant simulation, with a matching woodwork call in every supported language.
- Live match steps cannot overlap while the Android backend responds. Legacy injury codes such as `.calfinjury` display as a readable calf strain in inbox messages and injury panels.
- Frontend verification: 1,563 tests across 195 files passed; lint, locale coverage and the production web build passed. Android backend compilation and an APK containing these changes are pending the next Android workflow.

The preceding mobile sweep shipped in [Android Nightly #279](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/actions/runs/36273749888). The updates above will be in a subsequent build.

## Latest mobile gameplay sweep

- Career creation accepts managers aged 18 and over, with matching validation in the Android backend and the creation form.
- Team selection lists every competition in the generated world, including leagues outside England and South America, so inactive leagues can be enabled before choosing a club.
- Generated clubs in the top two league tiers receive a wider spread of standout players without raising every squad member.
- International fixtures show country names such as England and Spain; existing saves with older national-team names display cleanly. World Cup squads select the highest-rated eligible generated players in each nation.
- Inbox replies now show an error if an action fails, and an older message fetch cannot overwrite a newer reply or inbox update.
- Scouting actions are available from the player search context menu on both the phone card and the table view. Payroll rows respond to keyboard activation, and transfer deal details remain visible.
- The mobile match path, scheduling, squad, dashboard, transfers, scouting, inbox, and team-selection screens received regression checks. The frontend suite passes 1,559 tests across 194 files; the production web build and lint checks pass.
- The skip-to-match control keeps advancing through quiet days and pauses at a scheduled match or a blocking action; fatigue by itself is not a blocker.

The next Android APK must be built from the commits containing this sweep. The earlier build #278 predates these fixes.

## 🌟 What's new in 0.3.0?

This release brings a large update to the career experience, with major improvements to generated players, clubs, transfers, progression and Android usability.

### 👤 Better player generation

- Generated players now have a much wider and more believable range of ability.
- Player quality is influenced by the level and strength of the club they play for.
- Lower-level teams can have players in the 40s and 50s, while stronger leagues produce stronger squads.
- Elite clubs can generate genuine top-level players instead of every squad feeling similar.
- Young prospects can begin with lower current ability while having much higher long-term potential.
- Player potential now takes age and club environment into account.
- Goalkeepers, defenders, midfielders, wingers and strikers receive more position-appropriate attribute profiles.
- Elite players are deliberately rarer, making standout talent feel more valuable.
- Squad age profiles now include a healthier mix of prospects, prime-age players and veterans.
- Veteran decline and youth development have been rebalanced.
- Playing time and training can have a more meaningful effect on development.
- Player values and wage demands now better reflect ability, potential, age and club stature.

### 🏟️ Better club & squad generation

- Clubs now build squads around their level, reputation and financial strength.
- Stronger and wealthier clubs can support higher-quality players and larger wages.
- Starting elevens, substitutes and squad players now have a more natural quality spread.
- Squad generation considers positional coverage instead of simply filling a team with similar players.
- Clubs are less likely to stockpile too many players in the same position.
- Youth players are represented more naturally within generated squads.
- Squad wage budgets and transfer budgets are better connected to club stature.
- Promotion and relegation can affect squad building and finances over time.
- Club reputation can evolve as results and seasons progress.
- Generated teams have additional balancing to keep leagues competitive without making every club equal.

### 🔄 Transfers & contracts

- Transfer recruitment now considers positional needs.
- Clubs are more careful about selling important first-team players.
- Surplus players are more likely to become available.
- Transfer budgets keep a reserve instead of clubs spending everything immediately.
- Wage-budget headroom is considered when building and improving squads.
- Player willingness to move is better connected to the clubs involved.
- Young prospects have improved loan logic.
- Free agents have more flexible wage expectations.
- Contract lengths vary more naturally with player age and squad role.
- Contract renewals give greater priority to important players.
- Transfer and loan offers are now easier to review and respond to on mobile.
- Accept, reject and counter-offer actions are available through touch-friendly controls.

### ⚽ Gameplay & career tweaks

- Player ability is translated into match strength with additional balancing.
- Strong teams retain an advantage while upset results remain possible.
- Fitness now has a more meaningful influence on performance.
- Short-term form has been rebalanced so it helps without overpowering player quality.
- Morale effects are more controlled.
- Injury risk now varies more naturally with age and player condition.
- Goalkeepers have a different ageing curve from outfield players.
- Captaincy considers leadership and suitability rather than simply picking a highly rated player.
- Substitution decisions can take fatigue and the match situation into account.
- Lineup selection better balances ability and fitness.
- Youth intake quality can benefit from stronger club facilities.
- Homegrown-player development and eligibility have received additional support.
- Scouting information includes more uncertainty when knowledge of a player is limited.
- Career progression systems now work together with the updated generated-player model.

## 📱 Major Android & touch improvements

0.3.0 also contains a large mobile-first interface pass across the game:

- 👆 Larger touch targets throughout menus and management screens.
- 📜 Improved vertical scrolling on phone displays.
- ↔️ Better horizontal touch scrolling where wide information is still required.
- 📱 More screens now use compact mobile cards instead of desktop-style tables.
- 🧠 Tactics are easier to operate with taps and tap-and-hold actions.
- 🔁 Player swapping can be performed without relying on desktop drag-and-drop controls.
- ⚽ Match-day controls have been adapted for smaller screens.
- 👥 Squad management is easier to navigate on touch devices.
- 🔎 Scouting and youth recruitment controls have been enlarged and reorganised.
- 💰 Finance, payroll and facility screens have improved phone layouts.
- 📩 Inbox controls and message views are more comfortable on mobile.
- 📅 Fixtures, standings and calendar controls have received mobile layouts and larger targets.
- 🎓 Youth academy prospects now have a dedicated phone-friendly presentation.
- 🧑‍💼 Staff management filters and actions are easier to use by touch.
- 🔄 Transfer-market filters, player results and offer actions have improved mobile layouts.
- 👤 Player profiles have improved responsive layouts and management actions.
- 🏠 The main menu and manager creation flow now handle smaller displays more reliably.
- 🛡️ Safe-area handling has been improved for modern Android screens.
- 📐 Layouts have been tightened to reduce clipped buttons, overflowing panels and unreachable controls.
- 🎮 Dashboard navigation has been reworked for a more comfortable phone experience.
- ✨ Numerous interface and touch-layout regressions have been cleaned up across the game.

## 🎮 What can you do?

- 🏟️ Manage your own football club
- 👥 Build and develop your squad
- 📋 Pick your starting XI
- 🧠 Create formations and tactics
- 🔄 Make substitutions and match-day decisions
- 🔎 Scout players and young prospects
- 💰 Buy, sell and loan players
- 📅 Play through fixtures and competitions
- 🏆 Climb the table and compete for trophies
- 📈 Develop players and your club over multiple seasons
- 💼 Manage finances, staff and football operations
- 🎓 Develop your youth academy
- 💾 Save your career and continue your journey

## 📦 Download OFMtouch 0.3.0 Nightly

**Version:** 0.3.0 Nightly  
**Platform:** Android  
**Current target:** ARM64

The latest test APK is published through this repository's **GitHub Actions / Releases** as builds become available.

0.3.0 is a **Nightly test release**. You're welcome to install it, start a career and put the new systems through their paces. If something behaves unexpectedly, crashes, becomes difficult to use on your phone, or produces strange career results, feedback is very welcome.

## ❤️ Credits

**Original game:** OpenFootManager and its original developers/contributors  
**OFMtouch Android adaptation, mobile enhancements and additional gameplay work:** TranquilMT

OFMtouch is an independent, fan-made open-source project and is not an official upstream OpenFootManager Android release.

The source code and licence information remain available in this repository for everyone who wants to follow, contribute to or improve the project.

---

### ⚽ Your club. Your tactics. Your career.

**OFMtouch 0.3.0 Nightly — now ready for Android testing.**
