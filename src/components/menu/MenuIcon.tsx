import type { LucideIcon } from "lucide-react";
const tones = {
  primary: "bg-primary-500/15 text-primary-700 dark:text-primary-300",
  accent: "bg-accent-500/15 text-accent-700 dark:text-accent-300",
  neutral: "bg-gray-500/10 text-gray-600 dark:text-gray-300",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
};
export function MenuIcon({ icon: Icon, tone = "primary" }: { icon: LucideIcon; tone?: keyof typeof tones }) {
  return <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 motion-reduce:transform-none ${tones[tone]}`}><Icon className="size-6" strokeWidth={1.8} /></span>;
}
