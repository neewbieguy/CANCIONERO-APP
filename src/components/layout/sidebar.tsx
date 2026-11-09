"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AvatarUser } from "@/components/common/user-avatar";
import { NAV_ITEMS, isActive } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";
import { HelpDialog, PremiumDialog } from "./extras";
import { UserMenu, type TeamOption } from "./user-menu";

export function Sidebar({
  user,
  teams,
  currentTeamId,
  unreadChats,
}: {
  user: AvatarUser;
  teams: TeamOption[];
  currentTeamId: string;
  unreadChats: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center border-r bg-card/60 py-4 backdrop-blur md:flex">
      <Link href="/" className="mb-6" aria-label="Cancionero — inicio">
        <LogoMark className="h-10 w-10" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const badge = item.href === "/chats" && unreadChats > 0 ? unreadChats : 0;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                  {badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5">
        <ThemeToggle />
        <HelpDialog />
        <PremiumDialog />
        <div className="mt-2">
          <UserMenu user={user} teams={teams} currentTeamId={currentTeamId} />
        </div>
      </div>
    </aside>
  );
}
