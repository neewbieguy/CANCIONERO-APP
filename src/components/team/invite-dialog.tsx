"use client";

import { useState } from "react";
import { Check, Copy, Link2, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para contextos sin Clipboard API (http en red local)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyInviteButton({
  link,
  label = "Copiar link de invitación",
  ...props
}: { link: string; label?: string } & React.ComponentProps<typeof Button>) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      {...props}
      onClick={async () => {
        if (await copyText(link)) {
          setCopied(true);
          toast.success("Link copiado. Compartilo con tu equipo.");
          setTimeout(() => setCopied(false), 2000);
        } else toast.error("No se pudo copiar");
      }}
    >
      {copied ? <Check /> : <Link2 />}
      {label}
    </Button>
  );
}

export function InviteDialog({
  link,
  teamName,
  children,
}: {
  link: string;
  teamName: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const message = `¡Sumate a "${teamName}" en Cancionero! ${link}`;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar miembros</DialogTitle>
          <DialogDescription>
            Cualquiera con este link puede unirse a <strong>{teamName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={async () => {
              if (await copyText(link)) {
                setCopied(true);
                toast.success("Link copiado");
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            aria-label="Copiar link"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="secondary" asChild>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" className="fill-current" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-.9-1-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 .9-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
              </svg>
              WhatsApp
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href={`mailto:?subject=${encodeURIComponent(`Invitación a ${teamName}`)}&body=${encodeURIComponent(message)}`}>
              <Mail /> Email
            </a>
          </Button>
          {canShare && (
            <Button
              variant="secondary"
              onClick={() => navigator.share({ title: "Cancionero", text: message, url: link }).catch(() => {})}
            >
              <Share2 /> Compartir
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
