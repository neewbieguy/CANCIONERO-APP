"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMinutes, format, nextSunday, setHours, setMinutes, startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateTimeLocal } from "@/lib/dates";
import { formatDuration, templateSongSlots } from "@/lib/setlist";
import { EVENT_TEMPLATES, getTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { createEvent, updateEvent } from "@/server/actions/events";

export type EventFormValues = {
  title: string;
  date: string; // ISO
  endDate: string | null; // ISO
  template: string;
  location: string | null;
  notes: string | null;
};

/** Fecha sugerida según la plantilla: próximo domingo para servicios, mañana para el resto. */
function suggestedDate(templateId: string, day?: string) {
  const t = getTemplate(templateId);
  const chosen = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T00:00`) : null;
  const base =
    chosen && !Number.isNaN(chosen.getTime())
      ? chosen
      : templateId === "sunday_service"
        ? nextSunday(new Date())
        : addDays(new Date(), 1);
  return setMinutes(setHours(startOfDay(base), t.defaultHour), 0);
}

type Props = {
  mode: "create" | "edit";
  eventId?: string;
  initial?: EventFormValues;
  onDone?: () => void;
  /** Día elegido desde el calendario ("2026-11-15"). */
  defaultDay?: string;
};

/** Las fechas usan la zona horaria del navegador, así que el formulario se dibuja recién en el cliente. */
export function EventForm(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[520px] animate-pulse rounded-xl bg-muted/40" />;
  return <EventFormInner {...props} />;
}

function EventFormInner({ mode, eventId, initial, onDone, defaultDay }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const startTemplate = initial?.template ?? "sunday_service";
  const firstDate = initial ? new Date(initial.date) : suggestedDate(startTemplate, defaultDay);

  const [template, setTemplate] = useState(startTemplate);
  const [title, setTitle] = useState(initial?.title ?? getTemplate(startTemplate).defaultTitle);
  const [titleTouched, setTitleTouched] = useState(Boolean(initial));
  const [date, setDate] = useState(toDateTimeLocal(firstDate));
  const [endTime, setEndTime] = useState(
    initial
      ? initial.endDate
        ? format(new Date(initial.endDate), "HH:mm")
        : ""
      : format(addMinutes(firstDate, getTemplate(startTemplate).durationMin), "HH:mm"),
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const pickTemplate = (id: string) => {
    const t = getTemplate(id);
    setTemplate(id);
    if (!titleTouched) setTitle(t.defaultTitle);
    if (mode === "create") {
      const d = suggestedDate(id, defaultDay);
      setDate(toDateTimeLocal(d));
      setEndTime(format(addMinutes(d, t.durationMin), "HH:mm"));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(date);
    if (Number.isNaN(startDate.getTime())) return void toast.error("Elegí fecha y hora");
    let end: Date | null = null;
    if (endTime) {
      const [h, m] = endTime.split(":").map(Number);
      end = setMinutes(setHours(startOfDay(startDate), h), m);
      if (end <= startDate) end = addDays(end, 1); // termina pasada la medianoche
    }
    // Se mandan en ISO para que la hora local del navegador no dependa de la zona horaria del servidor
    const input = {
      title,
      date: startDate.toISOString(),
      endDate: end ? end.toISOString() : null,
      template,
      location,
      notes,
    };
    start(async () => {
      if (mode === "create") {
        const res = await createEvent(input);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Evento creado. Ahora armá el setlist.");
        router.push(`/eventos/${res.id}`);
      } else {
        const res = await updateEvent(eventId!, input);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Evento actualizado");
        onDone?.();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label>Plantilla</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {EVENT_TEMPLATES.map((t) => {
            const slots = templateSongSlots(t);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTemplate(t.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors hover:border-primary/50",
                  template === t.id && "border-primary bg-primary/10",
                )}
                aria-pressed={template === t.id}
              >
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.description}</span>
                {mode === "create" && t.blocks.length > 0 && (
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    ~{formatDuration(t.durationMin)} · {slots} {slots === 1 ? "canción sugerida" : "canciones sugeridas"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {mode === "create" && (
          <p className="text-xs text-muted-foreground">Los momentos de la plantilla (oración, ofrenda…) se agregan solos al setlist.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          required
          maxLength={80}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(true);
          }}
          placeholder="Ej: Servicio dominical: Santa Cena"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha y hora</Label>
          <Input id="date" type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end">Termina (opcional)</Label>
          <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Lugar</Label>
        <Input id="location" maxLength={80} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Templo principal" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas para el equipo</Label>
        <Textarea
          id="notes"
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Horario de prueba de sonido, vestimenta, secuencias…"
        />
      </div>

      <div className="flex justify-end gap-2">
        {mode === "create" ? (
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending || title.trim().length < 2}>
          {pending && <Loader2 className="animate-spin" />}
          {mode === "create" ? "Crear evento" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
