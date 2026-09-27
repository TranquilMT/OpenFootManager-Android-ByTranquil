import { Wind, Flame, Swords, Angry, ThumbsUp, Frown } from "lucide-react";

type TalkIconName =
  | "calm"
  | "motivational"
  | "assertive"
  | "aggressive"
  | "praise"
  | "disappointed";
const COLORS: Record<TalkIconName, string> = {
  calm: "text-sky-400",
  motivational: "text-orange-400",
  assertive: "text-amber-400",
  aggressive: "text-red-400",
  praise: "text-green-400",
  disappointed: "text-gray-400",
};
function Icon({ name, large = false }: { name: TalkIconName; large?: boolean }) {
  const cls = large ? "h-7 w-7 sm:h-8 sm:w-8" : "h-5 w-5";
  switch (name) {
    case "calm":
      return <Wind className={cls} />;
    case "motivational":
      return <Flame className={cls} />;
    case "assertive":
      return <Swords className={cls} />;
    case "aggressive":
      return <Angry className={cls} />;
    case "praise":
      return <ThumbsUp className={cls} />;
    case "disappointed":
      return <Frown className={cls} />;
  }
}
function render(key: string, large = false): React.ReactNode {
  if (!(key in COLORS)) return null;
  const name = key as TalkIconName;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${COLORS[name]}`}
      aria-hidden="true"
    >
      <Icon name={name} large={large} />
    </span>
  );
}
export function getTalkIcon(key: string): React.ReactNode {
  return render(key);
}
export function getTalkIconSmall(key: string): React.ReactNode {
  return render(key, true);
}
