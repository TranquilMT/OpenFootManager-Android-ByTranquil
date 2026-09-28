# ⚽ OFMtouch

**Your club. Your tactics. Your career. Anywhere.**

OFMtouch is a free football management game built for Android. Take charge of a club, build your squad, scout talent, shape your tactics, develop young players and compete across multiple seasons in a growing football world.

> 🧪 **Current version: v0.3.5 NightlyPreRelease**
> **Latest Android APK and checksum:** [Build 314 artifact](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/actions/runs/36365617607/artifacts/10948075994). Build 313 has a known mobile message-reading layout issue; use build 314. The updated Inbox layout still needs confirmation on a physical phone.
> **Matching source ZIP:** [download build 314 source](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/archive/7159d091721a99b88219971099c21530addba92e.zip)
> **Source revision:** `7159d091721a99b88219971099c21530addba92e` (ARM64, Android only)
> NightlyPreRelease builds are playable test versions. New features and fixes arrive regularly, but some bugs and unfinished areas may remain. GitHub Actions runs the frontend and Rust tests, checks package/version/signature and ARM64 payload, and publishes the APK plus its SHA-256 file.

## 🌟 Welcome to OFMtouch! Here's what's new in v0.3.5

v0.3.5 is not the introduction of Player Development V2.0 or Transfer Market V2.0 — both systems began in the previous update. This release **substantially expands and connects them to the wider career simulation**, turning them from individual features into systems that increasingly influence club strategy, recruitment, loans, squad building and long-term player careers.

### 🎓 Player Development V2.0 — Expanded

- Development is now more tightly connected to **competitive playing time**, making squad selection matter more to a prospect's career.
- Young-player development is connected to the wider club strategy/world simulation instead of operating as an isolated progression calculation.
- **Strategic loans now form part of the development pathway**: clubs can identify young players who need minutes and seek more suitable loan opportunities.
- Loan decisions consider the needs of both the developing player and the clubs involved.
- Potential, current ability, age and opportunity have greater influence over how a player is treated by the simulation.
- Elite development remains deliberately rare, preserving the importance of exceptional prospects and 90+ OVR players.
- Featured-player generation has been stabilised around club identity, improving the quality distribution of generated squads.
- Generated rating ceilings have been aligned with the latest player model, including extremely rare players reaching **96 OVR**.
- Development and recruitment now interact: clubs can decide whether a young player should be retained, loaned for minutes or supplemented through recruitment.

### 🔄 Transfer Market V2.0 — Major Upgrade

- Recruitment now uses **strategic target scoring**, considering more than raw overall rating.
- Clubs can consider **position, age, potential and squad need** when identifying targets.
- A deterministic **Club Strategy Engine** now feeds directly into recruitment behaviour.
- Strategic target data is connected to the live market sweep, allowing AI clubs to pursue players that better fit their squad-building plans.
- **Deadline-day urgency** is now active in market behaviour, creating a stronger final phase to transfer windows.
- Loan recruitment has been upgraded with club-strategy targeting rather than purely opportunistic movement.
- Incoming loan wage shares are negotiated against affordability, reducing unrealistic loan deals that a club cannot sustain.
- Clubs retain stronger budget and wage awareness when building their squads.
- Age and potential are carried into market targets, giving prospects and established players different recruitment value.
- Transfer Market V2.0 now works more closely with Player Development V2.0, allowing loans, prospects, squad needs and recruitment strategy to influence one another.

### 🆕 New gameplay and simulation additions in v0.3.5

- **Club Strategy Engine:** clubs now have a deterministic strategic layer that can influence how they approach squad construction.
- **Strategic squad planning:** recruitment is increasingly based on what a club actually needs rather than simply selecting highly rated available players.
- **Deadline-day pressure:** transfer activity can become more urgent as the window approaches its conclusion.
- **Development-to-loan pipeline:** promising players who need football can be connected to strategic loan decisions.
- **Loan affordability negotiation:** incoming wage contribution is adjusted to make proposed loans more financially plausible.
- **Club-identity player generation:** featured-player generation uses stable club identity to produce more consistent squad profiles.
- **Expanded elite-player model:** the world can contain rare 96 OVR footballers while keeping those players exceptional.
- **20-source portrait generation:** the expanded fictional face pool is protected by stronger missing-source, duplicate and diversity regression checks.
- **Wider world balancing:** stronger club/player profiles across Europe, North America, South America and Asia continue to improve the competitive hierarchy of generated careers.
- **Simulation regression protection:** new automated checks cover player ratings, portraits, recruitment integration and other systems that could otherwise regress as the world simulation expands.

