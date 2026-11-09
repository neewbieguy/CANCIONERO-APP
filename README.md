# Cancionero

PWA para equipos de alabanza y bandas: eventos semanales, setlists, hojas de acordes con transposición, Modo Atril y notificaciones. UI en español.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma + SQLite · NextAuth · Server-Sent Events · Serwist (PWA) · Vitest

## Correr en local

Requisitos: Node 20 o superior (probado con Node 26).

```bash
npm install
cp .env.example .env          # y completá NEXTAUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev        # crea prisma/cancionero.db y corre el seed
npm run dev                   # http://localhost:3000
```

Entrá con **"Entrar como demo"** (usuario `demo@cancionero.app`, con datos de ejemplo cargados).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build && npm start` | Build y servidor de producción (necesario para probar la PWA) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run typecheck` / `npm run lint` | Chequeo de tipos y lint |
| `npm run db:seed` | Vuelve a cargar los datos de ejemplo (borra todo) |
| `npm run db:reset` | Resetea la base y corre migraciones + seed |
| `npm run icons` | Regenera los íconos PNG desde `public/icons/icon.svg` |

## Autenticación

- **Link mágico por email:** si `EMAIL_SERVER` está vacío, el link se imprime en la consola del servidor (ideal en desarrollo). En producción configurá un SMTP, por ejemplo `smtp://usuario:clave@smtp.proveedor.com:587`.
- **Google:** completá `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. URI de redirección: `http://localhost:3000/api/auth/callback/google`. Sin esas variables, el botón no aparece.
- **Demo:** `ENABLE_DEMO_LOGIN="true"`. **Ponelo en `false` en producción.**

Un usuario nuevo recibe automáticamente su propio equipo, del que es admin.

## PWA

- Manifest en `src/app/manifest.ts` y service worker en `src/app/sw.ts` (Serwist).
- El service worker **solo se genera con `npm run build`**: en `npm run dev` está desactivado.
- Las canciones y eventos que abriste quedan en caché y se pueden ver sin conexión. Si no hay red, se muestra `/~offline`.
- Cuando hay una versión nueva aparece un aviso "Nueva versión disponible".
- Para instalarla desde el celular en la red local hace falta HTTPS (por ejemplo `npx next dev --experimental-https`, o un túnel como ngrok o Cloudflare Tunnel).

## Notificaciones push y recordatorios

- Generá las claves con `npx web-push generate-vapid-keys` y ponelas en `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`.
- Cada persona las activa por dispositivo en **Ajustes → Notificaciones**. Solo funcionan con la versión de producción (`npm run build && npm start`) porque necesitan el service worker. En iPhone/iPad hay que instalar la app primero.
- **Recordatorios:** el día anterior a cada evento, los participantes reciben "Mañana: …". Con una sola instancia del servidor (local, Railway) se revisa solo cada 30 minutos (`src/instrumentation.ts`). En Vercel, configurá un Vercel Cron que llame a `/api/cron/recordatorios` (usa `CRON_SECRET`).

## Tiempo real

`/api/stream` abre un stream SSE por pestaña, usado por las notificaciones y para refrescar la pantalla cuando alguien del equipo cambia algo. El bus de eventos (`src/lib/realtime.ts`) vive en memoria, así que funciona con **una sola instancia** del servidor. Para escalar a varias instancias, reemplazá `publish`/`subscribe` por Pusher, Supabase Realtime o Redis.

## Migrar a Postgres

1. En `prisma/schema.prisma` cambiá `provider = "sqlite"` por `"postgresql"`.
2. Poné `DATABASE_URL="postgresql://..."`.
3. Borrá `prisma/migrations` y corré `npx prisma migrate dev --name init`.

Los "enums" se guardan como `String`, con los valores válidos en `src/lib/constants.ts`, así que no hace falta cambiar nada más.

## Estructura

```
prisma/              schema, migraciones y seed
public/icons/        íconos de la PWA
scripts/             generación de íconos
src/app/(auth)/      login
src/app/(app)/       app autenticada (sidebar + header): inicio, eventos, canciones, …
src/app/api/         NextAuth y stream SSE
src/components/      ui (shadcn), layout, dashboard, events, team, pwa, …
src/lib/             auth, db, sesión, permisos, realtime, notificaciones, música (ChordPro/transposición)
src/server/          server actions y queries
tests/unit/          tests de Vitest
```

## Estado

- [x] Etapa 1: layout, auth, dashboard y PWA base
- [x] Etapa 2: equipos e invitaciones
- [x] Etapa 3: eventos y setlists
- [x] Etapa 4: canciones
- [x] Etapa 5: calendario, push, recordatorios y ajustes
