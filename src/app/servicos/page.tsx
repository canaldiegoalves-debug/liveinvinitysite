import { getServicos } from "@/app/actions/servicos";
import { getMateriais } from "@/app/actions/materiais";
import { getEmpresa } from "@/app/actions/empresa";
import { ServicosList } from "./ServicosList";

export default async function ServicosPage() {
  const [servicos, materiais, empresa] = await Promise.all([
    getServicos(),
    getMateriais(),
    getEmpresa(),
  ]);

  return (
    <ServicosList
      initialServicos={servicos as any}
      materiais={materiais}
      empresa={empresa}
    />
  );
}
