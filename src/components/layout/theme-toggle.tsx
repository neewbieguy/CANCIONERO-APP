"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { saveThemePreference } from "@/server/actions/settings";

export function ThemeToggle({ side = "right" }: { side?: "right" | "top" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === "dark";
  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    void saveThemePreference(next);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" onClick={toggle}>
          {isDark ? <Sun /> : <Moon />}
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{isDark ? "Tema claro" : "Tema oscuro"}</TooltipContent>
    </Tooltip>
  );
}

/** Aplica el tema guardado en el perfil si este dispositivo todavía no eligió uno. */
export function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    try {
      if (!localStorage.getItem("theme")) setTheme(theme);
    } catch {
      /* sin almacenamiento */
    }
  }, [theme, setTheme]);
  return null;
}
