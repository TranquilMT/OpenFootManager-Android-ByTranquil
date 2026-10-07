export function isLocalDerby(home: { city?: string; country?: string }, away: { city?: string; country?: string }): boolean {
  const normalize = (value: string | undefined) => (value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
  const city = normalize(home.city), country = normalize(home.country);
  return city.length > 0 && country.length > 0 && !["unknown", "n/a", "-"].includes(city) && city === normalize(away.city) && country === normalize(away.country);
}
