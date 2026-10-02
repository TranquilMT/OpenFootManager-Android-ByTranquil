# OFMtouch 0.6.5 financial model

Checked 2 October 2026. Squads are fictional. Player values, operating allocations and transfer budgets are game estimates; published turnover is a scale reference, not spendable cash. The deterministic conversion uses £1 = €1.15 as a game calibration, not a live exchange-rate claim.

| Club | Published annual turnover (GBP m) | Period | Source |
|---|---:|---|---|
| Manchester United | 677.6 | June 2026 | https://ir.manutd.com/~/media/Files/M/Manutd-IR/Governance%20Document/4q-2026-earnings-release.pdf |
| Manchester City | 694.094 | June 2025 | https://www.mancity.com/annualreport2025/wp-content/uploads/2025/11/mcfc_financial_report_2025.pdf |
| Liverpool | 703 | May 2025 | https://www.liverpoolfc.com/news/lfc-announces-financial-results-premier-league-title-winning-season |
| Chelsea | 490.9 | June 2025 | https://www.chelseafc.com/en/news/article/financial-results-for-2024-25 |
| Tottenham | 565.3 | June 2025 | https://www.tottenhamhotspur.com/news/1018039/financial-results-year-ended-30-june-2025 |
| Newcastle | 335.3 | June 2025 | https://www.newcastleunited.com/en/news/newcastle-united-announces-record-income |
| Aston Villa | 378.1 | June 2025 | https://www.avfc.co.uk/news/2026/march/31/news-aston-villa-end-of-year-accounts-2025/ |
| Crystal Palace | 196.623 | June 2025 | https://preprod.cpfc.co.uk/information/financial-headlines/ |
| Everton | 196.7 | June 2025 | https://www.premierleague.com/ar/news/4623567 |
| Brentford | 173.1 | June 2025 | https://www.brentfordfc.com/en/news/club-news-brentford-fc-financial-results-2024-25 |

United reported £67.2m cash at 30 June 2026, converted to a €77.28m opening balance. Other clubs use an estimated 15% of annual revenue as working cash. Arsenal, Brighton, Leeds and remaining English clubs have explicitly estimated game anchors; these are not presented as verified audited values. Other nations and divisions use reputation tiers. A club's historical turnover does not imply a free transfer budget of that amount.

85% of the annual anchor becomes scheduled operating receipts. Matchday receipts and competition prizes are posted separately; the retained 15% prevents treating full turnover as recurring receipts while also awarding those events. Fixed operating costs are calibrated at world creation against the opening annual payroll and a 3% revenue margin (minimum overhead 10% of turnover). Costs do not fall when a manager hires expensive players. New transfers can create real financial pressure. Cash, annual wage budget and transfer envelope are distinct.

Generated weekly salary recommendations are multiplied by 52 before storage because payroll, contracts and UI store annual euros. Opening generated player and staff payroll is then capped at 60% of the revenue anchor, preserving relative salaries. This keeps smaller divisions sustainable and allows cash allocations to reflect working capital rather than an entire year of wages. Existing negotiated salaries are preserved. Standard old saves receive a one-time grant for the difference between their original journal opening allocation and the corrected allocation; spending and debt are not reset. The grant is journalled as board support. Authored world packages are excluded from career repair.

Home colours and patterns are grounded in the official 2026/27 kit directory: https://www.premierleague.com/en/news/4672981/premier-league-club-kits-for-202627-season and Manchester City's official kit announcement: https://www.mancity.com/news/club/manchester-city-202627-home-kit-launched-63914816 . Hex values approximate the displayed home colours; no claim of official Pantone or brand specifications.

Player values interpolate by natural ability from €28m at 80, €45m at 85, €75m at 90, €105m at 93 and €145m at 96 before age and capped potential adjustments. Youth potential alone cannot make a low-ability teenager worth €100m. Curated squads now have a wider gap between stars, regular starters, rotation players and academy prospects.
