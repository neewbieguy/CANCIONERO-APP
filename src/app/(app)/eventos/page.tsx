import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, Music2, Plus, Ticket, Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { AvatarStack } from "@/components/common/user-avatar";
import { StatusBadge } from "@/components/events/status-badge";
import { Button } from "@/components/ui/button";
import { formatTime, monthYear, relativeDay } from "@/lib/dates";
import { requireTeamContext } from "@/lib/session";
import { templateLabel } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { listEvents, type EventListItem } from "@/server/queries/events";

export const metadata = { title: "Eventos" };

export default async function EventosPage({ searchParams }: { searchParams: { ver?: string } }) {
  const ctx = await requireTeamContext();
  const scope = searchParams.ver === "pasados" ? "past" : "upcoming";
  const events = await listEvents(ctx, scope);

  // Agrupar por mes
  const groups = new Map<string, EventListItem[]>();
  for (const e of events) {
    const key = monthYear(e.date);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  const tab = (value: "upcoming" | "past", label: string, href: string) => (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        scope === value ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
      )}
      aria-current={scope === value ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Servicios, ensayos y conciertos del equipo con su setlist."
        actions={
          ctx.access.manageEvents && (
            <Button asChild>
              <Link href="/eventos/nuevo">
                <Plus /> Nuevo evento
              </Link>
            </Button>
          )
        }
      />

      <nav className="mb-5 inline-flex rounded-xl bg-muted p-1">
        {tab("upcoming", "Próximos", "/eventos")}
        {tab("past", "Pasados", "/eventos?ver=pasados")}
      </nav>

      {events.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={scope === "upcoming" ? "No hay eventos próximos" : "Todavía no hay eventos pasados"}
          description={
            scope === "upcoming"
              ? ctx.access.manageEvents
                ? "Creá uno desde una plantilla: servicio dominical, ensayo o concierto."
                : "Cuando alguien cree un evento, lo vas a ver acá."
              : undefined
          }
          action={
            scope === "upcoming" && ctx.access.manageEvents ? (
              <Button asChild>
                <Link href="/eventos/nuevo">
                  <Plus /> Nuevo evento
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([month, items]) => (
            <section key={month} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">{month}</h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                {items.map((e) => (
                  <li key={e.id}>
                    <EventRow event={e} past={scope === "past"} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function EventRow({ event: e, past }: { event: EventListItem; past: boolean }) {
  return (
    <Link
      href={`/eventos/${e.id}`}
      className={cn(
        "flex gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40",
        past && "opacity-80",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 py-2 text-primary">
        <span className="text-[11px] font-medium uppercase">{format(e.date, "EEE", { locale: es })}</span>
        <span className="text-2xl font-semibold leading-none">{format(e.date, "d")}</span>
        <span className="text-[11px]">{formatTime(e.date)}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium">{e.title}</p>
          {e.myStatus && <StatusBadge status={e.myStatus} className="shrink-0" />}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {past ? templateLabel(e.template) : `${relativeDay(e.date)} · ${templateLabel(e.template)}`}
          </span>
          {e.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {e.location}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music2 className="h-3.5 w-3.5" /> {e.songCount} {e.songCount === 1 ? "canción" : "canciones"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {e.confirmed}/{e.participants.length}
            </span>
          </div>
          {e.participants.length > 0 && <AvatarStack users={e.participants} max={4} size="h-6 w-6" />}
        </div>
        {e.myRole && <p className="text-xs">Tu rol: <span className="font-medium">{e.myRole}</span></p>}
      </div>
    </Link>
  );
}
