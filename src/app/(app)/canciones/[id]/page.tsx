import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Gauge, Pencil } from "lucide-react";
import { EmptyState } from "@/components/common/page-header";
import { KeyBadge } from "@/components/events/status-badge";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { SongActions } from "@/components/songs/song-actions";
import { SongViewer } from "@/components/songs/song-viewer";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/dates";
import { semitonesBetween } from "@/lib/music/transpose";
import { requireTeamContext } from "@/lib/session";
import { parseTags } from "@/lib/songs";
import { getSong } from "@/server/queries/songs";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  const song = await getSong(ctx, params.id);
  return { title: song?.title ?? "Canción" };
}

export default async function CancionPage({ params, searchParams }: { params: { id: string }; searchParams: { tono?: string } }) {
  const ctx = await requireTeamContext();
  const song = await getSong(ctx, params.id);
  if (!song) notFound();

  // ?tono=A abre la canción ya transpuesta (por ejemplo, desde el setlist de un evento)
  const tono = searchParams.tono && /^[A-G][#b]?m?$/.test(searchParams.tono) ? searchParams.tono : null;
  const initialSemitones = tono && song.key ? semitonesBetween(song.key, tono) : 0;
  const tags = parseTags(song.tags);

  return (
    <div className="space-y-5">
      <Link href="/canciones" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Canciones
      </Link>

      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
            <FavoriteButton songId={song.id} favorite={song.favorite} />
          </div>
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
        </div>
        {ctx.access.manageSongs && (
          <div className="flex shrink-0 gap-2">
            <SongActions songId={song.id} title={song.title} />
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {song.chordSheet?.trim() ? (
            <SongViewer source={song.chordSheet} originalKey={song.key} initialSemitones={initialSemitones} />
          ) : (
            <EmptyState
              icon={Pencil}
              title="Sin letra ni acordes"
              description={ctx.access.manageSongs ? "Pegá la letra con los acordes para verla acá y cambiarle el tono." : undefined}
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

        <aside className="space-y-3 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-medium">Usada en</h2>
          {song.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no está en ningún setlist.</p>
          ) : (
            <ul className="space-y-1">
              {song.events.map((u, i) => (
                <li key={i}>
                  <Link href={`/eventos/${u.event.id}`} className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-accent">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{u.event.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatShortDate(u.event.date)}</span>
                    <KeyBadge musicalKey={u.key} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
