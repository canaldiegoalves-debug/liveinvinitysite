import { NextRequest, NextResponse } from 'next/server';
import { sendSuitpayPix } from '@/lib/suitpay';
import { validatePixKey } from '@/lib/efibank'; // Mantendo a validação básica por enquanto

const MIN_WITHDRAW = 20;
const MAX_WITHDRAW = 5000;

export async function POST(req: NextRequest) {
  try {
    const { pixKey, amount, userId, userName, currentBalance } = await req.json();

    if (!pixKey || !validatePixKey(pixKey)) {
      return NextResponse.json({ error: 'Chave PIX inválida. Verifique o formato.' }, { status: 400 });
    }
    if (!amount || amount < MIN_WITHDRAW) {
      return NextResponse.json({ error: `Valor mínimo de saque é R$ ${MIN_WITHDRAW},00` }, { status: 400 });
    }
    if (amount > MAX_WITHDRAW) {
      return NextResponse.json({ error: `Valor máximo de saque é R$ ${MAX_WITHDRAW},00` }, { status: 400 });
    }
    if (amount > currentBalance) {
      return NextResponse.json({ error: 'Saldo insuficiente para este saque' }, { status: 400 });
    }
    if (!userId || !userName) {
      return NextResponse.json({ error: 'Usuário não identificado' }, { status: 400 });
    }

    const result = await sendSuitpayPix(pixKey, Number(amount), userName, userId);

    return NextResponse.json({
      success: true,
      e2eId:   result.e2eId,
      status:  result.status,
      amount:  Number(amount),
    });
  } catch (err: unknown) {
    console.error('[PIX WITHDRAW]', err);
    const msg = err instanceof Error ? err.message : 'Erro ao processar saque';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
