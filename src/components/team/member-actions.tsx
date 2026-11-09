"use client";

import { useState, useTransition } from "react";
import { Guitar, MoreHorizontal, ShieldCheck, ShieldOff, UserMinus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EVENT_ROLES } from "@/lib/constants";
import { changeMemberRole, removeMember, setMemberInstrument } from "@/server/actions/members";

type Props = {
  userId: string;
  name: string;
  role: string;
  instrument: string | null;
  isSelf: boolean;
  actorIsAdmin: boolean;
};

/** Menú "⋯" de cada miembro en /equipo. El admin ve todo; un miembro solo puede editar su instrumento. */
export function MemberActions({ userId, name, role, instrument, isSelf, actorIsAdmin }: Props) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [value, setValue] = useState(instrument ?? "");

  if (!actorIsAdmin && !isSelf) return null;
  const targetIsAdmin = role === "admin";

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(success);
      after?.();
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending} aria-label={`Opciones de ${name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={() => {
              setValue(instrument ?? "");
              setEditing(true);
            }}
          >
            <Guitar /> {isSelf ? "Cambiar mi instrumento" : "Cambiar instrumento"}
          </DropdownMenuItem>
          {actorIsAdmin && (
            <>
              <DropdownMenuSeparator />
              {targetIsAdmin ? (
                <DropdownMenuItem
                  onSelect={() =>
                    run(() => changeMemberRole({ userId, role: "member" }), `${name} ahora es miembro`)
                  }
                >
                  <ShieldOff /> {isSelf ? "Dejar de ser admin" : "Quitar admin"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => run(() => changeMemberRole({ userId, role: "admin" }), `${name} ahora es admin`)}
                >
                  <ShieldCheck /> Hacer admin
                </DropdownMenuItem>
              )}
              {!isSelf && (
                <DropdownMenuItem onSelect={() => setRemoving(true)} className="text-destructive">
                  <UserMinus /> Quitar del equipo
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Instrumento</DialogTitle>
            <DialogDescription>
              {isSelf ? "¿Qué hacés habitualmente en el equipo?" : `¿Qué hace ${name} habitualmente en el equipo?`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => setMemberInstrument({ userId, instrument: value }), "Instrumento guardado", () =>
                setEditing(false),
              );
            }}
          >
            <Input
              autoFocus
              list={`roles-${userId}`}
              placeholder="Ej: Guitarra acústica"
              maxLength={40}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <datalist id={`roles-${userId}`}>
              {EVENT_ROLES.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removing} onOpenChange={setRemoving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar a {name} del equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Va a dejar de ver los eventos y canciones del equipo, y se lo saca de los eventos futuros. Podés volver a
              invitarlo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => run(() => removeMember(userId), `${name} ya no está en el equipo`)}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
