import { getMateriais } from "@/app/actions/materiais";
import { getEmpresa } from "@/app/actions/empresa";
import { MateriaisList } from "./MateriaisList";

export default async function MateriaisPage() {
  const [materiais, empresa] = await Promise.all([
    getMateriais(),
    getEmpresa(),
  ]);

  return <MateriaisList initialMateriais={materiais} empresa={empresa} />;
}
