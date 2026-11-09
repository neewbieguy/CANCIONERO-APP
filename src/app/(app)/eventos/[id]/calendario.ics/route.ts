import { db } from "@/lib/db";
import { buildIcs } from "@/lib/ics";
import { requireTeamContext } from "@/lib/session";
import { absoluteUrl } from "@/lib/utils";

/** Descarga el evento como .ics para agregarlo a Google Calendar, Apple Calendar u Outlook. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTeamContext();
  const event = await db.event.findFirst({
    where: { id: params.id, teamId: ctx.team.id },
    include: { participants: { where: { userId: ctx.user.id }, select: { role: true } } },
  });
  if (!event) return new Response("Evento no encontrado", { status: 404 });

  const myRole = event.participants[0]?.role;
  const description = [myRole && `Tu rol: ${myRole}`, event.notes, `Ver en Cancionero: ${absoluteUrl(`/eventos/${event.id}`)}`]
    .filter(Boolean)
    .join("\n\n");

  const ics = buildIcs({
    id: event.id,
    title: `${event.title} · ${ctx.team.name}`,
    start: event.date,
    end: event.endDate,
    location: event.location,
    description,
    url: absoluteUrl(`/eventos/${event.id}`),
  });

  const filename = event.title.normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "evento";
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
