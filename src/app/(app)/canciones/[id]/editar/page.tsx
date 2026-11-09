import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { SongForm } from "@/components/songs/song-form";
import { requireTeamContext } from "@/lib/session";
import { getSong } from "@/server/queries/songs";

export const metadata = { title: "Editar canción" };

export default async function EditarCancionPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  if (!ctx.access.manageSongs) redirect(`/canciones/${params.id}`);
  const song = await getSong(ctx, params.id);
  if (!song) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Editar canción" description={song.title} />
      <div className="rounded-2xl border bg-card p-5">
        <SongForm
          mode="edit"
          songId={song.id}
          initial={{
            title: song.title,
            artist: song.artist,
            key: song.key,
            bpm: song.bpm,
            tags: song.tags,
            chordSheet: song.chordSheet,
          }}
        />
      </div>
    </div>
  );
}
