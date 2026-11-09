import { BarChart3 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Estadísticas" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Estadísticas" />
      <EmptyState icon={BarChart3} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