### 🏁 Major v0.3.5 milestones

- [x] **Player Development V2.0 Expansion** — playing-time development, strategic youth handling and loan pathways connected more deeply to the evolving world.
- [x] **Transfer Market V2.0 Expansion** — strategic recruitment scoring, club-strategy targeting, live market selection, deadline-day tuning and smarter loans integrated.
- [x] **Club Strategy Engine** — deterministic club strategies now influence recruitment and loan decisions.
- [x] **Strategic Loan System** — development needs, recruitment logic and affordable wage sharing are connected.
- [x] **20-source Portrait Generation** — expanded source pool with stronger diversity validation.
- [x] **Elite Player & Club Balancing** — updated rating ceilings and stronger top-club/world-generation profiles.
- [x] **v0.3.5 version/build pipeline** — app metadata and Android Nightly workflow upgraded to v0.3.5 with GitHub run-number builds.
- [x] **Build 313 regression gate** — GitHub Actions passed the frontend and Rust workspace suites against the build 313 revision.
- [x] **Build 313 Android package checks** — CI verified the ARM64 APK signature, package ID, version name and installable version code.
- [ ] **Device startup and Inbox reading** — confirm on an Android phone; automated checks cannot prove the touch flow on a device.
- [ ] **Phase 5+ development** — continue the next major simulation/gameplay phases after the v0.3.5 checkpoint build.

Thank you for playing! Please help us improve future builds by [submitting issues on GitHub](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil/issues/new).

**Thanks, TranquilMT**

---

## 📜 Previous Update — v0.3.1

### 🌟 Welcome to OFMtouch! Here's what's new in v0.3.1

- **More varied players:** 20 fictional portrait source faces, rare 96-rated stars, stronger second-tier standouts and wider squad age profiles.
- **A bigger world:** 29 generation nations with stronger clubs across Europe, the Americas and Asia.
- **A livelier market:** club strategies shape transfers and loans, with competing offers and better budget and wage checks.
- **Player development and youth:** playing time affects young players' training growth, and youth scouting reports avoid repeated names.
- **Better match days:** expanded goal and woodwork commentary, improved lineups and optional spoken commentary.
- **Mobile improvements:** better Android navigation, safe areas, touch controls, scrolling and settings switches.
- **Welcome screen:** a launch summary of this update with an option to hide it on future launches; the notes remain available in Settings.
- **Fixes:** readable injury names, improved inbox reliability, unique generated club names and corrected world-generation checks.

The sections below describe the cumulative updates in more detail.

### 📱 A better Android experience

The latest updates put mobile play at the centre of OFMtouch.

- Android Back and edge-swipe navigation has been improved so gestures behave more naturally while moving around the game.
- Reduced accidental exits when using Android's Back gesture.
- Larger touch targets make buttons, menus and management actions easier to use on phones.
- Improved support for phones with camera cut-outs, rounded displays and gesture-navigation bars.
- Better full-screen sizing across different Android displays.
- Improved vertical and horizontal touch scrolling.
- Better one-handed usability across management screens.
- Improved form controls and text fields on smaller displays.
- Reduced unwanted zooming when entering text.
- Improved tap feedback and touch responsiveness.
- Reduced accidental image dragging and unwanted long-press behaviour.
- Improved layouts for narrow portrait displays.
- Reduced unnecessary motion when Android's reduced-motion accessibility option is enabled.

## 🔎 Scouting Update

Scouting is becoming a much more important part of building your club.

- Add players to your own career shortlist.
- Compare shortlisted players by position, age, overall rating, value and club.
- Improved scouting cards for phone screens.
- Larger and clearer scouting actions.
- Easier access to scouting from player searches.
- Improved presentation of player information on smaller displays.

## 👤 More Player Variety

- Expanded fictional player portrait variety to reduce repeated-looking players.
- The portrait pool now contains 20 different fictional source faces.
- Generated players have a wider range of ability.
- Elite players can now reach **96 OVR**.
- 96-rated players remain rare and should feel genuinely special.
- Strong clubs have a better chance of producing elite players.
- Second-tier clubs can still have standout stars capable of driving promotion campaigns.
- Young prospects can have much higher potential than their current ability suggests.
- Player attributes better reflect their natural position.
- Squad age profiles include a healthier mix of prospects, prime players and veterans.
- Veteran decline and youth development have been rebalanced.
- Player values and wage expectations better reflect ability, potential, age and club level.

## 🌍 Bigger Football World

Club and league balancing has received a major update for the 2026/27 starting world.

