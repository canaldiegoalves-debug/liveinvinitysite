import { getClientes } from "@/app/actions/clientes";
import { ClientesList } from "./ClientesList";

export default async function ClientesPage() {
  const data = await getClientes();
  
  // Calcula o total gasto de cada cliente somando seus orçamentos
  const clientes = data.map(c => ({
    ...c,
    totalGasto: c.orcamentos.reduce((acc, o) => acc + o.valorFinal, 0)
  }));

  return <ClientesList initialClientes={clientes} />;
}
