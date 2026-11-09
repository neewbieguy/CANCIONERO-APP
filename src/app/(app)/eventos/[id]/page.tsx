import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CalendarPlus, Clock, MapPin, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventActions } from "@/components/events/event-actions";
import { EventNotes } from "@/components/events/event-notes";
import { ParticipantsPanel } from "@/components/events/participants-panel";
import { SetlistEditor } from "@/components/events/setlist-editor";
import { formatEventDate, formatTime, relativeDay } from "@/lib/dates";
import { requireTeamContext } from "@/lib/session";
import { getTemplate } from "@/lib/templates";
import { getEventDetail, getEventEditorOptions } from "@/server/queries/events";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  const event = await getEventDetail(ctx, params.id);
  return { title: event?.title ?? "Evento" };
}

export default async function EventoPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  const canEdit = ctx.access.manageEvents;
  const [event, options] = await Promise.all([
    getEventDetail(ctx, params.id),
    canEdit ? getEventEditorOptions(ctx) : null,
  ]);
  if (!event) notFound();

  const template = getTemplate(event.template);
  const past = event.date < new Date(Date.now() - 6 * 60 * 60 * 1000);

  return (
    <div className="space-y-5">
      <Link href="/eventos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Eventos
      </Link>

      <header className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {past ? "Ya pasó" : relativeDay(event.date)}
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{template.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatEventDate(event.date)}
            </span>
            {event.endDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> hasta las {formatTime(event.endDate)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {event.setlist.some((i) => i.type === "song" && i.song) && (
            <Button asChild>
              <Link href={`/eventos/${event.id}/atril`}>
                <MonitorPlay /> Modo Atril
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="icon" title="Agregar a mi calendario">
            <a href={`/eventos/${event.id}/calendario.ics`} download aria-label="Agregar a mi calendario">
              <CalendarPlus />
            </a>
          </Button>
          {canEdit && (
            <EventActions
              eventId={event.id}
              values={{
                title: event.title,
                date: event.date.toISOString(),
                endDate: event.endDate?.toISOString() ?? null,
                template: event.template,
                location: event.location,
                notes: event.notes,
              }}
            />
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <SetlistEditor
            eventId={event.id}
            canEdit={canEdit}
            songs={options?.songs ?? []}
            items={event.setlist.map((i) => ({
              id: i.id,
              type: i.type,
              title: i.title,
              key: i.key,
              durationMin: i.durationMin,
              notes: i.notes,
              song: i.song,
            }))}
          />
        </div>
        <aside className="space-y-5">
          <ParticipantsPanel
            eventId={event.id}
            currentUserId={ctx.user.id}
            canEdit={canEdit}
            members={options?.members ?? []}
            suggestedRoles={template.defaultRoles}
            participants={event.participants.map((p) => ({
              id: p.id,
              userId: p.userId,
              role: p.role,
              status: p.status,
              user: p.user,
            }))}
          />
          <EventNotes eventId={event.id} notes={event.notes} canEdit={canEdit} />
        </aside>
      </div>
    </div>
  );
}
