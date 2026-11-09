import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { EventForm } from "@/components/events/event-form";
import { requireTeamContext } from "@/lib/session";

export const metadata = { title: "Nuevo evento" };

export default async function NuevoEventoPage({ searchParams }: { searchParams: { fecha?: string } }) {
  const ctx = await requireTeamContext();
  if (!ctx.access.manageEvents) redirect("/eventos");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo evento" description={`Para ${ctx.team.name}`} />
      <div className="rounded-2xl border bg-card p-5">
        <EventForm mode="create" defaultDay={searchParams.fecha} />
      </div>
    </div>
  );
}
