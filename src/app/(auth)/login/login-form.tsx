"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function LoginForm({
  callbackUrl,
  google,
  demo,
  error,
}: {
  callbackUrl: string;
  google: boolean;
  demo: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "demo" | null>(null);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Entrar a Cancionero</h1>
        <p className="text-sm text-muted-foreground">Te mandamos un link mágico, sin contraseñas.</p>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading("email");
          await signIn("email", { email, callbackUrl });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vos@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading !== null}>
          {loading === "email" ? <Loader2 className="animate-spin" /> : <Mail />}
          Enviar link de acceso
        </Button>
      </form>

      {(google || demo) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" /> o <Separator className="flex-1" />
        </div>
      )}

      <div className="space-y-2">
        {google && (
          <Button
            variant="outline"
            className="w-full"
            disabled={loading !== null}
            onClick={() => {
              setLoading("google");
              void signIn("google", { callbackUrl });
            }}
          >
            {loading === "google" ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            Continuar con Google
          </Button>
        )}
        {demo && (
          <Button
            variant="secondary"
            className="w-full"
            disabled={loading !== null}
            onClick={() => {
              setLoading("demo");
              void signIn("demo", { callbackUrl });
            }}
          >
            {loading === "demo" ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Entrar como demo
          </Button>
        )}
      </div>
    </div>
  );
}
