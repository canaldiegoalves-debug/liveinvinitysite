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

    if (status === "paid" || status === "approved" || status === "completed") {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { empresa: true }
      });

      if (user && user.empresa) {
        // Calcula nova data de expiração (Hoje + 30 dias)
        const novaExpiracao = new Date();
        novaExpiracao.setDate(novaExpiracao.getDate() + 30);

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
