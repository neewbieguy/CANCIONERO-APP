import { WifiOff } from "lucide-react";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">Estás sin conexión</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Las canciones y setlists que abriste antes siguen disponibles. Cuando vuelva la conexión, todo se
        sincroniza solo.
      </p>
    </main>
  );
}
