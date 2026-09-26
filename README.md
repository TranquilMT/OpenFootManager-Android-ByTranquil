# OpenFootManager Android — TranquilMT Fan Port

> **Community Android port — currently in active development.**  
> Bringing the open-source OpenFootManager football management experience to Android with a mobile-first interface, touch controls, Android-specific improvements and continued enhancements to the core game.

## ⚽ What is OpenFootManager?

OpenFootManager is an open-source football management game where you take control of a football club and handle the decisions behind the team. The project includes the systems expected from a football-management simulation: squad and player management, tactics, fixtures and competitions, transfers and scouting, club management, match-day decisions, career progression and persistent saves.

This repository is focused on making that experience genuinely enjoyable on Android rather than simply squeezing a desktop interface onto a phone.

## 📱 About this Android project

This is a **fan-developed Android port and enhancement project maintained by TranquilMT**. It is based on the original OpenFootManager project and preserves the original project's attribution and GPLv3 licensing.

The goals of this fork are to:

- bring the core OpenFootManager game to Android;
- redesign interaction around touchscreen devices;
- provide mobile-first navigation and layouts for phones and tablets;
- support portrait and landscape where appropriate;
- improve Android performance, usability and lifecycle behaviour;
- retain the depth of the original management simulation while presenting it appropriately on mobile;
- fix issues discovered during the Android port;
- continue adding carefully tested enhancements to the core game over time.

This is **not an official upstream OpenFootManager Android release**. It is a community/fan port and ongoing derivative project.

## 🚧 Development status

OpenFootManager Android is currently **pre-release software**. Builds may contain incomplete screens, bugs or unfinished Android adaptations.

The immediate starter-build priority is a complete playable career using OpenFootManager's generated world and players. External real-player databases are deliberately deferred so database licensing/import work cannot prevent the core Android game from becoming playable.

Current Android work focuses on:

- New Career and generated-world startup;
- mobile-first game navigation;
- touch-friendly squad and player management;
- mobile tactics and team selection;
- match-day presentation and controls;
- transfers and scouting;
- competitions, fixtures and tables;
- inbox, club and finance management;
- save/load and Android pause/resume behaviour;
- ARM64 APK build and installation verification.

A build is not considered a stable release merely because it compiles. Career creation, team management, matches, saving, restarting and loading must be exercised before a build is promoted as stable.

## 🧭 Mobile design direction

The **gameplay depth of the desktop project is the reference — not the desktop interface**.

Android screens should use native mobile interaction patterns such as touch-sized controls, cards, tabs, bottom navigation, sheets and focused detail views. Desktop-only assumptions such as mouse hover, right-click or mandatory drag-and-drop must have touch-native alternatives.

Dense football-management information should be reorganised intelligently for smaller screens rather than simply removed.

See [`docs/ANDROID-MOBILE-FIRST-REQUIREMENTS.md`](docs/ANDROID-MOBILE-FIRST-REQUIREMENTS.md) for the current Android product requirements.

## 📦 Builds and releases

Development APKs are built with GitHub Actions from this repository. Verified milestone builds will also be published through GitHub Releases with the APK, checksum, version/build information and corresponding source revision.

Until the project reaches a stable milestone, releases should be treated as development/alpha builds and installed with that expectation.

The current Android CI target is **ARM64 (`arm64-v8a`)**.

## 🛠️ Build from source

The full application source is maintained in this repository. The historical migration repository is not required to build the current project.

Frontend prerequisites include Node.js 22 and npm:

```sh
npm ci
npm run build
npm test -- --maxWorkers=2
```

Backend checks require stable Rust and the Tauri prerequisites:

```sh
cargo test --manifest-path src-tauri/Cargo.toml --workspace
cargo clippy --manifest-path src-tauri/Cargo.toml --workspace --all-targets
```

For Android, install Java 17, the Android SDK/NDK and the Rust `aarch64-linux-android` target, then initialise/build through Tauri:

```sh
npx tauri android init --ci
npx tauri android build --debug --apk --target aarch64
```

Generated Gradle output is created by the lockfile-pinned Tauri tooling; source-of-truth application code remains in the repository.

## 🔖 Versioning

Android builds use explicit development versions while the port is unfinished. The game UI, About screen, Android metadata and published release should identify the same version/build rather than maintaining unrelated version labels.

Development releases will progress through alpha/beta milestones before a stable Android release is declared.

## 🙌 Credits and attribution

**Original game:** OpenFootManager and its original developers/contributors.  
**Android/mobile port and adaptations:** TranquilMT.  
**Project type:** Independent community/fan port and enhancement project.

This fork does not claim authorship of the original OpenFootManager game. Original copyright, contributor attribution and licence notices are preserved. See [`docs/UPSTREAM-README.md`](docs/UPSTREAM-README.md) for the preserved upstream project overview and [`LICENSE.md`](LICENSE.md) for the repository licence.

Third-party assets and datasets may have licences separate from the game source and must be reviewed before redistribution.

## 🤝 Contributing

Contributions, testing and useful bug reports are welcome while the Android port develops. When reporting Android issues, include the build/version, device model, Android version and the steps required to reproduce the problem where possible.

Useful project documents:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution guidance
- [`AGENTS.md`](AGENTS.md) — repository development guidance
- [`docs/ANDROID-MOBILE-FIRST-REQUIREMENTS.md`](docs/ANDROID-MOBILE-FIRST-REQUIREMENTS.md) — Android experience requirements
- [`docs/UPSTREAM-README.md`](docs/UPSTREAM-README.md) — original project overview
- [`LICENSE.md`](LICENSE.md) — licence information

## ❤️ Project philosophy

The objective is straightforward: keep the depth and spirit of OpenFootManager, make it comfortable to play on Android, preserve credit for the people who created the original project, and improve the game carefully without pretending unfinished work is complete.

---

**OpenFootManager Android is an independent fan project under active development by TranquilMT.**