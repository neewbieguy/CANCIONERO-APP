"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Music2, Search, Star, X } from "lucide-react";
import { KeyBadge } from "@/components/events/status-badge";
import { Input } from "@/components/ui/input";
import { formatShortDate } from "@/lib/dates";
import { normalize, parseTags, songMatches, tagCounts } from "@/lib/songs";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";

export type LibrarySong = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: number | null;
  tags: string | null;
  hasSheet: boolean;
  favorite: boolean;
  timesUsed: number;
  lastUsed: string | null; // ISO
};

type Sort = "title" | "recent" | "used";

const chip = "rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50";
const chipOn = "border-primary bg-primary/15 text-primary";

export function SongLibrary({ songs }: { songs: LibrarySong[] }) {
  const [query, setQuery] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("title");

  const tags = useMemo(() => tagCounts(songs).slice(0, 12), [songs]);

  const filtered = useMemo(() => {
    const list = songs.filter(
      (s) =>
        songMatches(s, query) &&
        (!onlyFav || s.favorite) &&
        (!tag || parseTags(s.tags).some((t) => normalize(t) === normalize(tag))),
    );
    if (sort === "used") return [...list].sort((a, b) => b.timesUsed - a.timesUsed || a.title.localeCompare(b.title));
    if (sort === "recent")
      return [...list].sort((a, b) => (b.lastUsed ?? "").localeCompare(a.lastUsed ?? "") || a.title.localeCompare(b.title));
    return list;
  }, [songs, query, onlyFav, tag, sort]);

  const favCount = songs.filter((s) => s.favorite).length;
  const filtering = query || onlyFav || tag;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título, artista, etiqueta o tono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Ordenar"
        >
          <option value="title">Orden: A-Z</option>
          <option value="recent">Orden: usadas hace poco</option>
          <option value="used">Orden: más usadas</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button className={cn(chip, onlyFav && chipOn, "inline-flex items-center gap-1")} onClick={() => setOnlyFav(!onlyFav)}>
          <Star className={cn("h-3 w-3", onlyFav && "fill-current")} /> Favoritas ({favCount})
        </button>
        {tags.map((t) => (
          <button key={t.tag} className={cn(chip, tag === t.tag && chipOn)} onClick={() => setTag(tag === t.tag ? null : t.tag)}>
            {t.tag} <span className="text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {songs.length} {songs.length === 1 ? "canción" : "canciones"}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center">
          <Music2 className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{filtering ? "No hay canciones que coincidan" : "La biblioteca está vacía"}</p>
          {filtering && (
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => {
                setQuery("");
                setOnlyFav(false);
                setTag(null);
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {filtered.map((s) => (
            <li key={s.id} className="flex items-center gap-2 pr-2">
              <Link href={`/canciones/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3 hover:bg-accent/40 md:px-4">
                <KeyBadge musicalKey={s.key ?? "–"} className="w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      s.artist,
                      s.bpm && `${s.bpm} BPM`,
                      s.timesUsed > 0 && `usada ${s.timesUsed} ${s.timesUsed === 1 ? "vez" : "veces"}`,
                      s.lastUsed && `última: ${formatShortDate(new Date(s.lastUsed))}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="hidden flex-wrap justify-end gap-1 md:flex">
                  {parseTags(s.tags)
                    .slice(0, 3)
                    .map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                </div>
                {!s.hasSheet && (
                  <span title="Sin letra ni acordes">
                    <FileText className="h-4 w-4 text-muted-foreground/50" />
                  </span>
                )}
              </Link>
              <FavoriteButton songId={s.id} favorite={s.favorite} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
