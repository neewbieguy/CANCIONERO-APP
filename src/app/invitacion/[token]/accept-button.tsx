"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/server/actions/members";

export function AcceptInviteButton({ token, alreadyMember }: { token: string; alreadyMember: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await acceptInvite(token);
          if (!res.ok) return void toast.error(res.error);
          toast.success(alreadyMember ? `Cambiaste a ${res.teamName}` : `¡Te uniste a ${res.teamName}!`);
          router.push("/");
          router.refresh();
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {alreadyMember ? "Ya sos miembro · Ir al equipo" : "Unirme al equipo"}
    </Button>
  );
}
