# Generated World Balance Model

This build phase uses generated players only. No external player database is required.

## League and club quality

Player quality is driven by competition tier, club reputation, finances, squad role, age and potential rather than a single global OVR band.

Suggested senior first-team baselines:
- Elite top-flight title clubs: most established starters 72-88 OVR, rare exceptional players may reach 89-92.
- Top-flight established clubs: most starters 66-80 OVR.
- Top-flight lower/relegation clubs: most starters 60-73 OVR.
- Second tier: most starters 54-68 OVR.
- Third/lower professional tiers: most starters 45-60 OVR.
- Lowest generated professional/semi-professional tiers: players may fall into the high 30s/40s.

These are distributions, not hard clamps. Exceptional prospects, declining veterans and unusual clubs can sit outside their league baseline.

## Youth and potential

Youth players are not boosted to match senior squad quality. A wealthy elite club may have a 48-62 OVR academy player with high potential alongside 80+ OVR senior players.

Current ability and potential are separate. Development rate depends on age, potential, minutes, training environment and form. Growth slows near potential and decline becomes more likely with age.

## Position profiles

Generated attributes must be position-weighted. OVR should be derived from relevant attributes rather than generated independently:
- GK: handling, reflexes, positioning, aerial ability, distribution.
- CB: defending, positioning, strength, aerial ability, composure.
- FB/WB: pace, stamina, defending, crossing, technique.
- DM/CM: passing, vision, positioning, stamina, technique.
- AM/W: technique, dribbling, pace, creativity, passing.
- ST: finishing, movement, composure, pace/strength, technique.

## Club economics

Higher quality players cost more to buy and retain. Transfer value and wage demand should account for current ability, potential, age, reputation, contract length and scarcity.

Club recruitment must respect:
- available transfer budget;
- sustainable wage budget;
- club/league reputation;
- squad need and position depth;
- player willingness and expected role.

Rich clubs can afford more elite players but do not receive guaranteed elite squads. Smaller clubs should compete through development, loans, free transfers and undervalued players.

## Simulation compatibility

A wider OVR range must not turn OVR into a deterministic match result. Match calculations should use relevant player attributes, tactical fit, fitness, morale, form and controlled randomness.

## Mobile-first requirement

Every gameplay route in this phase must be usable on Android without relying on document scrolling. Each full-screen route owns an explicit touch-scroll surface, respects safe areas, keeps primary actions reachable, and uses phone-appropriate layouts for tables, dialogs and forms.
