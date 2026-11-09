/**
 * Next.js corre esto una vez al arrancar el servidor.
 * Cada 30 minutos le pide al propio servidor que mande los recordatorios pendientes
 * (sirve con una sola instancia, como en local o Railway). En Vercel se usa Vercel Cron.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const secret = process.env.CRON_SECRET;
  const g = globalThis as unknown as { __cancioneroReminders?: ReturnType<typeof setInterval> };
  if (!secret || g.__cancioneroReminders || process.env.DISABLE_REMINDER_SCHEDULER === "true") return;

  const base = process.env.NEXTAUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  const run = () =>
    fetch(new URL("/api/cron/recordatorios", base), { headers: { authorization: `Bearer ${secret}` } }).catch(() => {
      /* el servidor todavía está arrancando: se reintenta en la próxima vuelta */
    });
  g.__cancioneroReminders = setInterval(run, 30 * 60 * 1000);
  setTimeout(run, 20_000);
}
