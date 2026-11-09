"use client";

import { HelpCircle } from "lucide-react";
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
  ["¿Cómo armo un setlist?", "Creá un evento desde una plantilla y agregá canciones o momentos. Reordená arrastrando (en compu) o con las flechas."],
  ["¿Puedo cambiar el tono?", "Sí, cada canción del setlist tiene su propio tono y la hoja de acordes se transpone sola."],
  ["¿Cómo uso el Modo Atril?", "Abrí un evento y tocá \"Modo Atril\": ves las canciones del setlist en grande, con cambio de tono y desplazamiento automático. Funciona con pedaleras Bluetooth."],
  ["¿Puedo pegar acordes de internet?", "Sí. Al añadir una canción pegá la letra con los acordes arriba y se convierte sola."],
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
