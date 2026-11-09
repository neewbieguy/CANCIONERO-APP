import { Settings } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Ajustes" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Ajustes" />
      <EmptyState icon={Settings} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
