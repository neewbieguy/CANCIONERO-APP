"use client";

import Link from "next/link";
import { Crown, HelpCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function IconTrigger({ label, children, side }: { label: string; children: React.ReactNode; side: "right" | "top" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground">
            {children}
            <span className="sr-only">{label}</span>
          </Button>
        </DialogTrigger>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

const HELP = [
  ["¿Cómo invito a mi equipo?", "Desde Inicio o Equipo, copiá el link de invitación y compartilo por WhatsApp o email."],
  ["¿Cómo armo un setlist?", "Creá un evento desde una plantilla y agregá canciones o momentos. Arrastrá para reordenar."],
  ["¿Puedo cambiar el tono?", "Sí, cada canción del setlist tiene su propio tono y la hoja de acordes se transpone sola."],
  ["¿Funciona sin internet?", "Instalá la app. Las canciones y eventos que abriste quedan disponibles sin conexión."],
] as const;

export function HelpDialog({ side = "right" }: { side?: "right" | "top" }) {
  return (
    <Dialog>
      <IconTrigger label="Ayuda" side={side}>
        <HelpCircle />
      </IconTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ayuda</DialogTitle>
          <DialogDescription>Preguntas frecuentes sobre Cancionero.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {HELP.map(([q, a]) => (
            <div key={q}>
              <p className="text-sm font-medium">{q}</p>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const PRO = [
  "Equipos y miembros ilimitados",
  "Historial completo de estadísticas",
  "Adjuntar audios y PDFs a las canciones",
  "Notificaciones push avanzadas",
];

export function PremiumDialog({ side = "right" }: { side?: "right" | "top" }) {
  return (
    <Dialog>
      <IconTrigger label="Plan Premium" side={side}>
        <Crown className="text-amber-400" />
      </IconTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15">
            <Crown className="h-6 w-6 text-amber-400" />
          </div>
          <DialogTitle>Cancionero Premium</DialogTitle>
          <DialogDescription>Más herramientas para equipos que crecen.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {PRO.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" /> {f}
            </li>
          ))}
        </ul>
        <Button disabled className="w-full">
          Próximamente
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Mientras tanto, todo es gratis. <Link href="/ajustes" className="underline">Ver ajustes</Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
