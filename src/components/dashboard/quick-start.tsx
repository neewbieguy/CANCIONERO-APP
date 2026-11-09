import Link from "next/link";
import { CalendarPlus, Music2, UserPlus } from "lucide-react";
import { InviteDialog } from "@/components/team/invite-dialog";
import type { Access } from "@/lib/permissions";

const tile =
  "group flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40";
const icon = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary";

/** Atajos de creación. Cada uno aparece solo si el usuario tiene ese permiso. */
export function QuickStart({
  access,
  inviteLink,
  teamName,
  eventCount,
  songCount,
  memberCount,
}: {
  access: Access;
  inviteLink: string | null;
  teamName: string;
  eventCount: number;
  songCount: number;
  memberCount: number;
}) {
  const showInvite = access.invite && inviteLink;
  const count = [access.manageEvents, access.manageSongs, showInvite].filter(Boolean).length;
  if (count === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Empezar</h2>
      <div className={count === 1 ? "grid gap-3" : count === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-3"}>
        {access.manageEvents && (
          <Link href="/eventos/nuevo" className={tile}>
            <span className={icon}>
              <CalendarPlus className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-medium">Nuevo evento</span>
              <span className="block text-xs text-muted-foreground">{eventCount} creados</span>
            </span>
          </Link>
        )}
        {access.manageSongs && (
          <Link href="/canciones/nueva" className={tile}>
            <span className={icon}>
              <Music2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-medium">Añadir canciones</span>
              <span className="block text-xs text-muted-foreground">{songCount} en la biblioteca</span>
            </span>
          </Link>
        )}
        {showInvite && (
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
        )}
      </div>
    </section>
  );
}
