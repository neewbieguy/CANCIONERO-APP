import "server-only";
import { db } from "@/lib/db";

/** Mensajes no leídos por canal (excluye los propios). */
export async function getUnreadByChannel(userId: string, teamId: string) {
  const channels = await db.channel.findMany({
    where: { teamId },
    select: { id: true, readStates: { where: { userId }, select: { lastReadAt: true } } },
  });
  const counts = await Promise.all(
    channels.map(async (c) => {
      const since = c.readStates[0]?.lastReadAt;
      const unread = await db.message.count({
        where: { channelId: c.id, userId: { not: userId }, ...(since ? { createdAt: { gt: since } } : {}) },
      });
      return [c.id, unread] as const;
    }),
  );
  return new Map(counts);
}

export async function getUnreadTotal(userId: string, teamId: string) {
  const map = await getUnreadByChannel(userId, teamId);
  let total = 0;
  map.forEach((n) => (total += n));
  return total;
}
