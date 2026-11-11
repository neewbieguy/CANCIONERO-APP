"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { deleteSong } from "@/server/actions/songs";

/** Confirmación para borrar una canción. `children` es el botón que la abre. */
export function DeleteSongDialog({ songId, title, children }: { songId: string; title: string; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
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
            disabled={pending}
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
  );
}
