import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "bg-blue-500/20 text-blue-300",
  "bg-violet-500/20 text-violet-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
  "bg-cyan-500/20 text-cyan-300",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export type AvatarUser = { id?: string; name?: string | null; email?: string | null; image?: string | null };

export function UserAvatar({ user, className }: { user: AvatarUser; className?: string }) {
  const label = user.name ?? user.email ?? "?";
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {user.image && <AvatarImage src={user.image} alt={label} />}
      <AvatarFallback className={cn("text-xs font-semibold", colorFor(user.id ?? label))}>
        {initials(label)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Avatares superpuestos con "+N". */
export function AvatarStack({
  users,
  max = 4,
  className,
  size = "h-8 w-8",
}: {
  users: AvatarUser[];
  max?: number;
  className?: string;
  size?: string;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((u, i) => (
        <UserAvatar key={u.id ?? i} user={u} className={cn(size, "ring-2 ring-card")} />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            size,
            "flex items-center justify-center rounded-full bg-secondary text-xs font-medium ring-2 ring-card",
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
