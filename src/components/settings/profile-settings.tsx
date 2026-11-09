"use client";

import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveThemePreference, updateProfile } from "@/server/actions/settings";

export function ProfileForm({ user }: { user: { id: string; name: string | null; email: string; image: string | null } }) {
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [pending, start] = useTransition();
  const dirty = name !== (user.name ?? "") || image !== (user.image ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProfile({ name, image });
          if (!res.ok) toast.error(res.error);
          else toast.success("Perfil guardado");
        });
      }}
    >
      <div className="flex items-center gap-4">
        <UserAvatar user={{ id: user.id, name: name || user.email, image: image || null }} className="h-14 w-14" />
        <div className="min-w-0">
          <p className="truncate font-medium">{name || "Sin nombre"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cómo te ve el equipo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="image">Foto (link a una imagen, opcional)</Label>
          <Input id="image" type="url" maxLength={500} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !dirty || !name.trim()}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

const THEMES = [
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Como el dispositivo", icon: Monitor },
] as const;

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => {
            setTheme(t.value);
            void saveThemePreference(t.value);
          }}
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors hover:border-primary/50",
            mounted && theme === t.value && "border-primary bg-primary/10",
          )}
          aria-pressed={mounted && theme === t.value}
        >
          <t.icon className="h-4 w-4" /> {t.label}
        </button>
      ))}
    </div>
  );
}

export function SignOutButton() {
  return (
    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut /> Cerrar sesión
    </Button>
  );
}
