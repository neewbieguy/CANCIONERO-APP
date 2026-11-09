import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PushSettings } from "@/components/settings/push-settings";
import { ProfileForm, SignOutButton, ThemePicker } from "@/components/settings/profile-settings";
import { pushEnabled } from "@/lib/push";
import { requireTeamContext } from "@/lib/session";

export const metadata = { title: "Ajustes" };

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function AjustesPage() {
  const ctx = await requireTeamContext();
  const { user } = ctx;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ajustes" />
      <div className="space-y-4">
        <Card title="Perfil">
          <ProfileForm user={{ id: user.id, name: user.name, email: user.email, image: user.image }} />
        </Card>

        <Card title="Notificaciones" description="Se activan por dispositivo: hacelo en cada celular o compu donde uses Cancionero.">
          <PushSettings publicKey={pushEnabled ? (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null) : null} />
        </Card>

        <Card title="Apariencia">
          <ThemePicker />
        </Card>

        <Card title="Equipo">
          <Link href="/equipo" className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{ctx.team.name}</span>
              <span className="block text-xs text-muted-foreground">
                {ctx.isAdmin ? "Sos admin · miembros, permisos e invitaciones" : "Miembros e invitaciones"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Card>

        <div className="flex justify-end pt-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
