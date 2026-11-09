import { Check, Clock, X } from "lucide-react";
import { PARTICIPANT_STATUS_LABELS, type ParticipantStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<ParticipantStatus, string> = {
  pending: "bg-amber-500/15 text-amber-500",
  confirmed: "bg-emerald-500/15 text-emerald-500",
  declined: "bg-rose-500/15 text-rose-500",
};
const ICONS = { pending: Clock, confirmed: Check, declined: X };

export function StatusBadge({ status, className, compact }: { status: string; className?: string; compact?: boolean }) {
  const s = (status in STYLES ? status : "pending") as ParticipantStatus;
  const Icon = ICONS[s];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        STYLES[s],
        compact && "h-5 w-5 justify-center p-0",
        className,
      )}
      title={PARTICIPANT_STATUS_LABELS[s]}
    >
      <Icon className="h-3 w-3" />
      {!compact && PARTICIPANT_STATUS_LABELS[s]}
    </span>
  );
}

export function KeyBadge({ musicalKey, className }: { musicalKey?: string | null; className?: string }) {
  if (!musicalKey) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-8 items-center justify-center rounded-lg bg-primary/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary",
        className,
      )}
    >
      {musicalKey}
    </span>
  );
}
