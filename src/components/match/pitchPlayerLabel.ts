/** Old careers can contain unallocated numbers; never show an invalid jersey on the pitch. */
export function pitchPlayerLabel(name: string, jersey?: number): string {
  if (jersey != null && Number.isInteger(jersey) && jersey > 0) return String(jersey);
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toUpperCase() || "?"
  );
}
