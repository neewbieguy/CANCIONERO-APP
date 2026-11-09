import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createTransport } from "nodemailer";
import { db } from "@/lib/db";

export const DEMO_EMAIL = "demo@cancionero.app";

export const authFlags = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  demo: process.env.ENABLE_DEMO_LOGIN === "true",
  smtp: Boolean(process.env.EMAIL_SERVER),
};

function magicLinkEmail(url: string) {
  return {
    subject: "Tu link para entrar a Cancionero",
    text: `Entrá a Cancionero con este link:\n${url}\n\nSi no lo pediste, ignorá este correo.`,
    html: `<div style="font-family:system-ui,sans-serif;background:#0f1012;color:#f4f4f5;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px">Cancionero</h1>
      <p>Hacé clic para entrar:</p>
      <p><a href="${url}" style="display:inline-block;background:#1b6ef3;color:#fff;padding:12px 20px;border-radius:14px;text-decoration:none">Entrar a Cancionero</a></p>
      <p style="color:#a1a1aa;font-size:12px">Si no lo pediste, ignorá este correo.</p></div>`,
  };
}

const providers: NextAuthOptions["providers"] = [
  EmailProvider({
    // Si no hay SMTP configurado, el link se imprime en la consola del servidor.
    server: process.env.EMAIL_SERVER || { jsonTransport: true },
    from: process.env.EMAIL_FROM ?? "Cancionero <no-reply@cancionero.app>",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest({ identifier, url, provider }) {
      if (!authFlags.smtp) {
        console.log(`\n🔗 Link mágico para ${identifier}:\n${url}\n`);
        return;
      }
      const transport = createTransport(provider.server);
      await transport.sendMail({ to: identifier, from: provider.from, ...magicLinkEmail(url) });
    },
  }),
];

if (authFlags.google) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (authFlags.demo) {
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Demo",
      credentials: {},
      async authorize() {
        const user = await db.user.upsert({
          where: { email: DEMO_EMAIL },
          update: {},
          create: { email: DEMO_EMAIL, name: "Usuario Demo", emailVerified: new Date() },
        });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  // JWT es necesario para combinar Credentials (demo) con los otros proveedores.
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login", verifyRequest: "/login?verify=1", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);
