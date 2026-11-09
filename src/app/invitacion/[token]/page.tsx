import Link from "next/link";
import { Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AvatarStack } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isInviteUsable } from "@/lib/invites";
import { plural } from "@/lib/utils";
import { AcceptInviteButton } from "./accept-button";

export const metadata = { title: "Invitación" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const [session, invite] = await Promise.all([
    auth(),
    db.invite.findUnique({
      where: { token: params.token },
      include: {
        createdBy: { select: { name: true, email: true } },
        team: {
          select: {
            id: true,
            name: true,
            memberships: {
              orderBy: { joinedAt: "asc" },
              select: { user: { select: { id: true, name: true, email: true, image: true } } },
            },
          },
        },
      },
    }),
  ]);

  const valid = invite && isInviteUsable(invite);
  const userId = session?.user?.id;
  const alreadyMember = valid && userId ? invite.team.memberships.some((m) => m.user.id === userId) : false;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />
      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo className="text-2xl" />
        </div>

        <div className="space-y-5 rounded-2xl border bg-card p-6 text-center">
          {!valid ? (
            <>
              <h1 className="text-lg font-semibold">Invitación no válida</h1>
              <p className="text-sm text-muted-foreground">
                El link expiró o fue reemplazado. Pedile a alguien del equipo que te mande uno nuevo.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/">Ir a Cancionero</Link>
              </Button>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Users className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {invite.createdBy.name ?? invite.createdBy.email} te invitó a
                </p>
                <h1 className="text-xl font-semibold">{invite.team.name}</h1>
                <p className="text-sm text-muted-foreground">{plural(invite.team.memberships.length, "miembro")}</p>
              </div>
              {invite.team.memberships.length > 0 && (
                <div className="flex justify-center">
                  <AvatarStack users={invite.team.memberships.map((m) => m.user)} max={6} size="h-9 w-9" />
                </div>
              )}

              {!userId ? (
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/invitacion/${params.token}`)}`}>
                      Entrar para unirme
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">Si no tenés cuenta, se crea al entrar.</p>
                </div>
              ) : (
                <AcceptInviteButton token={params.token} alreadyMember={alreadyMember} />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
