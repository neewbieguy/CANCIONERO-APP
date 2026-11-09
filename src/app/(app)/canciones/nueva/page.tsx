import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { SongForm } from "@/components/songs/song-form";
import { requireTeamContext } from "@/lib/session";

export const metadata = { title: "Nueva canción" };

export default async function NuevaCancionPage() {
  const ctx = await requireTeamContext();
  if (!ctx.access.manageSongs) redirect("/canciones");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Nueva canción" description={`Para la biblioteca de ${ctx.team.name}`} />
      <div className="rounded-2xl border bg-card p-5">
        <SongForm mode="create" />
      </div>
    </div>
  );
}
