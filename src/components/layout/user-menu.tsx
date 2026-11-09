"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Check, LogOut, Plus, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar, type AvatarUser } from "@/components/common/user-avatar";
import { switchTeam } from "@/server/actions/team";
import { CreateTeamDialog } from "./create-team-dialog";

export type TeamOption = { id: string; name: string };

export function UserMenu({
  user,
  teams,
  currentTeamId,
  side = "right",
}: {
  user: AvatarUser;
  teams: TeamOption[];
  currentTeamId: string;
  side?: "right" | "bottom";
}) {
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);

  return (
    <>
    <CreateTeamDialog open={creating} onOpenChange={setCreating} />
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-primary focus-visible:ring-2" disabled={pending}>
        <UserAvatar user={user} />
        <span className="sr-only">Menú de usuario</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{user.name ?? "Sin nombre"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Equipos</DropdownMenuLabel>
        {teams.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() =>
              t.id !== currentTeamId &&
              start(async () => {
                const res = await switchTeam(t.id);
                if (res.ok) toast.success(`Cambiaste a ${t.name}`);
                else toast.error(res.error);
              })
            }
          >
            <span className="flex-1 truncate">{t.name}</span>
            {t.id === currentTeamId && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => setCreating(true)}>
          <Plus /> Crear equipo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/equipo">
            <Users /> Equipo y miembros
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ajustes">
            <Settings /> Ajustes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })} className="text-destructive">
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
