import { requireTeamContext } from "@/lib/session";
import { getDashboardData } from "@/server/queries/dashboard";
import { TeamBanner } from "@/components/dashboard/team-banner";
import { EmptyEventCard, NextEventCard } from "@/components/dashboard/event-cards";
import { QuickStart } from "@/components/dashboard/quick-start";
import { CurrentTeamCard, FavoritesCard, WeekCalendar } from "@/components/dashboard/side-panel";
import { InstallBanner } from "@/components/pwa/install-prompt";

export const metadata = { title: "Inicio" };

export default async function HomePage() {
  const ctx = await requireTeamContext();
  const data = await getDashboardData(ctx);
  const firstName = ctx.user.name?.split(" ")[0] ?? "👋";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <InstallBanner />
        <TeamBanner members={data.members} inviteLink={data.inviteLink} teamName={ctx.team.name} userName={firstName} />
        {data.nextEvent ? <NextEventCard event={data.nextEvent} userId={ctx.user.id} /> : <EmptyEventCard canCreate={ctx.access.manageEvents} />}
        <QuickStart
          access={ctx.access}
          inviteLink={data.inviteLink}
          teamName={ctx.team.name}
          eventCount={data.eventCount}
          songCount={data.songCount}
          memberCount={data.members.length}
        />
      </div>
      <aside className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <CurrentTeamCard name={ctx.team.name} members={data.members} />
        <WeekCalendar events={data.weekEvents} />
        <FavoritesCard songs={data.favorites} />
      </aside>
    </div>
  );
}
