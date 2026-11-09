import { notFound } from "next/navigation";
import { StageMode } from "@/components/songs/stage-mode";
import { requireTeamContext } from "@/lib/session";
import { getStageData } from "@/server/queries/songs";

export const metadata = { title: "Modo Atril" };

/** Modo Atril: pantalla completa, sin menú, para leer las canciones del setlist en vivo. */
export default async function AtrilPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  const event = await getStageData(ctx, params.id);
  if (!event) notFound();

  return <StageMode eventId={event.id} eventTitle={event.title} items={event.setlist} />;
}