- Manchester United, Arsenal, Chelsea and Liverpool are correctly placed in the Premier League.
- Birmingham City is placed in the Championship.
- The English setup includes 20 Premier League and 24 Championship clubs.
- Manchester United, Arsenal, Chelsea and Liverpool receive stronger squads suitable for elite English clubs.
- Manchester United's generated squad has been significantly strengthened.
- Bayern München and Paris Saint-Germain receive elite-level squad balancing.
- Stronger club profiles have been added across Spain, Germany, Italy, France, Portugal and the Netherlands.
- Brazilian and Argentine clubs receive improved South American balancing.
- United States clubs have stronger player generation and improved squad quality.
- Japan, South Korea and Saudi Arabia receive improved Asian club balancing.
- Careers can simulate leagues across Europe, North America, South America and Asia together.
- Club strength now has a greater effect on the quality of generated squads.

## ⚽ Match Day Improvements

Matches now have more variety, atmosphere and meaningful player differences.

- Expanded match commentary with many more event reactions.
- More exciting goal commentary.
- Shots can hit the crossbar or post.
- Woodwork events receive dedicated commentary.
- Improved corner and free-kick commentary.
- Optional spoken commentary on supported devices.
- Improved lineup selection based on ability and fitness.
- Substitutions can better account for fatigue and match situation.
- Fitness has a more meaningful effect on performance.
- Form has been rebalanced so it matters without overpowering player quality.
- Morale effects have been better controlled.
- Injury risk reacts more naturally to age and player condition.
- Goalkeepers have a different ageing curve from outfield players.
- Strong teams retain an advantage while upsets remain possible.

## 🔄 Transfer Market V2.0 — Transfers, Loans & Contracts

Transfer Market V2.0 makes recruitment more strategic and connects club identity to market behaviour.

- Clubs consider positional needs when recruiting players.
- Recruitment scoring can account for player age and potential.
- Club strategy feeds into target selection and live transfer-market decisions.
- Deadline-day urgency can influence market behaviour.
- Strategic loan targeting is connected to club needs and youth development.
- Incoming loan wage shares are negotiated with affordability in mind.
- Teams are less willing to sell important first-team players without good reason.
- Surplus players are more likely to become available.
- Clubs keep some transfer budget in reserve instead of spending everything immediately.
- Wage-budget space matters more when clubs recruit.
- Player willingness to move better reflects the clubs involved.
- Improved loan logic for young prospects.
- More flexible wage expectations for free agents.
- Contract lengths better reflect player age and squad role.
- Important players receive greater priority during contract renewals.
- Transfer and loan offers are easier to manage on a phone.
- Accept, reject and counter-offer actions use touch-friendly controls.

## 🎓 Player Development V2.0 — Youth & Progression

Player Development V2.0 strengthens the connection between opportunity, potential and long-term squad building.

- Young players can develop into significantly stronger footballers over time.
- Playing time and training have a greater effect on development.
- Youth development is connected to the wider club-strategy/world-simulation layer.
- Loans provide another development route for prospects who need competitive minutes.
- Stronger youth facilities can improve youth intake quality.
- Potential is influenced by age and player development conditions.
- Position-specific development produces more believable player profiles.
- Homegrown-player development has received additional support.
- Scouting uncertainty makes unknown prospects harder to judge perfectly.
- Elite potential remains rare so exceptional players retain their value.

## 💾 Career Improvements

- Autosave can protect progress after advancing the in-game date.
- Backgrounding the game on Android can protect unsaved career progress when autosave is enabled.
- Optional confirmation before advancing to the next day.
- Skip-to-match continues through quiet days and stops when a match or important action needs attention.
- Player fatigue no longer incorrectly blocks skip-to-match by itself.
- Improved reliability when responding to inbox actions.
- International fixtures display cleaner country names.
- International squads select stronger eligible players from their nation.
- Additional free agents give the transfer market more depth from the start of a career.

## 🛠️ Fixes & Improvements

Recent fixes include:

- Improved incoming-loan wage-share affordability negotiation.
- Aligned generated-player rating regression expectations with the current rating model.
- Stabilised featured-player generation around club identity.
- Added stronger portrait-source diversity regression checks.
- Improved build safety while strategic recruitment was connected to live market selection.
- Fixed Android Back gestures unexpectedly closing the game from some screens.
- Improved protection against accidental exits from edge gestures.
- Fixed controls being hidden behind Android navigation areas on some phones.
- Improved layouts around camera cut-outs and display safe areas.
- Fixed several cramped or difficult-to-tap mobile controls.
- Improved scrolling on long management screens.
- Improved horizontal scrolling on wide tables and information panels.
- Fixed settings switches with unreliable touch areas or incorrectly positioned thumbs.
- Fixed rapid settings changes potentially saving in the wrong order.
- Fixed raw injury codes such as `.calfinjury` appearing instead of readable injury names.
- Improved protection against duplicate or overlapping match actions.
- Fixed older inbox updates being able to overwrite newer actions.
- Improved transfer information visibility on phone layouts.
- Improved payroll and scouting row interaction.
- Improved team-selection and league-selection behaviour.
- Improved main-menu and manager-creation layouts on smaller phones.
- Reduced clipped buttons and unreachable controls across multiple screens.
- Improved portrait variety to reduce players appearing too similar.

