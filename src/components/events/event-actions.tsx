"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { toDateTimeLocal } from "@/lib/dates";
import { deleteEvent, duplicateEvent } from "@/server/actions/events";
import { EventForm, type EventFormValues } from "./event-form";

/** Botón "Editar" + menú con duplicar y borrar. Solo para quien gestiona eventos. */
export function EventActions({ eventId, values }: { eventId: string; values: EventFormValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copyDate, setCopyDate] = useState("");

  return (
    <>
      <Button variant="secondary" onClick={() => setEditing(true)}>
        <Pencil /> Editar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Más opciones" disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setCopyDate(toDateTimeLocal(addDays(new Date(values.date), 7)));
              setDuplicating(true);
            }}
          >
            <Copy /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(true)}>
            <Trash2 /> Borrar evento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Si cambiás la fecha o el lugar, avisamos a los participantes.</DialogDescription>
          </DialogHeader>
          <EventForm mode="edit" eventId={eventId} initial={values} onDone={() => setEditing(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={duplicating} onOpenChange={setDuplicating}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Duplicar evento</DialogTitle>
            <DialogDescription>Se copian el setlist y los participantes (que quedan pendientes de confirmar).</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new Date(copyDate);
              if (Number.isNaN(d.getTime())) return void toast.error("Elegí fecha y hora");
              start(async () => {
                const res = await duplicateEvent(eventId, d.toISOString());
                if (!res.ok) return void toast.error(res.error);
                toast.success("Evento duplicado");
                setDuplicating(false);
                router.push(`/eventos/${res.id}`);
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="copy-date">Nueva fecha y hora</Label>
              <Input id="copy-date" type="datetime-local" required value={copyDate} onChange={(e) => setCopyDate(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Duplicar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar &quot;{values.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran el setlist y las asignaciones. Si el evento todavía no pasó, avisamos a los participantes que se
              canceló. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                start(async () => {
                  const res = await deleteEvent(eventId);
                  if (!res.ok) return void toast.error(res.error);
                  toast.success("Evento borrado");
                  router.push("/eventos");
                })
              }
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
