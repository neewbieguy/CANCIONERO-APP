# Cancionero

PWA para equipos de alabanza y bandas: eventos semanales, setlists, hojas de acordes con transposición, Modo Atril y notificaciones. UI en español.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma + Postgres (Neon) · NextAuth · Serwist (PWA) · Web Push · Vitest. Publicada en Vercel.

## Correr en local

Requisitos: Node 20 o superior (probado con Node 26).

```bash
npm install
cp .env.example .env          # completá DATABASE_URL(_UNPOOLED) con la rama "dev" de Neon y NEXTAUTH_SECRET
npx prisma migrate dev        # crea las tablas y corre el seed (datos de ejemplo)
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

## Notificaciones push

- Generá las claves con `npx web-push generate-vapid-keys` y ponelas en `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`.
- Cada persona las activa por dispositivo en **Ajustes → Notificaciones**. Solo funcionan con la versión de producción (`npm run build && npm start`, o publicada) porque necesitan el service worker. En iPhone/iPad hay que instalar la app primero.

## Actualizaciones entre miembros

No hay conexión permanente (para que funcione en Vercel): la app refresca los datos cada 30 segundos mientras está abierta y cada vez que volvés a ella.

## Publicar en Vercel + Neon

1. En [vercel.com](https://vercel.com) entrá con GitHub e importá este repositorio.
2. En el proyecto: **Storage → Create Database → Neon** (región São Paulo). Eso agrega `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
3. En **Settings → Environment Variables** cargá: `NEXTAUTH_URL` (la URL de Vercel), `NEXTAUTH_SECRET`, `EMAIL_SERVER`, `EMAIL_FROM`, `ENABLE_DEMO_LOGIN=false` y las claves VAPID.
4. **Deploy.** Cada build corre `prisma migrate deploy` (ver `vercel.json`), así que las tablas se crean solas. No se corre el seed: la base empieza vacía.

La zona horaria de las fechas se fija en `src/instrumentation.ts` (por defecto Argentina, configurable con `APP_TIMEZONE`).

## Estructura

```
prisma/              schema, migraciones y seed
public/icons/        íconos de la PWA
scripts/             generación de íconos
src/app/(auth)/      login
src/app/(app)/       app autenticada (sidebar + header): inicio, eventos, canciones, …
src/app/api/         NextAuth
src/components/      ui (shadcn), layout, dashboard, events, team, pwa, …
src/lib/             auth, db, sesión, permisos, notificaciones, calendario, música (ChordPro/transposición)
src/server/          server actions y queries
tests/unit/          tests de Vitest
```

## Estado

- [x] Etapa 1: layout, auth, dashboard y PWA base
- [x] Etapa 2: equipos e invitaciones
- [x] Etapa 3: eventos y setlists
- [x] Etapa 4: canciones
- [x] Etapa 5: calendario, push y ajustes
- [ ] Publicación en Vercel + Neon