## 📱 Designed for Mobile

OFMtouch is being shaped around playing a full football-management career on a phone.

- Touch-first menus and controls.
- Portrait-friendly management screens.
- Larger buttons and interactive areas.
- Compact player cards instead of desktop tables where possible.
- Touch-friendly tactics controls.
- Player swapping without relying on mouse drag-and-drop.
- Mobile match-day controls.
- Phone-friendly squad management.
- Mobile scouting and youth recruitment.
- Responsive finance and payroll screens.
- Touch-friendly inbox actions.
- Mobile fixtures, standings and calendar views.
- Dedicated youth-academy presentation.
- Touch-friendly staff management.
- Mobile transfer-market controls.
- Responsive player profiles.
- Android safe-area support.

## 🎮 What Can You Do?

- 🏟️ Take control of a football club
- 👥 Build and manage your squad
- 📋 Choose your starting XI
- 🧠 Create formations and tactics
- 🔄 Make substitutions and match-day decisions
- 🔎 Scout players and build a shortlist
- 💰 Buy, sell and loan players
- 📝 Negotiate transfers and contracts
- 🎓 Develop young prospects
- 📅 Play through full seasons
- 🏆 Challenge for leagues and cups
- 📈 Develop players over multiple years
- 💼 Manage finances and staff
- 🌍 Simulate leagues across multiple regions
- 💾 Build a long-term career and football dynasty

## 🐛 Known Issues

OFMtouch is currently a NightlyPreRelease, so some areas are still being polished.

- Android Back/edge gestures may still need refinement on certain devices and navigation screens.
- Some dense management screens can still feel cramped on very small portrait displays.
- A small number of wide data views may still require horizontal scrolling.
- Android soft-keyboard behaviour may vary between devices when editing forms.
- Some interface areas are still being converted from desktop-style layouts to fully mobile presentations.
- Performance can vary on older or lower-end Android phones during heavier simulation or information-heavy screens.
- Generated player portraits can still repeat during very large careers despite the expanded portrait pool.
- Transfer Market V2.0 and Player Development V2.0 will continue to receive balance tuning as longer careers are tested.
- Nightly builds may occasionally introduce temporary regressions while new systems are being tested.

## 🔜 Coming Next / Remaining Work

The next milestones after the v0.3.5 checkpoint focus on validation and deeper career simulation:

- Complete the v0.3.5 regression gate and resolve any remaining failures.
- Verify the v0.3.5 ARM64 Android APK.
- Validate Transfer Market V2.0 over multi-season careers and continue economic/AI balancing.
- Validate Player Development V2.0 over multi-season careers and tune growth, decline and loan-development outcomes.
- Continue Phase 5+ world-simulation and gameplay development.
- Further Android Back and gesture improvements.
- Better exit confirmation behaviour.
- More compact portrait-mode layouts.
- More one-handed navigation improvements.
- Better Android keyboard handling.
- Improved save/resume behaviour when switching apps.
- Haptic feedback for selected touch interactions.
- More performance optimisation for lower-end phones.
- Continued match-engine balancing.
- More career simulation improvements.
- Further league and club balancing.
- More fictional player portrait variety.
- Additional accessibility improvements.

## 📦 Version

**OFMtouch v0.3.5 — NightlyPreRelease**
**Build:** GitHub Actions run number
**Platform:** Android
**Primary build:** ARM64

NightlyPreRelease versions are intended for players who want to test the newest features and improvements before a stable release. Save important careers regularly while the game remains in active pre-release development.

## ❤️ Credits

**Original game:** OpenFootManager and its original developers and contributors
**OFMtouch Android adaptation, mobile enhancements and additional gameplay:** TranquilMT

[OFMtouch Android repository](https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil) · [Original OpenFootManager repository](https://github.com/openfootmanager/openfootmanager)

OFMtouch is an independent, fan-made open-source project and is not an official OpenFootManager Android release.

---

### ⚽ Build your club. Create your story. Chase trophies.

**OFMtouch v0.3.5 NightlyPreRelease**
