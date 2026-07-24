import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[WEBHOOK CAKTO] Payload Recebido:", JSON.stringify(body, null, 2));

    // Suporta tanto payloads na raiz quanto payloads aninhados no formato Cakto ({ event, data: { ... } })
    const data = body.data || body;
    const customer = data.customer || body.customer || {};
    const email = (customer.email || data.email || body.email || "").trim().toLowerCase();

    // Eventos e Status da Cakto (subscription_created, purchase_approved, paid, approved, completed)
    const eventRaw = String(body.event || body.event_type || data.event || "").toLowerCase();
    const statusRaw = String(data.status || body.status || "").toLowerCase();
    
    const isApproved = 
      statusRaw.includes("paid") || 
      statusRaw.includes("approved") || 
      statusRaw.includes("completed") || 
      eventRaw.includes("purchase_approved") ||
      eventRaw.includes("subscription_created") ||
      eventRaw.includes("approved") ||
      eventRaw.includes("paid");

    if (!email) {
      console.warn("[WEBHOOK CAKTO] E-mail não informado no payload.");
      return NextResponse.json({ received: true, warning: "E-mail não informado" }, { status: 200 });
    }

    // Identificação inteligente de ofertas e valores
    const offerId = String(data.offer?.id || data.offer_id || body.offer_id || data.plan_id || data.product?.id || data.product_id || "").toLowerCase();
    const offerName = String(data.offer?.name || data.plan_name || data.plan?.name || data.product?.name || "").toLowerCase();
    const amountVal = Number(data.amount || data.price || body.amount || body.price || 0);

    // Mapeia o plano. Se não identificar pelo ID/Nome/Valor, assume 'pro' por padrão para NUNCA ignorar o cliente!
    let planType = "pro";
    let maxKeys = 2;

    if (offerId.includes("mdz39dg") || offerName.includes("infinity") || offerName.includes("vip") || offerName.includes("147") || amountVal >= 140) {
      planType = "infinity_vip";
      maxKeys = 999999; // Chaves Infinitas
    } else if (offerId.includes("xd4yj7y") || offerName.includes("starter") || offerName.includes("67") || (amountVal > 0 && amountVal <= 70)) {
      planType = "starter";
      maxKeys = 1;
    } else if (offerId.includes("3477jz3") || offerName.includes("pro") || offerName.includes("97") || (amountVal > 70 && amountVal < 140)) {
      planType = "pro";
      maxKeys = 2;
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
      novaExpiracao.setDate(novaExpiracao.getDate() + 30); // 30 dias de acesso

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
        
        await prisma.user.update({
          where: { id: user.id },
          data: { empresaId: novaEmpresa.id }
        });
      }

      const chaveGerada = `LIVEINF-${planType.toUpperCase()}-${user.id.substring(0, 5).toUpperCase()}-${user.id.substring(5, 10).toUpperCase()}`;

      console.log(`=================================================`);
      console.log(`✅ [WEBHOOK CAKTO ATIVADO] E-mail: ${email}`);
      console.log(`🔑 Plano: ${planType} (${maxKeys} chaves) | Chave: ${chaveGerada}`);
      console.log(`=================================================`);
    } else {
      console.log(`ℹ️ [WEBHOOK CAKTO] Evento não financeiro (evento: ${eventRaw}, status: ${statusRaw})`);
    }

    return NextResponse.json({ received: true, status: "processed" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [WEBHOOK CAKTO ERROR]", error);
    return NextResponse.json({ error: "Erro interno no servidor ao processar webhook", details: error.message }, { status: 500 });
  }
}
