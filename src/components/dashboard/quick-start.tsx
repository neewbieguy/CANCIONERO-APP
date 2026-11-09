import Link from "next/link";
import { CalendarPlus, Music2, UserPlus } from "lucide-react";
import { InviteDialog } from "@/components/team/invite-dialog";

const tile =
  "group flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40";
const icon = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary";

export function QuickStart({
  inviteLink,
  teamName,
  eventCount,
  songCount,
  memberCount,
}: {
  inviteLink: string;
  teamName: string;
  eventCount: number;
  songCount: number;
  memberCount: number;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Empezar</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/eventos/nuevo" className={tile}>
          <span className={icon}>
            <CalendarPlus className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-medium">Nuevo evento</span>
            <span className="block text-xs text-muted-foreground">{eventCount} creados</span>
          </span>
        </Link>
        <Link href="/canciones/nueva" className={tile}>
          <span className={icon}>
            <Music2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-medium">Añadir canciones</span>
            <span className="block text-xs text-muted-foreground">{songCount} en la biblioteca</span>
          </span>
        </Link>
        <InviteDialog link={inviteLink} teamName={teamName}>
          <button className={tile}>
            <span className={icon}>
              <UserPlus className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-medium">Invitar miembros</span>
              <span className="block text-xs text-muted-foreground">
                {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
              </span>
            </span>
          </button>
        </InviteDialog>
      </div>
    </section>
  );
}
