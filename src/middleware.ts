import { withAuth } from "next-auth/middleware";

export default withAuth({ pages: { signIn: "/login" } });

export const config = {
  // Todo requiere sesión excepto login, auth, invitaciones, PWA y archivos estáticos.
  matcher: [
    "/((?!login|invitacion|api/auth|_next|icons|manifest.webmanifest|sw.js|swe-worker|workbox-|~offline|favicon.ico|robots.txt).*)",
  ],
};
