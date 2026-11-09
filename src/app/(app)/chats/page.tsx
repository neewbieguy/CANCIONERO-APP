import { MessageCircle } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Chats" };

// Pantalla provisoria: se implementa en su etapa correspondiente.
export default function Page() {
  return (
    <>
      <PageHeader title="Chats" />
      <EmptyState icon={MessageCircle} title="En construcción" description="Esta sección llega en la próxima etapa." />
    </>
  );
}
