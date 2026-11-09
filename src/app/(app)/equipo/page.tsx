import { Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Equipo" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Equipo" />
      <EmptyState icon={Users} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
