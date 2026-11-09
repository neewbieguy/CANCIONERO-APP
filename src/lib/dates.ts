import { addDays, format, formatDistanceToNowStrict, isToday, isTomorrow, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Domingo 9 de noviembre · 10:00" */
export function formatEventDate(d: Date) {
  return cap(format(d, "EEEE d 'de' MMMM · HH:mm", { locale: es }));
}

/** "dom 9 nov" */
export function formatShortDate(d: Date) {
  return format(d, "EEE d MMM", { locale: es });
}

export function formatTime(d: Date) {
  return format(d, "HH:mm");
}

/** "Hoy", "Mañana" o "en 5 días" */
export function relativeDay(d: Date, now = new Date()) {
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  if (d < now) return `hace ${formatDistanceToNowStrict(d, { locale: es })}`;
  return `en ${formatDistanceToNowStrict(startOfDay(d), { locale: es, unit: "day", roundingMethod: "ceil" })}`;
}

/** Los 7 días a partir de hoy. */
export function nextSevenDays(from = new Date()) {
  const start = startOfDay(from);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekdayInitial(d: Date) {
  return cap(format(d, "EEEEEE", { locale: es }));
}

export function monthYear(d: Date) {
  return cap(format(d, "MMMM yyyy", { locale: es }));
}

/** Valor para <input type="datetime-local"> en hora local. */
export function toDateTimeLocal(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
