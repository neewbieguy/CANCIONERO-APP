"use client";

import { forwardRef, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, FileText, Minus, NotebookPen, Pencil, Plus, Trash2, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toPlainText, transposeChordPro } from "@/lib/music/chordpro";
import {
  CHORD_NOTATIONS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  SHEET_FONTS,
  SONG_VIEWS,
  type SongPrefs,
} from "@/lib/song-prefs";
import { useIsMobile } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { updateSongNotes } from "@/server/actions/songs";
import { DeleteSongDialog } from "./song-actions";
import { useSongPrefs } from "./song-prefs";
import { useSongView } from "./song-view";

export type PrefsSong = { id: string; title: string; chordSheet: string | null; notes: string | null };
type Screen = "main" | "font" | "notes";

const TITLES: Record<Screen, string> = { main: "Preferencias", font: "Fuente y tamaño", notes: "Notas de la canción" };

/** Modal de preferencias de la canción (panel desde abajo en el celular). */
export function SongPreferences({
  open,
  onOpenChange,
  song,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: PrefsSong;
  canEdit: boolean;
}) {
  const isMobile = useIsMobile();
  const [screen, setScreen] = useState<Screen>("main");

  // Cada vez que se abre, empieza en la pantalla principal
  useEffect(() => {
    if (open) setScreen("main");
  }, [open]);

  const body = (
    <>
      {screen === "main" && <MainScreen song={song} canEdit={canEdit} go={setScreen} />}
      {screen === "font" && <FontScreen />}
      {screen === "notes" && <NotesScreen song={song} done={() => setScreen("main")} />}
    </>
  );

  const header = (Title: typeof DialogTitle | typeof SheetTitle) => (
    <div className="mb-4 flex min-h-8 items-center gap-1 pr-8">
      {screen !== "main" && (
        <Button variant="ghost" size="icon-sm" className="-ml-2" onClick={() => setScreen("main")} aria-label="Volver a Preferencias">
          <ChevronLeft />
        </Button>
      )}
      <Title className="text-lg font-semibold">{TITLES[screen]}</Title>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl" aria-describedby={undefined}>
          {header(SheetTitle)}
          <div className="pb-safe">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block max-h-[85dvh] overflow-y-auto sm:max-w-md" aria-describedby={undefined}>
        {header(DialogTitle)}
        {body}
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}

type RowButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
};

/** Fila de lista que se puede tocar (lleva a otra pantalla o hace una acción). */
const RowButton = forwardRef<HTMLButtonElement, RowButtonProps>(function RowButton(
  { icon: Icon, label, hint, className, trailing = <ChevronRight className="h-4 w-4 text-muted-foreground" />, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      {hint && <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>}
      {trailing}
    </button>
  );
});

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent">
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fileName = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "cancion";

