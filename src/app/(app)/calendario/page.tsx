import { CalendarDays } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Calendario" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Calendario" />
      <EmptyState icon={CalendarDays} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
