"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, RefreshCw, Share2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { removeMember, resetInviteLink } from "@/server/actions/members";
import { renameTeam } from "@/server/actions/settings";
import { CopyInviteButton, InviteDialog } from "./invite-dialog";

/** Tarjeta con el link de invitación: copiar, compartir y generar uno nuevo. */
export function InviteCard({ link: initialLink, teamName }: { link: string; teamName: string }) {
  const [link, setLink] = useState(initialLink);
  const [pending, start] = useTransition();
  useEffect(() => setLink(initialLink), [initialLink]);

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4">
      <div>
        <p className="font-medium">Link de invitación</p>
        <p className="text-sm text-muted-foreground">Cualquiera con este link puede unirse al equipo como miembro.</p>
      </div>
      <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      <div className="flex flex-wrap gap-2">
        <CopyInviteButton link={link} label="Copiar link" />
        <InviteDialog link={link} teamName={teamName}>
          <Button variant="secondary">
            <Share2 /> Compartir
          </Button>
        </InviteDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" disabled={pending}>
              <RefreshCw className={pending ? "animate-spin" : undefined} /> Generar link nuevo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Generar un link nuevo?</AlertDialogTitle>
              <AlertDialogDescription>
                El link actual va a dejar de funcionar. Usalo si se compartió con alguien que no debería unirse.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  start(async () => {
                    const res = await resetInviteLink();
                    if (!res.ok) return void toast.error(res.error);
                    setLink(res.link);
                    toast.success("Link nuevo generado");
                  })
                }
              >
                Generar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}

/** Botón para que el admin cambie el nombre del equipo. */
export function RenameTeamButton({ teamName }: { teamName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(teamName);
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setName(teamName);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Pencil /> Renombrar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nombre del equipo</DialogTitle>
          <DialogDescription>Lo ven todos los miembros.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await renameTeam(name);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Nombre actualizado");
              setOpen(false);
            });
          }}
        >
          <Input autoFocus maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          <DialogFooter>
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Salir del equipo actual. */
export function LeaveTeamButton({ userId, teamName, disabledReason }: { userId: string; teamName: string; disabledReason?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (disabledReason) {
    return (
      <Button variant="ghost" className="text-muted-foreground" title={disabledReason} onClick={() => toast.info(disabledReason)}>
        <LogOut /> Salir del equipo
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending}>
          <LogOut /> Salir del equipo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir de {teamName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a dejar de ver sus eventos y canciones. Para volver, alguien del equipo te tiene que invitar de nuevo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() =>
              start(async () => {
                const res = await removeMember(userId);
                if (!res.ok) return void toast.error(res.error);
                toast.success(`Saliste de ${teamName}`);
                router.push("/");
                router.refresh();
              })
            }
          >
            Salir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
