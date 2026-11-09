"use client";

import { useEffect, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/server/actions/songs";

export function FavoriteButton({ songId, favorite, className }: { songId: string; favorite: boolean; className?: string }) {
  const [on, setOn] = useState(favorite);
  const [pending, start] = useTransition();
  useEffect(() => setOn(favorite), [favorite]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(on ? "text-amber-400 hover:text-amber-400" : "text-muted-foreground", className)}
      disabled={pending}
      aria-label={on ? "Quitar de favoritas" : "Marcar como favorita"}
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const res = await toggleFavorite(songId, next);
          if (!res.ok) {
            setOn(!next);
            toast.error(res.error);
          }
        });
      }}
    >
      <Star className={cn(on && "fill-current")} />
    </Button>
  );
}
