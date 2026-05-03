import { getAgendamentos } from "@/app/actions/orcamentos";
import { AgendaList } from "./AgendaList";

export default async function AgendaPage() {
  const agendamentos = await getAgendamentos();
  return <AgendaList initialAgendamentos={agendamentos as any} />;
}
