import { getEmpresa } from "@/app/actions/empresa";
import { ConfigForm } from "./ConfigForm";

export default async function ConfiguracoesPage() {
  const empresa = await getEmpresa();
  return <ConfigForm empresa={empresa} />;
}
