import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { MemberActions } from "@/components/team/member-actions";
import { MemberPermissionSwitches } from "@/components/team/member-permissions";
import { InviteCard, LeaveTeamButton, RenameTeamButton } from "@/components/team/team-admin";
import { db } from "@/lib/db";
import { getOrCreateActiveInvite, inviteUrl } from "@/lib/invites";
import { MEMBER_PERMISSIONS, MEMBER_PERMISSION_LABELS } from "@/lib/permissions";
import { requireTeamContext } from "@/lib/session";
import { plural } from "@/lib/utils";

export const metadata = { title: "Equipo" };

export default async function EquipoPage() {
  const ctx = await requireTeamContext();
  const [members, invite] = await Promise.all([
    db.membership.findMany({
      where: { teamId: ctx.team.id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    ctx.access.invite ? getOrCreateActiveInvite(ctx.team.id, ctx.user.id) : null,
  ]);

  const adminCount = members.filter((m) => m.role === "admin").length;
  const onlyAdmin = ctx.isAdmin && adminCount <= 1;

  return (
    <>
      <PageHeader
        title="Equipo"
        description={`${ctx.team.name} · ${plural(members.length, "miembro")}`}
        actions={
          <>
            {ctx.isAdmin && <RenameTeamButton teamName={ctx.team.name} />}
            <LeaveTeamButton
              userId={ctx.user.id}
              teamName={ctx.team.name}
              disabledReason={
                onlyAdmin && members.length > 1
                  ? "Sos el único admin: nombrá a otro admin antes de salir."
                  : onlyAdmin
                    ? "Sos el único miembro de este equipo."
                    : undefined
              }
            />
          </>
        }
      />

      <div className="space-y-4">
        {invite && <InviteCard link={inviteUrl(invite.token)} teamName={ctx.team.name} />}

        {ctx.isAdmin ? (
          <div className="flex items-start gap-3 rounded-2xl border bg-primary/5 p-4 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Permisos</p>
              <p className="text-muted-foreground">
                Los admins pueden todo. A cada miembro le podés dar permiso para gestionar{" "}
                <strong>Eventos</strong> (crear, editar y borrar eventos y setlists), <strong>Canciones</strong>{" "}
                (añadir, editar y borrar) o <strong>Invitar</strong> (compartir el link de invitación). Con el menú{" "}
                <strong>⋯</strong> podés hacer admin a alguien, cambiar su instrumento o quitarlo del equipo.
              </p>
            </div>
          </div>
        ) : null}

        <ul className="divide-y rounded-2xl border bg-card">
          {members.map((m) => {
            const name = m.user.name ?? m.user.email;
            const firstName = m.user.name?.split(" ")[0] ?? name;
            const isAdminMember = m.role === "admin";
            const isSelf = m.userId === ctx.user.id;
            const granted = MEMBER_PERMISSIONS.filter((p) => m[p]).map((p) => MEMBER_PERMISSION_LABELS[p].label);
            return (
              <li key={m.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <UserAvatar user={m.user} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      <span className="truncate">
                        {name}
                        {isSelf && <span className="text-muted-foreground"> (vos)</span>}
                      </span>
                      {isAdminMember && <Badge variant="secondary">Admin</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.instrument ?? (isSelf ? "Sin instrumento · usá ⋯ para agregarlo" : "Sin instrumento")}
                    </p>
                  </div>
                  <div className="ml-auto md:hidden">
                    <MemberActions
                      userId={m.userId}
                      name={firstName}
                      role={m.role}
                      instrument={m.instrument}
                      isSelf={isSelf}
                      actorIsAdmin={ctx.isAdmin}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdminMember ? (
                    <span className="text-xs text-muted-foreground md:text-right">Todos los permisos</span>
                  ) : ctx.isAdmin ? (
                    <MemberPermissionSwitches
                      userId={m.userId}
                      name={firstName}
                      perms={{ canManageEvents: m.canManageEvents, canManageSongs: m.canManageSongs, canInvite: m.canInvite }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground md:text-right">
                      {granted.length ? `Puede gestionar: ${granted.join(", ")}` : "Sin permisos de edición"}
                    </span>
                  )}
                  <div className="hidden md:block">
                    <MemberActions
                      userId={m.userId}
                      name={firstName}
                      role={m.role}
                      instrument={m.instrument}
                      isSelf={isSelf}
                      actorIsAdmin={ctx.isAdmin}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
