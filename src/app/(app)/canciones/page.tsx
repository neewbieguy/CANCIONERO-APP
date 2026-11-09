import Link from "next/link";
import { Music2, Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { SongLibrary } from "@/components/songs/song-library";
import { Button } from "@/components/ui/button";
import { requireTeamContext } from "@/lib/session";
import { listSongs } from "@/server/queries/songs";

export const metadata = { title: "Canciones" };

export default async function CancionesPage() {
  const ctx = await requireTeamContext();
  const songs = await listSongs(ctx);
  const canAdd = ctx.access.manageSongs;

  const addButton = canAdd && (
    <Button asChild>
      <Link href="/canciones/nueva">
        <Plus /> Añadir canción
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader title="Canciones" description="La biblioteca del equipo, con acordes y cambio de tono." actions={addButton} />
      {songs.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="Todavía no hay canciones"
          description={
            canAdd
              ? "Cargá las canciones que toca tu equipo. Podés pegar la letra con los acordes arriba y se acomoda sola."
              : "Cuando alguien cargue canciones, las vas a ver acá."
          }
          action={addButton || undefined}
        />
      ) : (
        <SongLibrary songs={songs.map((s) => ({ ...s, lastUsed: s.lastUsed?.toISOString() ?? null }))} />
      )}
    </>
  );
}
