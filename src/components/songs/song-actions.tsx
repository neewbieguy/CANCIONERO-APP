"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { deleteSong } from "@/server/actions/songs";

export function SongActions({ songId, title }: { songId: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <>
      <Button asChild variant="secondary">
        <Link href={`/canciones/${songId}/editar`}>
          <Pencil /> Editar
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Borrar canción" disabled={pending} className="text-muted-foreground hover:text-destructive">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar &quot;{title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quita de la biblioteca y de los setlists de eventos futuros. En los eventos pasados queda como
              &quot;Canción eliminada&quot;. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                start(async () => {
                  const res = await deleteSong(songId);
                  if (!res.ok) return void toast.error(res.error);
                  toast.success("Canción borrada");
                  router.push("/canciones");
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
