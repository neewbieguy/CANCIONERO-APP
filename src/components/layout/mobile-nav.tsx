"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MORE_ITEMS, NAV_ITEMS, isActive } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";
import { HelpDialog, PremiumDialog } from "./extras";

export function MobileNav({ unreadChats }: { unreadChats: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.mobile);
  const moreActive = MORE_ITEMS.some((i) => isActive(pathname, i.href));

  const tab = "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground";

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur md:hidden">
      <div className="flex">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const badge = item.href === "/chats" ? unreadChats : 0;
          return (
            <Link key={item.href} href={item.href} className={cn(tab, active && "text-primary")}>
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button className={cn(tab, moreActive && "text-primary")} onClick={() => setOpen(true)}>
          <MoreHorizontal className="h-5 w-5" />
          Más
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Más</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {MORE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3 text-sm",
                  isActive(pathname, item.href) && "border-primary/50 text-primary",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <ThemeToggle side="top" />
            <HelpDialog side="top" />
            <PremiumDialog side="top" />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
