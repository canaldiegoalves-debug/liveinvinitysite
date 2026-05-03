import { createClient } from "@/lib/supabase-server";
import LandingPage from "./landing/page";
import DashboardContent from "./DashboardContent";
import { getEmpresa } from "@/app/actions/empresa";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const empresa = await getEmpresa();

  if (!empresa?.nicho) {
    redirect("/onboarding");
  }

  return <DashboardContent empresa={empresa} />;
}
