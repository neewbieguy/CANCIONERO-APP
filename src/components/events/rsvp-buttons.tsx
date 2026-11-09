"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { respondToEvent } from "@/server/actions/participants";

export function RsvpButtons({ eventId, status }: { eventId: string; status: string }) {
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useState(status);
  useEffect(() => setOptimistic(status), [status]);

  const respond = (next: "confirmed" | "declined") => {
    const prev = optimistic;
    setOptimistic(next);
    start(async () => {
      const res = await respondToEvent(eventId, next);
      if (!res.ok) {
        setOptimistic(prev);
        toast.error(res.error);
      } else toast.success(next === "confirmed" ? "¡Confirmaste tu participación!" : "Avisamos que no podés");
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={optimistic === "confirmed" ? "default" : "outline"}
        className={cn("flex-1", optimistic === "confirmed" && "bg-emerald-600 hover:bg-emerald-600/90")}
        disabled={pending}
        onClick={() => respond("confirmed")}
      >
        <Check /> Confirmar
      </Button>
      <Button
        size="sm"
        variant={optimistic === "declined" ? "destructive" : "outline"}
        className="flex-1"
        disabled={pending}
        onClick={() => respond("declined")}
      >
        <X /> No puedo
      </Button>
    </div>
  );
}
