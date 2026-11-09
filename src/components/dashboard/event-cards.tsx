import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Mic2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/common/user-avatar";
import { KeyBadge, StatusBadge } from "@/components/events/status-badge";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { formatEventDate, relativeDay } from "@/lib/dates";
import { templateLabel } from "@/lib/templates";
import type { DashboardData } from "@/server/queries/dashboard";

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 220 140" className="h-32 w-auto" aria-hidden>
      <rect x="30" y="20" width="160" height="104" rx="18" className="fill-secondary" />
      <rect x="30" y="20" width="160" height="28" rx="14" className="fill-primary/30" />
      <circle cx="60" cy="34" r="5" className="fill-primary" />
      <circle cx="160" cy="34" r="5" className="fill-primary" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={46 + c * 27}
            y={58 + r * 20}
            width="18"
            height="12"
            rx="4"
            className={r === 1 && c === 3 ? "fill-primary" : "fill-muted-foreground/20"}
          />
        )),
      )}
      <g transform="translate(168 92)">
        <circle r="22" className="fill-primary" />
        <path d="M-2 -10 L8 -12 L8 4 M-2 -10 L-2 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="-5" cy="7" r="4" fill="white" />
        <circle cx="5" cy="5" r="4" fill="white" />
      </g>
    </svg>
  );
}

export function EmptyEventCard() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-10 text-center">
      <EmptyIllustration />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Planifica tu primer evento</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Elegí una plantilla (servicio dominical, ensayo o concierto), armá el setlist y asigná roles a tu equipo.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/eventos/nuevo">
          <Plus /> Nuevo evento
        </Link>
      </Button>
    </section>
  );
}

export function NextEventCard({ event, userId }: { event: NonNullable<DashboardData["nextEvent"]>; userId: string }) {
  const me = event.participants.find((p) => p.userId === userId);
  const confirmed = event.participants.filter((p) => p.status === "confirmed").length;
  const items = event.setlist.slice(0, 7);
  const songs = event.setlist.filter((i) => i.type === "song").length;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              Próximo evento · {relativeDay(event.date)}
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              {templateLabel(event.template)}
            </span>
          </div>
          <h2 className="text-xl font-semibold">{event.title}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatEventDate(event.date)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
            )}
          </div>
        </div>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href={`/eventos/${event.id}`}>
            Ver evento <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_280px]">
        <div className="p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Setlist · {songs} {songs === 1 ? "canción" : "canciones"}
          </p>
          {event.setlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay canciones.{" "}
              <Link href={`/eventos/${event.id}`} className="text-primary hover:underline">
                Armar setlist
              </Link>
            </p>
          ) : (
            <ol className="space-y-1">
              {items.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-accent/50">
                  <span className="w-5 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
                  {item.type === "song" ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="font-medium">{item.song?.title ?? "Canción eliminada"}</span>
                        {item.song?.artist && <span className="text-muted-foreground"> · {item.song.artist}</span>}
                      </span>
                      <KeyBadge musicalKey={item.key ?? item.song?.key} />
                    </>
                  ) : (
                    <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" /> {item.title}
                    </span>
                  )}
                </li>
              ))}
              {event.setlist.length > items.length && (
                <li className="px-2 pt-1 text-xs text-muted-foreground">+{event.setlist.length - items.length} más</li>
              )}
            </ol>
          )}
        </div>

        <div className="space-y-4 border-t p-5 md:border-l md:border-t-0">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Equipo · {confirmed}/{event.participants.length} confirmados
            </p>
            {event.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin participantes asignados.</p>
            ) : (
              <>
                <AvatarStack users={event.participants.map((p) => p.user)} max={6} />
                <ul className="mt-3 space-y-1.5">
                  {event.participants.slice(0, 4).map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <Mic2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {p.user.name ?? p.user.email}
                        <span className="text-muted-foreground"> · {p.role}</span>
                      </span>
                      <StatusBadge status={p.status} compact />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {me && (
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="mb-2 text-sm">
                Tu rol: <strong>{me.role}</strong>
              </p>
              <RsvpButtons eventId={event.id} status={me.status} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
