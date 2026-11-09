import { Music2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Canciones" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Canciones" />
      <EmptyState icon={Music2} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
