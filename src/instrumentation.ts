/**
 * Next.js corre esto una vez al arrancar el servidor.
 * Los servidores de Vercel usan la hora UTC: fijamos la zona horaria del equipo para que
 * fechas y horarios se muestren bien (cambiala con la variable APP_TIMEZONE si hace falta).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = process.env.APP_TIMEZONE || "America/Argentina/Buenos_Aires";
  }
}
