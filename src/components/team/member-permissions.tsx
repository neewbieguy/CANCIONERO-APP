"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { MEMBER_PERMISSIONS, MEMBER_PERMISSION_LABELS, type MemberPermission } from "@/lib/permissions";
import { setMemberPermission } from "@/server/actions/members";

export type MemberPerms = Record<MemberPermission, boolean>;

/** Interruptores de permisos de un miembro. Solo los ve el admin. */
export function MemberPermissionSwitches({ userId, name, perms }: { userId: string; name: string; perms: MemberPerms }) {
  const [state, setState] = useState(perms);
  const [pending, start] = useTransition();
  useEffect(() => setState(perms), [perms]);

  const toggle = (permission: MemberPermission, value: boolean) => {
    const prev = state;
    setState({ ...state, [permission]: value });
    start(async () => {
      const res = await setMemberPermission({ userId, permission, value });
      if (!res.ok) {
        setState(prev);
        toast.error(res.error);
      } else {
        const label = MEMBER_PERMISSION_LABELS[permission].label;
        toast.success(value ? `${name} ahora puede gestionar: ${label}` : `Le quitaste a ${name} el permiso: ${label}`);
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {MEMBER_PERMISSIONS.map((p) => {
        const id = `${userId}-${p}`;
        return (
          <label key={p} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm" title={MEMBER_PERMISSION_LABELS[p].description}>
            <Switch id={id} checked={state[p]} disabled={pending} onCheckedChange={(v) => toggle(p, v)} />
            {MEMBER_PERMISSION_LABELS[p].label}
          </label>
        );
      })}
    </div>
  );
}
