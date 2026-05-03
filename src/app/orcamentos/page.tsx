import { getOrcamentos } from "@/app/actions/orcamentos";
import { getClientes } from "@/app/actions/clientes";
import { getServicos } from "@/app/actions/servicos";
import { getEmpresa } from "@/app/actions/empresa";
import { OrcamentosList } from "./OrcamentosList";

export default async function OrcamentosPage() {
  const [orcamentos, clientes, servicos, empresa] = await Promise.all([
    getOrcamentos(),
    getClientes(),
    getServicos(),
    getEmpresa(),
  ]);

  return (
    <OrcamentosList
      initialOrcamentos={orcamentos as any}
      clientes={clientes}
      servicos={servicos as any}
      empresa={empresa}
    />
  );
}
