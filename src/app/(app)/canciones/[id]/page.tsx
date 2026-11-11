import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gauge, Pencil } from "lucide-react";
import { EmptyState } from "@/components/common/page-header";
import { KeyBadge } from "@/components/events/status-badge";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { SongAutoScroll } from "@/components/songs/song-auto-scroll";
import { SongNotes } from "@/components/songs/song-notes";
import { SongDetailsGate, SongPrefsProvider } from "@/components/songs/song-prefs";
import { SongToolbar } from "@/components/songs/song-toolbar";
import { SongViewProvider } from "@/components/songs/song-view";
import { SongViewer } from "@/components/songs/song-viewer";
import { Button } from "@/components/ui/button";
import { requireTeamContext } from "@/lib/session";
import { parseSongPrefs } from "@/lib/song-prefs";
import { parseTags } from "@/lib/songs";
import { getSong } from "@/server/queries/songs";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  const song = await getSong(ctx, params.id);
  return { title: song?.title ?? "Canción" };
}

export default async function CancionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tono?: string };
}) {
  const ctx = await requireTeamContext();
  const song = await getSong(ctx, params.id);
  if (!song) notFound();

  // ?tono=A abre la canción ya transpuesta (por ejemplo, desde el setlist de un evento)
  const tono = searchParams.tono && /^[A-G][#b]?m?$/.test(searchParams.tono) ? searchParams.tono : null;
  const tags = parseTags(song.tags);

  return (
    <SongPrefsProvider initial={parseSongPrefs(ctx.user.songPrefs)}>
      <SongViewProvider key={song.id} originalKey={song.key} initialKey={tono}>
        <div className="space-y-5">
          <Link
            href="/canciones"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Canciones
          </Link>

          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
                <FavoriteButton songId={song.id} favorite={song.favorite} />
              </div>
              <SongDetailsGate>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {song.artist && <span>{song.artist}</span>}
                  {song.key && (
                    <span className="flex items-center gap-1.5">
                      Tono <KeyBadge musicalKey={song.key} />
                    </span>
                  )}
                  {song.bpm && (
                    <span className="flex items-center gap-1">
                      <Gauge className="h-4 w-4" /> {song.bpm} BPM
                    </span>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {song.notes && (
                  <div className="max-w-2xl rounded-xl border bg-card px-3 py-2">
                    <SongNotes text={song.notes} />
                  </div>
                )}
              </SongDetailsGate>
            </div>
            <SongToolbar
              song={{ id: song.id, title: song.title, chordSheet: song.chordSheet, notes: song.notes }}
              canEdit={ctx.access.manageSongs}
            />
          </header>

          <div className="min-w-0">
            {song.chordSheet?.trim() ? (
              <SongViewer source={song.chordSheet} />
            ) : (
              <EmptyState
                icon={Pencil}
                title="Sin letra ni acordes"
                description={
                  ctx.access.manageSongs
                    ? "Pegá la letra con los acordes para verla acá y cambiarle el tono."
                    : undefined
                }
                action={
                  ctx.access.manageSongs ? (
                    <Button asChild>
                      <Link href={`/canciones/${song.id}/editar`}>Agregar letra y acordes</Link>
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        </div>
        <SongAutoScroll bpm={song.bpm} />
      </SongViewProvider>
    </SongPrefsProvider>
  );
}