function MainScreen({ song, canEdit, go }: { song: PrefsSong; canEdit: boolean; go: (s: Screen) => void }) {
  const { prefs, setPref } = useSongPrefs();
  const { semitones, currentKey } = useSongView();
  const font = SHEET_FONTS.find((f) => f.value === prefs.font) ?? SHEET_FONTS[0];

  // Se exporta en el tono que se está viendo (sin la cejilla)
  const exportAs = (format: "cho" | "txt") => {
    if (!song.chordSheet) return;
    const source = transposeChordPro(song.chordSheet, semitones, currentKey ?? undefined);
    download(`${fileName(song.title)}.${format}`, format === "cho" ? source : toPlainText(source));
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/canciones/${song.id}/editar`}>
            <Pencil /> Editar canción
          </Link>
        </Button>
      )}

      <section>
        <SectionTitle>Vista de canción</SectionTitle>
        <div role="radiogroup" aria-label="Vista de canción" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          {SONG_VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={prefs.view === v.value}
              onClick={() => setPref("view", v.value)}
              className={cn(
                "h-8 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                prefs.view === v.value ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Modo de vista de acordes</SectionTitle>
        <Select value={prefs.notation} onValueChange={(v) => setPref("notation", v as SongPrefs["notation"])}>
          <SelectTrigger aria-label="Modo de vista de acordes">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHORD_NOTATIONS.map((n) => (
              <SelectItem key={n.value} value={n.value}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section>
        <SectionTitle>Fuente y tamaño</SectionTitle>
        <RowButton icon={Type} label="Fuente y tamaño" hint={`${font.label} · ${prefs.fontSize} px`} onClick={() => go("font")} />
      </section>

      <section>
        <SectionTitle>Opciones de visualización</SectionTitle>
        <div className="-mx-1">
          <ToggleRow
            label="Detalles de la canción"
            description="Autor, tono, BPM, etiquetas y notas arriba de la letra."
            checked={prefs.showDetails}
            onChange={(v) => setPref("showDetails", v)}
          />
          <ToggleRow
            label="Vista compacta"
            description="Condensada: ignora la estructura (sin títulos de sección ni espacios)."
            checked={prefs.compact}
            onChange={(v) => setPref("compact", v)}
          />
          <ToggleRow
            label="Diseño de 2 columnas"
            description="Lado a lado cuando la pantalla es ancha."
            checked={prefs.twoColumns}
            onChange={(v) => setPref("twoColumns", v)}
          />
        </div>
      </section>

      <section>
        <SectionTitle>Otro</SectionTitle>
        <div className="-mx-1 space-y-0.5">
          {canEdit && <RowButton icon={NotebookPen} label="Editar notas" hint={song.notes ? undefined : "Vacías"} onClick={() => go("notes")} />}
          <RowButton
            icon={Download}
            label="Exportar ChordPro"
            hint=".cho"
            trailing={null}
            disabled={!song.chordSheet}
            className="disabled:pointer-events-none disabled:opacity-50"
            onClick={() => exportAs("cho")}
          />
          <RowButton
            icon={FileText}
            label="Exportar texto (acordes arriba)"
            hint=".txt"
            trailing={null}
            disabled={!song.chordSheet}
            className="disabled:pointer-events-none disabled:opacity-50"
            onClick={() => exportAs("txt")}
          />
          {canEdit && (
            <DeleteSongDialog songId={song.id} title={song.title}>
              <RowButton icon={Trash2} label="Eliminar canción" trailing={null} className="text-destructive hover:bg-destructive/10" />
            </DeleteSongDialog>
          )}
        </div>
      </section>
    </div>
  );
}

function FontScreen() {
  const { prefs, setPref } = useSongPrefs();
  const size = (n: number) => setPref("fontSize", Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n)));

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Tipografía</SectionTitle>
        <div role="radiogroup" aria-label="Tipografía" className="grid grid-cols-3 gap-2">
          {SHEET_FONTS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={prefs.font === f.value}
              onClick={() => setPref("font", f.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                prefs.font === f.value ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
              )}
            >
              <span className={cn("text-2xl", f.className)}>Aa</span>
              <span className="text-xs">{f.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Tamaño de letra</SectionTitle>
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => size(prefs.fontSize - 1)} disabled={prefs.fontSize <= FONT_SIZE_MIN} aria-label="Letra más chica">
            <Minus />
          </Button>
          <span className="font-mono text-sm font-semibold tabular-nums" aria-live="polite">
            {prefs.fontSize} px
          </span>
          <Button variant="outline" size="icon" onClick={() => size(prefs.fontSize + 1)} disabled={prefs.fontSize >= FONT_SIZE_MAX} aria-label="Letra más grande">
            <Plus />
          </Button>
        </div>
      </section>

      <section>
        <SectionTitle>Vista previa</SectionTitle>
        <div className={cn("rounded-xl border bg-background p-3 leading-snug", SHEET_FONTS.find((f) => f.value === prefs.font)?.className)} style={{ fontSize: prefs.fontSize }}>
          <p className="font-semibold text-primary">G&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D</p>
          <p>Así se ve la letra</p>
        </div>
      </section>
    </div>
  );
}

function NotesScreen({ song, done }: { song: PrefsSong; done: () => void }) {
  const router = useRouter();
  const [text, setText] = useState(song.notes ?? "");
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const res = await updateSongNotes(song.id, text);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Notas guardadas");
      router.refresh();
      done();
    });

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        maxLength={5000}
        placeholder={"Ej.: **Intro** solo piano\n- Repetir el coro 2 veces\n- Final lento"}
        aria-label="Notas de la canción"
        className="font-mono text-sm"
        autoFocus
      />
      <p className="text-xs text-muted-foreground">
        Las ve todo el equipo en los detalles de la canción. Podés usar **negrita**, *cursiva* y listas con guiones.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={done} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={pending}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
