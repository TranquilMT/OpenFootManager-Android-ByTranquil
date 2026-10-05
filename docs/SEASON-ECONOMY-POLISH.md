# Season economy follow-up to OFMtouch 0.6.8

Three reproduced regressions are corrected in this candidate update:

- A generated small-division champion could receive the same EUR 5 million
  prize as a top-flight champion despite annual operating receipts of only
  EUR 600,000. Generated divisions now share a prize scale with a champion
  cap of 10% of average recurring club receipts, up to the existing tier
  maximum. The relative rewards for each finishing position are preserved.
  The inbox reports the amount actually posted, before reputation changes
  and promotion alter the club's future finances.
- Relegation reduced the wage budget by 25%, but promotion never restored
  capacity. Promotion now restores that reduction with a 4/3 adjustment.
  Staying in the same division does not trigger another adjustment. Cash
  and signed player/staff wages are preserved.
- League-position sponsorship bonuses were computed from the legacy league
  mirror alone. Forecasts and weekly settlement now share a domestic table
  lookup for every club. Cups cannot override domestic positions, and the
  current domestic table takes precedence over a stale legacy mirror.

Authored/package worlds keep their existing prize scale. Legacy clubs with no
calibrated economy also retain their original payouts. No save schema changes
or retrospective cash adjustments are introduced.

## Regression evidence

Before the fixes, focused tests reproduced EUR 5,000,000 instead of EUR 60,000
for the small-division champion, EUR 1,000 instead of EUR 1,500 sponsorship
income, and an unchanged EUR 6,000,000 promotion wage budget instead of
EUR 8,000,000.

The five-year operating check covers six club reputation bands, 52 weekly
settlements each year, salary payments, 19 home gate receipts per year,
principal sponsor renewals, and cash-journal reconciliation. It confirms that
these isolated recurring finances remain positive and close to the intended
3% annual operating surplus, without rewriting wages. It is not a full career
simulation through transfers, player development, or promotion/relegation.

The candidate keeps the existing version metadata until a release is prepared.
Physical Android installation and gameplay still require device verification.
