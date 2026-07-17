import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[WEBHOOK CAKTO] Recebido:", body);

    // Mapeamento básico da Cakto (ajustar conforme documentação exata)
    const email = body.customer?.email || body.email;
    const status = body.status; // 'paid', 'approved', 'completed'
    const planType = body.plan_id?.includes("pro") ? "pro" : "premium";
    const method = body.payment_method || "card";

    // Mapeamento de expiração inteligente: Anual vs Mensal
    const isAnual = 
      body.plan_id?.toLowerCase().includes("anual") || 
      body.plan_id?.toLowerCase().includes("year") || 
      body.plan_id?.toLowerCase().includes("yearly") || 
      body.plan_name?.toLowerCase().includes("anual") || 
      body.plan_name?.toLowerCase().includes("year") || 
      body.plan?.name?.toLowerCase().includes("anual") || 
      body.plan?.name?.toLowerCase().includes("year") || 
      (body.amount && Number(body.amount) > 150) || 
      (body.price && Number(body.price) > 150);

    if (status === "paid" || status === "approved" || status === "completed") {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { empresa: true }
      });

      if (user && user.empresa) {
        // Calcula nova data de expiração (Hoje + 365 dias se for anual, +30 dias se for mensal)
        const novaExpiracao = new Date();
        if (isAnual) {
          novaExpiracao.setDate(novaExpiracao.getDate() + 365);
        } else {
          novaExpiracao.setDate(novaExpiracao.getDate() + 30);
        }

        await prisma.empresa.update({
          where: { id: user.empresa.id },
          data: {
            plano: planType,
            planoStatus: "active",
            planoExpiresAt: novaExpiracao,
            metodoPagamento: method,
            lastPaymentAt: new Date()
          }
        });

        console.log(`✅ [WEBHOOK] Plano ${planType} ativado para ${email} até ${novaExpiracao.toLocaleDateString()}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ [WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
