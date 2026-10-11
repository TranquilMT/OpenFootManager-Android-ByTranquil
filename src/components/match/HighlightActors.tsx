import { highlightParticipants } from "./highlightParticipants";
import { getPlayerName } from "./helpers";
import type { MatchEvent, MatchSnapshot } from "./types";
export default function HighlightActors({
  frame,
  snapshot,
}: {
  frame: MatchEvent;
  snapshot: MatchSnapshot;
}) {
  const names = highlightParticipants(frame)
    .map((id) => ({ id, name: getPlayerName(snapshot, id) }))
    .filter(({ id, name }) => name && name !== id);
  return (
    <ul className="flex flex-wrap gap-2">
      {names.map(({ id, name }) => (
        <li
          key={id}
          className="rounded-lg bg-accent-100 px-3 py-2 text-sm font-semibold text-accent-800 dark:bg-accent-900 dark:text-white"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}
