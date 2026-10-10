/** Calendar comparisons use UTC, like the authoritative game clock. */
export function calendarDay(value: string): string | null {
 const text=value.trim();
 const day=text.slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
 const dayTime=Date.parse(day);
 const time=Date.parse(text);
 if(!Number.isFinite(dayTime)||!Number.isFinite(time)||new Date(dayTime).toISOString().slice(0,10)!==day) return null;
 return new Date(time).toISOString().slice(0,10);
}
