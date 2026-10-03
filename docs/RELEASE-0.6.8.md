# OFMtouch v0.6.8 — Squad, Sponsorship & Economy Polish

This update follows v0.6.7 with corrections across squad registration, commercial income and existing-career upgrades, plus regression checks for the phase 1–6 game systems.

## Squad registration

Generated squads register their strongest senior goalkeeper as #1. Backup keepers prefer #13 and #22 when a number must be allocated; unnumbered outfield players start at #2. Invalid or duplicate numbers are repaired, including transferred players. Academy prospects remain unregistered until promotion. The roster and pitch continue to show the player's actual stored shirt number.

## Sponsorship and economy

Established generated clubs start with fictional principal sponsors. Contract values scale with club turnover and reputation, with conservative 3–8% turnover shares. Top clubs therefore have much larger agreements than smaller clubs. Principal sponsorship is moved out of the already-budgeted operating receipts, so the visible deal is not a second source of the same revenue. Initial contracts last two to three years and renew annually at their agreed value; negotiated short deals keep their original expiry rules.

Opening operating receipts now account for the actual home league schedule, protecting clubs in smaller divisions from the old 19-home-game assumption. Cash, existing wage contracts and fixed operating costs are preserved. Expired sponsors no longer appear as paying income in forecasts or weekly settlement. Active deals and already-resolved offers cannot be overwritten or replayed, and malformed offers no longer invent a €100,000 weekly deal.

## Existing saves and world imports

The save loader checks each economy migration separately, so careers that already received 0.6.5 or 0.6.7 still receive the new repair. Each club records its corrected economy version, preventing a second schedule adjustment when a world snapshot is exported and imported. Authored packages and explicitly authored standalone worlds retain their own financial data. Generated world startup uses the shared GUI/assistant construction path.

The original APK signing identity is retained. The release can be installed over the previous signed build; career cash, negotiated contracts and history are preserved. Release highlights are translated into all 12 supported languages, and the 0.6.7 notes remain attached to the correct previous version.
