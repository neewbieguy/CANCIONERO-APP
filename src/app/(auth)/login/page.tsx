import { redirect } from "next/navigation";
import { auth, authFlags } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "Ese email ya está registrado con otro método de acceso.",
  EmailSignin: "No pudimos enviar el email. Probá de nuevo.",
  Verification: "El link expiró o ya fue usado. Pedí uno nuevo.",
  default: "No pudimos iniciar sesión. Probá de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; verify?: string; error?: string };
}) {
  const session = await auth();
  const callbackUrl = safeCallback(searchParams.callbackUrl);
  if (session?.user) redirect(callbackUrl);

  const error = searchParams.error ? (ERRORS[searchParams.error] ?? ERRORS.default) : null;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />
      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="text-2xl" />
          <p className="text-sm text-muted-foreground">
            Eventos, setlists y acordes para tu equipo de alabanza o banda.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          {searchParams.verify ? (
            <div className="space-y-2 text-center">
              <h1 className="text-lg font-semibold">Revisá tu email</h1>
              <p className="text-sm text-muted-foreground">
                Te enviamos un link para entrar.
                {!authFlags.smtp && " (En desarrollo, el link aparece en la consola del servidor.)"}
              </p>
            </div>
          ) : (
            <LoginForm
              callbackUrl={callbackUrl}
              google={authFlags.google}
              demo={authFlags.demo}
              error={error}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function safeCallback(url?: string) {
  if (!url) return "/";
  try {
    const u = new URL(url, "http://x");
    return u.pathname.startsWith("/") && !u.pathname.startsWith("//") ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}
