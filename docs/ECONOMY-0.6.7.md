# Economy and development calibration for OFMtouch 0.6.7

Player and staff wages in saves are annual euros; public contract fields accept weekly euros. Conversion happens once at the IPC/MCP boundary. A €100,000 weekly offer means €5.2m annually. Counteroffers and saved assistant reports display weekly amounts. Existing paid contracts are preserved. Zero and overflowing offers are rejected.

Severance is annual salary multiplied by remaining contract days divided by 365, rounded up. Staff hiring creates a two-year paid contract without immediately inventing an annual expense. Actual payroll and termination compensation are posted to the cash journal. Staff release previews quote the same calculation used by the transaction.

Renewals apply modest age, ability, morale and expiry adjustments instead of stacking large recurring increases. Loan renewals check both clubs' resulting wage commitments. Transfer checks cover the annual wage budget and fee plus four weeks of salary cash before mutation; pending registrations recheck affordability. Registered players receive paid, age-appropriate contracts. Junior contracts are capped at three years, adults at five. Short remaining contracts reduce seller fee expectations. Loan cash guards use a four-week wage buffer rather than the entire year's share.

The reproducible turnover anchors documented in ECONOMY-0.6.5.md remain the game scale. Standard clubs separate estimated home receipts from recurring operating income and calibrate overhead after opening payroll and a 3% target operating surplus. This removes the previous addition of all match income on top of an already funded profit target. The 3% figure is a game calibration, not guaranteed profit or audited accounting. Later salary increases do not automatically lower overhead.

Commercial amounts scale with estimated turnover: additional sponsorship roughly 2–4% annually, marketing requires activation cash and a 28-day cooldown, and board support is capped by club size and remains once per season. Debt and overspending do not increase commercial rewards. These are explicit game estimates, not verified individual real-world deals.

Actual weekly payroll uses contractual loan shares. Completed cup and league home fixtures are counted once. A saved per-club weekly marker prevents repeat payroll after retries or reloads, and weekly cash posts are atomic. Manager salary retains its existing independent settlement guard. A 52-week regression reconciles receipts, costs, payroll, cash and the journal.

A one-time standard-save migration preserves cash, paid contracts and past spending. It adjusts the previous operating model and brings zero-paid generated staff into visible payroll by moving the cost out of implicit overhead. Its saved marker prevents repeated repair; authored package worlds retain their own financial settings.

Training is slower and tapers near potential and at poor condition. Youth match minutes, coaching and facilities matter; goalkeeper technical training improves handling/reflexes rather than striker attributes. A controlled 365-day, 64-seed benchmark with good coaching and maintained condition measured mean overall gains of 4.52 for a 19-year-old regular (1,800 minutes), 2.17 without match time and 1.56 for a 33-year-old regular. Actual seasons vary with injuries, staff, facilities and minutes.

UEFA's 2026 finance overview provides context for avoiding limitless wage growth and guaranteed profits: https://www.uefa.com/news-media/news/02a2-200452a66064-0cfd3f86b94f-1000/ . Generated salary and commercial curves are game estimates.

Regression coverage includes salary conversion/overflow, termination, loan payroll, save/reload settlement, year-long cash reconciliation, transfer commitments, paid junior registration, commercial cooldowns and season development. The verification workflow checks frontend, engine/domain/core/database, application commands and MCP before release packaging.
