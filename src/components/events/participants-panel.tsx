"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar, type AvatarUser } from "@/components/common/user-avatar";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { StatusBadge } from "@/components/events/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_ROLES, PARTICIPANT_STATUSES, PARTICIPANT_STATUS_LABELS, type ParticipantStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { addParticipant, removeParticipant, setParticipantStatus } from "@/server/actions/participants";

export type ParticipantDTO = { id: string; userId: string; role: string; status: string; user: AvatarUser & { id: string } };
export type MemberOption = AvatarUser & { id: string; instrument: string | null };

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

export function ParticipantsPanel({
  eventId,
  participants,
  members,
  currentUserId,
  canEdit,
  suggestedRoles,
}: {
  eventId: string;
  participants: ParticipantDTO[];
  members: MemberOption[];
  currentUserId: string;
  canEdit: boolean;
  suggestedRoles: string[];
}) {
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const me = participants.find((p) => p.userId === currentUserId);
  const confirmed = participants.filter((p) => p.status === "confirmed").length;
  const assigned = new Set(participants.map((p) => p.userId));
  const available = members.filter((m) => !assigned.has(m.id));

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error);
      else toast.success(success);
    });

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <div>
          <h2 className="font-semibold">Equipo del evento</h2>
          <p className="text-xs text-muted-foreground">
            {confirmed}/{participants.length} confirmados
          </p>
        </div>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)} disabled={available.length === 0}>
            <UserPlus /> Asignar
          </Button>
        )}
      </div>

      {me && (
        <div className="space-y-2 border-b bg-primary/5 p-4">
          <p className="text-sm">
            Tu rol: <strong>{me.role}</strong>
          </p>
          <RsvpButtons eventId={eventId} status={me.status} />
        </div>
      )}

      {participants.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          {canEdit ? "Asigná a músicos y técnicos con su rol para este evento." : "Todavía no hay nadie asignado."}
        </p>
      ) : (
        <ul className="divide-y">
          {participants.map((p) => {
            const name = p.user.name ?? p.user.email ?? "?";
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <UserAvatar user={p.user} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {name}
                    {p.userId === currentUserId && <span className="font-normal text-muted-foreground"> (vos)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{p.role}</p>
                </div>
                <StatusBadge status={p.status} />
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Opciones de ${name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Marcar como</DropdownMenuLabel>
                      {PARTICIPANT_STATUSES.map((s: ParticipantStatus) => (
                        <DropdownMenuItem
                          key={s}
                          disabled={p.status === s}
                          onSelect={() => run(() => setParticipantStatus(eventId, p.userId, s), `${name}: ${PARTICIPANT_STATUS_LABELS[s]}`)}
                        >
                          <StatusBadge status={s} compact /> {PARTICIPANT_STATUS_LABELS[s]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => run(() => removeParticipant(eventId, p.userId), `Quitaste a ${name} del evento`)}
                      >
                        <Trash2 /> Quitar del evento
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit && (
        <AssignDialog
          open={adding}
          onOpenChange={setAdding}
          eventId={eventId}
          members={available}
          suggestedRoles={suggestedRoles}
        />
      )}
    </section>
  );
}

function AssignDialog({
  open,
  onOpenChange,
  eventId,
  members,
  suggestedRoles,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  eventId: string;
  members: MemberOption[];
  suggestedRoles: string[];
}) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [pending, start] = useTransition();
  const roles = Array.from(new Set([...suggestedRoles, ...EVENT_ROLES]));

  const pickMember = (id: string) => {
    setUserId(id);
    const m = members.find((x) => x.id === id);
    if (m?.instrument) setRole(m.instrument);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setUserId("");
          setRole("");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar al evento</DialogTitle>
          <DialogDescription>Le llega una notificación para que confirme.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await addParticipant({ eventId, userId, role });
              if (!res.ok) return void toast.error(res.error);
              const m = members.find((x) => x.id === userId);
              toast.success(`Asignaste a ${m?.name ?? m?.email ?? "la persona"}`);
              setUserId("");
              setRole("");
              // Queda abierto para asignar a varios seguidos
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="assign-member">Miembro</Label>
            <select id="assign-member" className={selectClass} value={userId} onChange={(e) => pickMember(e.target.value)} required>
              <option value="" disabled>
                Elegí a alguien…
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                  {m.instrument ? ` · ${m.instrument}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assign-role">Rol en este evento</Label>
            <Input
              id="assign-role"
              list="assign-roles"
              maxLength={40}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ej: Voz principal"
            />
            <datalist id="assign-roles">
              {roles.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestedRoles.slice(0, 8).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:border-primary/50",
                    role === r && "border-primary bg-primary/15 text-primary",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Listo
            </Button>
            <Button type="submit" disabled={pending || !userId || !role.trim()}>
              Asignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
