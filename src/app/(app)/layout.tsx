import Link from "next/link";
import { db } from "@/lib/db";
import { requireTeamContext } from "@/lib/session";
import { LogoMark } from "@/components/brand/logo";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell, type NotificationDTO } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeSync } from "@/components/layout/theme-toggle";
import { LiveUpdates } from "@/components/layout/live-updates";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, team } = await requireTeamContext();

  const [memberships, notifications, unreadNotifications] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const teams = memberships.map((m) => m.team);
  const avatarUser = { id: user.id, name: user.name, email: user.email, image: user.image };
  const notificationDTOs: NotificationDTO[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.readAt !== null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-dvh">
      <ThemeSync theme={user.theme} />
      <LiveUpdates />
      <Sidebar user={avatarUser} teams={teams} currentTeamId={team.id} />

      <div className="md:pl-[72px]">
        <header className="pt-safe sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:px-8">
            <Link href="/" className="md:hidden" aria-label="Inicio">
              <LogoMark className="h-8 w-8" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{team.name}</p>
            </div>
            <NotificationBell notifications={notificationDTOs} unread={unreadNotifications} />
            <div className="md:hidden">
              <UserMenu user={avatarUser} teams={teams} currentTeamId={team.id} side="bottom" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
