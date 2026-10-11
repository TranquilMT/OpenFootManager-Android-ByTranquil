/** Keep the displayed percentages and both halves of the bar consistent. */
export function possessionShare(home: number, away: number) {
  const bounded = (value: number) =>
    Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const homeValue = bounded(home),
    awayValue = bounded(away);
  const total = homeValue + awayValue;
  const homeShare = total > 0 ? Math.round((homeValue / total) * 100) : 50;
  return { home: homeShare, away: 100 - homeShare };
}
