/** Genera un archivo .ics (iCalendar) para agregar un evento a Google Calendar, Apple, Outlook, etc. */

function utcStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapa texto según RFC 5545 (barras, comas, punto y coma y saltos de línea). */
export function escapeIcsText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Corta líneas largas a 75 caracteres como pide el estándar. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    out.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(event: {
  id: string;
  title: string;
  start: Date;
  end: Date | null;
  location?: string | null;
  description?: string | null;
  url?: string;
  now?: Date;
}) {
  // Sin hora de fin (o una inválida), se asume que dura 2 horas
  const end = event.end && event.end > event.start ? event.end : new Date(event.start.getTime() + 2 * 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cancionero//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@cancionero.app`,
    `DTSTAMP:${utcStamp(event.now ?? new Date())}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : null,
    event.url ? `URL:${event.url}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);
  return lines.map(fold).join("\r\n") + "\r\n";
}
