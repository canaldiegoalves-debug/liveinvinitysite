import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[WEBHOOK CAKTO] Recebido:", JSON.stringify(body, null, 2));

    // Suporta tanto payloads planos (raiz) quanto payloads aninhados no formato Cakto ({ event, data: { ... } })
    const data = body.data || body;
    const customer = data.customer || body.customer || {};
    const email = (customer.email || data.email || body.email || "").trim().toLowerCase();
    
    // Status do evento (paid, approved, completed, purchase.approved, etc.)
    const statusRaw = (data.status || body.status || body.event || body.event_type || "").toLowerCase();
    const isApproved = 
      statusRaw.includes("paid") || 
      statusRaw.includes("approved") || 
      statusRaw.includes("completed") || 
      statusRaw === "purchase.approved";

    if (!email) {
      console.warn("[WEBHOOK CAKTO] E-mail não encontrado no payload.");
      return NextResponse.json({ received: true, warning: "E-mail não informado" }, { status: 200 });
    }

    // Identificação de ofertas e planos da Cakto
    const offerId = (data.offer?.id || data.offer_id || body.offer_id || data.plan_id || "").toLowerCase();
    const offerName = (data.offer?.name || data.plan_name || data.product?.name || "").toLowerCase();
    
    let planType = "starter"; // Padrão
    let maxKeys = 1;

    if (offerId.includes("mdz39dg") || offerName.includes("infinity") || offerName.includes("vip") || offerName.includes("147")) {
      planType = "infinity_vip";
      maxKeys = 999999; // Chaves Infinitas
    } else if (offerId.includes("3477jz3") || offerName.includes("pro") || offerName.includes("97")) {
      planType = "pro";
      maxKeys = 2;
    } else if (offerId.includes("xd4yj7y") || offerName.includes("starter") || offerName.includes("67")) {
      planType = "starter";
      maxKeys = 1;
    }

    const method = data.payment_method || body.payment_method || "card";

    if (isApproved) {
      // 1. Busca ou cria o usuário automaticamente
      let user = await prisma.user.findUnique({
        where: { email },
        include: { empresa: true }
      });

      if (!user) {
        console.log(`[WEBHOOK CAKTO] Criando novo usuário para ${email}`);
        user = await prisma.user.create({
          data: {
            email,
            nome: customer.name || email.split("@")[0],
            role: "user"
          },
          include: { empresa: true }
        });
      }

      // 2. Busca ou cria a empresa vinculada
      let empresaId = user.empresa?.id;
      const novaExpiracao = new Date();
      novaExpiracao.setDate(novaExpiracao.getDate() + 30); // 30 dias de acesso renováveis

      if (empresaId) {
        await prisma.empresa.update({
          where: { id: empresaId },
          data: {
            plano: planType,
            planoStatus: "active",
            planoExpiresAt: novaExpiracao,
            metodoPagamento: method,
            lastPaymentAt: new Date()
          }
        });
      } else {
        const novaEmpresa = await prisma.empresa.create({
          data: {
            userId: user.id,
            nome: `Empresa de ${user.nome || email}`,
            email: email,
            plano: planType,
            planoStatus: "active",
            planoExpiresAt: novaExpiracao,
            metodoPagamento: method,
            lastPaymentAt: new Date()
          }
        });
        
        // Atualiza a referência da empresa no usuário
        await prisma.user.update({
          where: { id: user.id },
          data: { empresaId: novaEmpresa.id }
        });
      }

      console.log(`✅ [WEBHOOK CAKTO SUCESSO] Plano ${planType} (${maxKeys} chaves) ativado com sucesso para ${email}!`);
    } else {
      console.log(`ℹ️ [WEBHOOK CAKTO] Evento recebido sem aprovação de pagamento (status: ${statusRaw})`);
    }

    return NextResponse.json({ received: true, status: "processed" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [WEBHOOK CAKTO ERROR]", error);
    return NextResponse.json({ error: "Erro interno no servidor ao processar webhook", details: error.message }, { status: 500 });
  }
}
