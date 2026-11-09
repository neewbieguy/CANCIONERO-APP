import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarStack, UserAvatar, type AvatarUser } from "@/components/common/user-avatar";
import { CopyInviteButton, InviteDialog } from "@/components/team/invite-dialog";
import { plural } from "@/lib/utils";

export function TeamBanner({
  members,
  inviteLink,
  teamName,
  userName,
}: {
  members: AvatarUser[];
  inviteLink: string;
  teamName: string;
  userName: string;
}) {
  const alone = members.length <= 1;
  const greeting = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 via-card to-card p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {greeting}, {userName}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {alone ? "Por ahora solo estás tú" : `Tu equipo: ${plural(members.length, "miembro")}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {alone
              ? "Invitá a vocalistas, músicos y técnicos para planificar juntos."
              : "Coordiná eventos, setlists y ensayos con todos en un solo lugar."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center -space-x-2">
            {alone ? (
              <UserAvatar user={members[0]} className="h-10 w-10 ring-2 ring-card" />
            ) : (
              <AvatarStack users={members} max={5} size="h-10 w-10" />
            )}
            {Array.from({ length: alone ? 3 : 1 }).map((_, i) => (
              <InviteDialog key={i} link={inviteLink} teamName={teamName}>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 bg-card text-muted-foreground ring-2 ring-card transition-colors hover:border-primary hover:text-primary"
                  aria-label="Invitar miembro"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </InviteDialog>
            ))}
          </div>
          {alone ? (
            <CopyInviteButton link={inviteLink} />
          ) : (
            <InviteDialog link={inviteLink} teamName={teamName}>
              <Button variant="secondary">Invitar</Button>
            </InviteDialog>
          )}
        </div>
      </div>
    </section>
  );
}
