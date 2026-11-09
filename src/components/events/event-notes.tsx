"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { updateEventNotes } from "@/server/actions/events";

/** Notas del evento. Quien gestiona eventos las edita (se guardan al salir del campo). */
export function EventNotes({ eventId, notes, canEdit }: { eventId: string; notes: string | null; canEdit: boolean }) {
  const [value, setValue] = useState(notes ?? "");
  const [pending, start] = useTransition();
  useEffect(() => setValue(notes ?? ""), [notes]);

  if (!canEdit && !notes) return null;

  return (
    <section className="space-y-2 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Notas</h2>
        {pending && <span className="text-xs text-muted-foreground">Guardando…</span>}
      </div>
      {canEdit ? (
        <>
          <Textarea
            rows={4}
            maxLength={2000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              if (value.trim() === (notes ?? "").trim()) return;
              start(async () => {
                const res = await updateEventNotes(eventId, value);
                if (!res.ok) toast.error(res.error);
                else toast.success("Notas guardadas");
              });
            }}
            placeholder="Horario de prueba de sonido, vestimenta, secuencias…"
          />
          <p className="text-xs text-muted-foreground">Se guarda al salir del campo.</p>
        </>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notes}</p>
      )}
    </section>
  );
}
