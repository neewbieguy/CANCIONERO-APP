import Link from "next/link";
import { format, isSameDay, isSameMonth, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/events/status-badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import {
  type CalendarView,
  dayKey,
  dayParam,
  monthGrid,
  parseDayParam,
  shiftView,
  viewRange,
  weekDays,
} from "@/lib/calendar";
import { formatTime, monthYear } from "@/lib/dates";
import { requireTeamContext } from "@/lib/session";
import { templateLabel } from "@/lib/templates";
import { cn } from "@/lib/utils";

export const metadata = { title: "Calendario" };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function CalendarioPage({ searchParams }: { searchParams: { vista?: string; fecha?: string } }) {
  const ctx = await requireTeamContext();
  const view: CalendarView = searchParams.vista === "semana" ? "semana" : "mes";
  const today = startOfDay(new Date());
  const date = parseDayParam(searchParams.fecha, today);
  const { from, to } = viewRange(view, date);

  const events = await db.event.findMany({
    where: { teamId: ctx.team.id, date: { gte: from, lt: to } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      template: true,
      location: true,
      participants: { where: { userId: ctx.user.id }, select: { status: true, role: true } },
    },
  });

  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const k = dayKey(e.date);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }

  const href = (v: CalendarView, d: Date) => `/calendario?vista=${v}&fecha=${dayParam(d)}`;
  const days = view === "mes" ? monthGrid(date) : weekDays(date);
  const title =
    view === "mes"
      ? monthYear(date)
      : `${format(days[0], "d MMM", { locale: es })} – ${format(days[6], "d MMM yyyy", { locale: es })}`;
  const canCreate = ctx.access.manageEvents;
  const newEventHref = (d: Date) => `/eventos/nuevo?fecha=${dayParam(d)}`;

  return (
    <>
      <PageHeader
        title="Calendario"
        description="Todos los eventos del equipo."
        actions={
          canCreate && (
            <Button asChild>
              <Link href={newEventHref(date < today ? today : date)}>
                <Plus /> Nuevo evento
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-label="Anterior">
            <Link href={href(view, shiftView(view, date, -1))}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Siguiente">
            <Link href={href(view, shiftView(view, date, 1))}>
              <ChevronRight />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={href(view, today)}>Hoy</Link>
          </Button>
          <h2 className="ml-2 text-lg font-semibold">{cap(title)}</h2>
        </div>
        <nav className="inline-flex rounded-xl bg-muted p-1">
          {(["mes", "semana"] as const).map((v) => (
            <Link
              key={v}
              href={href(v, date)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                view === v ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "mes" ? "Mes" : "Semana"}
            </Link>
          ))}
        </nav>
      </div>

      {view === "mes" ? (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const list = byDay.get(dayKey(d)) ?? [];
                const inMonth = isSameMonth(d, date);
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      "min-h-16 border-b border-r p-1 md:min-h-28 md:p-1.5",
                      (i + 1) % 7 === 0 && "border-r-0",
                      !inMonth && "bg-muted/30 text-muted-foreground",
                    )}
                  >
                    <Link
                      href={href("semana", d)}
                      className={cn(
                        "mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs hover:bg-accent",
                        isToday && "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      {d.getDate()}
                    </Link>
                    {/* En el celular: puntos; en pantallas grandes: títulos */}
                    <div className="flex flex-wrap gap-1 md:hidden">
                      {list.map((e) => (
                        <Link key={e.id} href={`/eventos/${e.id}`} className="h-2 w-2 rounded-full bg-primary" aria-label={e.title} />
                      ))}
                    </div>
                    <ul className="hidden space-y-1 md:block">
                      {list.slice(0, 3).map((e) => (
                        <li key={e.id}>
                          <Link
                            href={`/eventos/${e.id}`}
                            className={cn(
                              "block truncate rounded-md px-1.5 py-0.5 text-xs hover:bg-primary/25",
                              e.participants.length ? "bg-primary/20 text-primary" : "bg-secondary",
                            )}
                            title={`${formatTime(e.date)} ${e.title}`}
                          >
                            <span className="font-mono">{formatTime(e.date)}</span> {e.title}
                          </Link>
                        </li>
                      ))}
                      {list.length > 3 && (
                        <li>
                          <Link href={href("semana", d)} className="px-1.5 text-[11px] text-muted-foreground hover:underline">
                            +{list.length - 3} más
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-2 hidden text-xs text-muted-foreground md:block">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-primary/40 align-middle" /> Eventos donde estás asignado
          </p>

          {/* Lista del mes (sobre todo para el celular) */}
          <EventList
            title="Eventos del mes"
            events={events.filter((e) => isSameMonth(e.date, date))}
            empty="No hay eventos este mes."
          />
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const list = byDay.get(dayKey(d)) ?? [];
            const isToday = isSameDay(d, today);
            return (
              <section key={d.toISOString()} className={cn("rounded-2xl border bg-card p-3", isToday && "border-primary")}>
                <div className="mb-2 flex items-center justify-between">
                  <p className={cn("text-sm font-medium", isToday && "text-primary")}>
                    {cap(format(d, "EEE d", { locale: es }))}
                  </p>
                  {canCreate && d >= today && (
                    <Link
                      href={newEventHref(d)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={`Nuevo evento el ${format(d, "d 'de' MMMM", { locale: es })}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((e) => (
                      <li key={e.id}>
                        <Link href={`/eventos/${e.id}`} className="block rounded-xl bg-primary/10 p-2 text-sm hover:bg-primary/20">
                          <p className="font-mono text-xs text-primary">{formatTime(e.date)}</p>
                          <p className="font-medium leading-tight">{e.title}</p>
                          {e.participants[0] && (
                            <div className="mt-1">
                              <StatusBadge status={e.participants[0].status} />
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function EventList({
  title,
  events,
  empty,
}: {
  title: string;
  events: { id: string; title: string; date: Date; template: string; location: string | null; participants: { status: string; role: string }[] }[];
  empty: string;
}) {
  return (
    <section className="mt-6 space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/eventos/${e.id}`} className="flex items-center gap-3 p-3 hover:bg-accent/40">
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[11px] uppercase text-muted-foreground">{format(e.date, "EEE", { locale: es })}</p>
                  <p className="text-lg font-semibold leading-none">{e.date.getDate()}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {formatTime(e.date)} · {templateLabel(e.template)}
                    </span>
                    {e.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </span>
                    )}
                  </p>
                </div>
                {e.participants[0] && <StatusBadge status={e.participants[0].status} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
