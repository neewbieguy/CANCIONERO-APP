import "server-only";
import { EventEmitter } from "node:events";

/**
 * Bus de eventos en memoria para Server-Sent Events.
 * Funciona con una sola instancia del servidor. Para varias instancias,
 * reemplazar publish/subscribe por Pusher, Supabase Realtime o Redis pub/sub.
 */
export type RealtimeEvent =
  | { type: "notification" }
  | { type: "refresh"; scope: string };

const g = globalThis as unknown as { __cancioneroBus?: EventEmitter };
const bus = g.__cancioneroBus ?? new EventEmitter();
bus.setMaxListeners(0);
g.__cancioneroBus = bus;

export const topics = {
  team: (teamId: string) => `team:${teamId}`,
  user: (userId: string) => `user:${userId}`,
};

export function publish(topic: string, event: RealtimeEvent) {
  bus.emit(topic, event);
}

export function subscribe(topic: string, fn: (event: RealtimeEvent) => void) {
  bus.on(topic, fn);
  return () => {
    bus.off(topic, fn);
  };
}
