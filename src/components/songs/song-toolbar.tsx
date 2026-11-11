"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Pencil, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { KeyPicker } from "./key-picker";
import { SongPreferences, type PrefsSong } from "./song-preferences";
import { useSongView } from "./song-view";

const pillItem =
  "inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0";

type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
};

/** Botón de la cápsula, con tooltip y aria-label. */
const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(function PillButton(
  { label, active, className, children, ...props },
  ref,
) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          className={cn(pillItem, active && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground", className)}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
});

/** Botón que muestra el tono actual y abre el selector (popover, o panel desde abajo en el celular). */
function KeyButton() {
  const { currentKey, semitones, capo } = useSongView();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const text = currentKey ?? (semitones > 0 ? `+${semitones}` : `${semitones}`);
  const label = `Tono: ${text}${capo ? `, cejilla en traste ${capo}` : ""}`;

  const trigger = (
    <PillButton label={label} aria-expanded={open} className="px-2.5 font-mono font-semibold text-primary hover:text-primary" onClick={isMobile ? () => setOpen(true) : undefined}>
      {text}
      {capo > 0 && <span className="font-sans text-[11px] font-medium text-muted-foreground">c{capo}</span>}
    </PillButton>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl" aria-describedby={undefined}>
            <SheetHeader className="mb-4">
              <SheetTitle>Tono</SheetTitle>
            </SheetHeader>
            <div className="pb-safe">
              <KeyPicker />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-80" aria-label="Tono">
        <p className="mb-3 text-sm font-medium">Tono</p>
        <KeyPicker />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Cápsula de acciones de la canción: desplazamiento, tono, preferencias y editar.
 */
export function SongToolbar({ song, canEdit }: { song: PrefsSong; canEdit: boolean }) {
  const { autoScroll, setAutoScroll } = useSongView();
  const [prefsOpen, setPrefsOpen] = useState(false);
  return (
    <div
      role="toolbar"
      aria-label="Acciones de la canción"
      className="inline-flex max-w-full shrink-0 items-center gap-0.5 self-start rounded-full border bg-card p-1 shadow-sm"
    >
      <PillButton label="Desplazamiento automático" active={autoScroll} aria-pressed={autoScroll} onClick={() => setAutoScroll(!autoScroll)}>
        <ArrowUpDown />
      </PillButton>
      <KeyButton />
      <PillButton label="Preferencias" aria-haspopup="dialog" aria-expanded={prefsOpen} onClick={() => setPrefsOpen(true)}>
        <SlidersHorizontal />
      </PillButton>
      <SongPreferences open={prefsOpen} onOpenChange={setPrefsOpen} song={song} canEdit={canEdit} />

      {canEdit && (
        <>
          <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/canciones/${song.id}/editar`} aria-label="Editar canción" className={cn(pillItem, "px-2.5 text-foreground sm:pr-3.5")}>
                <Pencil />
                <span className="hidden sm:inline">Editar</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Editar canción</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}
