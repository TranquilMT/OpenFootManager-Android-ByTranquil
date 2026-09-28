type ShortlistStorage = Pick<Storage, "getItem" | "setItem">;

export function shortlistKey(careerId: string): string {
  return `ofm:scouting-shortlist:${careerId}`;
}

function defaultStorage(): ShortlistStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadShortlist(
  careerId: string,
  storage: ShortlistStorage | null = defaultStorage(),
): string[] {
  if (!storage) return [];
  try {
    const value: unknown = JSON.parse(storage.getItem(shortlistKey(careerId)) ?? "[]");
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))]
      : [];
  } catch {
    return [];
  }
}

export function saveShortlist(
  careerId: string,
  playerIds: string[],
  storage: ShortlistStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(shortlistKey(careerId), JSON.stringify([...new Set(playerIds)]));
  } catch {
    // Career play remains available when private storage is disabled or full.
  }
}
