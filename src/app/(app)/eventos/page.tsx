import { Ticket } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Eventos" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Eventos" />
      <EmptyState icon={Ticket} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
