import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Funciones puras del calendario (semanas de lunes a domingo). */
const WEEK = { weekStartsOn: 1 as const };

export type CalendarView = "mes" | "semana";

/** Días a mostrar en la grilla del mes: semanas completas que cubren el mes. */
export function monthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), WEEK);
  const end = endOfWeek(endOfMonth(date), WEEK);
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Los 7 días (lunes a domingo) de la semana de `date`. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, WEEK);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Rango [desde, hasta) a consultar para una vista. */
export function viewRange(view: CalendarView, date: Date): { from: Date; to: Date } {
  if (view === "semana") {
    const days = weekDays(date);
    return { from: days[0], to: addDays(days[6], 1) };
  }
  const days = monthGrid(date);
  return { from: days[0], to: addDays(days[days.length - 1], 1) };
}

/** Fecha anterior/siguiente según la vista. */
export function shiftView(view: CalendarView, date: Date, dir: -1 | 1) {
  return view === "semana" ? addWeeks(date, dir) : addMonths(date, dir);
}

/** "2026-11-09" ↔ Date (en hora local). Si el texto es inválido devuelve `fallback`. */
export function parseDayParam(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const d = parse(value, "yyyy-MM-dd", fallback);
  return isValid(d) ? d : fallback;
}
export function dayParam(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** Clave de día para agrupar eventos. */
export function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}
