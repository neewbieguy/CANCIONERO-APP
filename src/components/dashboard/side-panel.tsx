import Link from "next/link";
import { isSameDay } from "date-fns";
import { ArrowRight, Heart, Music2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarStack, type AvatarUser } from "@/components/common/user-avatar";
import { KeyBadge } from "@/components/events/status-badge";
import { formatTime, nextSevenDays, weekdayInitial } from "@/lib/dates";
import { cn, plural } from "@/lib/utils";
import type { DashboardData } from "@/server/queries/dashboard";

const card = "rounded-2xl border bg-card p-5";
const title = "text-sm font-semibold";

export function CurrentTeamCard({ name, members }: { name: string; members: AvatarUser[] }) {
  return (
    <section className={card}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Equipo actual</p>
        <Link href="/equipo" className="text-xs text-primary hover:underline">
          Gestionar
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{plural(members.length, "miembro")}</p>
        </div>
      </div>
      <AvatarStack users={members} max={6} className="mt-4" />
    </section>
  );
}

export function WeekCalendar({ events }: { events: DashboardData["weekEvents"] }) {
  const days = nextSevenDays();
  const today = days[0];
  const upcoming = events.slice(0, 3);

  return (
    <section className={card}>
      <div className="mb-4 flex items-center justify-between">
        <p className={title}>Esta semana</p>
        <Link href="/calendario?vista=semana" className="flex items-center gap-1 text-xs text-primary hover:underline">
          Horario <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const has = events.some((e) => isSameDay(e.date, d));
          const isToday = isSameDay(d, today);
          return (
            <Link
              key={d.toISOString()}
              href="/calendario?vista=semana"
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition-colors hover:bg-accent",
                isToday && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <span className={cn("text-[10px]", isToday ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {weekdayInitial(d)}
              </span>
              <span className="font-semibold">{d.getDate()}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  has ? (isToday ? "bg-primary-foreground" : "bg-primary") : "bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </div>
      {upcoming.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {upcoming.map((e) => (
            <li key={e.id}>
              <Link href={`/eventos/${e.id}`} className="flex items-center gap-3 rounded-xl p-2 text-sm hover:bg-accent">
                <span className="w-10 text-xs text-muted-foreground">{weekdayInitial(e.date)} {e.date.getDate()}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{e.title}</span>
                <span className="text-xs text-muted-foreground">{formatTime(e.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-center text-xs text-muted-foreground">Sin eventos en los próximos 7 días.</p>
      )}
    </section>
  );
}

export function FavoritesCard({ songs }: { songs: DashboardData["favorites"] }) {
  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between">
        <p className={title}>Canciones favoritas</p>
        <Heart className="h-4 w-4 text-rose-500" />
      </div>
      {songs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Music2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Marcá canciones con el corazón para tenerlas a mano.</p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/canciones">Explorar canciones</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-1">
          {songs.map((s) => (
            <li key={s.id}>
              <Link href={`/canciones/${s.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.title}</span>
                  {s.artist && <span className="block truncate text-xs text-muted-foreground">{s.artist}</span>}
                </span>
                <KeyBadge musicalKey={s.key} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
