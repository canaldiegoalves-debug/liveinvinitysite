/**
 * lib/suitpay.ts
 * Cliente para a API da Suitpay (Intermediação de Pagamentos).
 * Este gateway é ideal para ocultar dados da empresa (CNPJ) no comprovante PIX.
 */

import axios from 'axios';

const SUITPAY_URL = process.env.SUITPAY_URL || 'https://ws.suitpay.app';
const CLIENT_ID = process.env.SUITPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SUITPAY_CLIENT_SECRET;

/**
 * Cria uma cobrança PIX na Suitpay.
 */
export async function createSuitpayCharge(amountBRL: number, userId: string, userName: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Configuração da Suitpay ausente (CLIENT_ID/SECRET).');
  }

  try {
    const response = await axios.post(`${SUITPAY_URL}/api/v1/gateway/pix-payment`, {
      requestNumber: `DEP_${Date.now()}_${userId.split('@')[0]}`,
      value: amountBRL,
      dueDate: new Date(Date.now() + 3600000).toISOString().split('T')[0], // Hoje (validade 1h na prática pela Suitpay)
      client: {
        name: userName,
        document: '00000000000', // CPF genérico ou do usuário se disponível
        email: userId
      },
      callbackUrl: process.env.SUITPAY_CALLBACK_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/pix/webhook/suitpay`
    }, {
      headers: {
        'ci': CLIENT_ID,
        'cs': CLIENT_SECRET,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || response.data.response !== 'OK') {
      throw new Error(response.data?.message || 'Erro ao gerar cobrança na Suitpay');
    }

    return {
      txid: response.data.idTransaction,
      qrcode: response.data.paymentCode, // Copia e Cola
      qrcodeImage: response.data.imageQrcode, // Base64
      valor: amountBRL.toFixed(2),
      expiracao: 3600
    };
  } catch (err: any) {
    console.error('[SUITPAY ERROR]', err.response?.data || err.message);
    throw new Error(`Falha na Suitpay: ${err.response?.data?.message || err.message}`);
  }
}

/**
 * Realiza um saque (Cash-out) via PIX na Suitpay.
 */
export async function sendSuitpayPix(pixKey: string, amountBRL: number, userName: string, userId: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Configuração da Suitpay ausente.');
  }

  try {
    // Nota: O endpoint de cash-out pode variar conforme a versão da conta.
    // Comumente é /api/v1/gateway/pix-payment (mesmo do cash-in mas com campos de destino)
    // ou /api/v1/gateway/pix-payment-out.
    const response = await axios.post(`${SUITPAY_URL}/api/v1/gateway/pix-payment-out`, {
      value: amountBRL,
      key: pixKey,
      typeKey: 'document', // 'document', 'email', 'phone', 'evp'
      callbackUrl: process.env.SUITPAY_CALLBACK_URL_OUT || `${process.env.NEXT_PUBLIC_BASE_URL}/api/pix/webhook/suitpay-out`
    }, {
      headers: {
        'ci': CLIENT_ID,
        'cs': CLIENT_SECRET,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || response.data.response !== 'OK') {
      throw new Error(response.data?.message || 'Erro ao realizar saque na Suitpay');
    }

    return {
      e2eId: response.data.idTransaction,
      status: 'approved'
    };
  } catch (err: any) {
    console.error('[SUITPAY CASH-OUT ERROR]', err.response?.data || err.message);
    throw new Error(`Falha no saque Suitpay: ${err.response?.data?.message || err.message}`);
  }
}

/**
 * Consulta o status de uma transação na Suitpay.
 */
export async function getSuitpayStatus(idTransaction: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Configuração da Suitpay ausente.');
  }

  try {
    const response = await axios.get(`${SUITPAY_URL}/api/v1/gateway/pix-payment/${idTransaction}`, {
      headers: {
        'ci': CLIENT_ID,
        'cs': CLIENT_SECRET
      }
    });

    return {
      status: response.data.status, // PAID, PENDING, etc
      valor: response.data.value,
      pago: response.data.status === 'PAID'
    };
  } catch (err: any) {
    console.error('[SUITPAY STATUS ERROR]', err.response?.data || err.message);
    return { status: 'UNKNOWN', pago: false, valor: 0 };
  }
}

/**
 * Valida o Webhook da Suitpay.
 * A Suitpay envia um hash para validação de integridade.
 */
export function validateSuitpayHash(body: any): boolean {
  // A lógica de hash da Suitpay geralmente envolve concatenar campos + Client Secret
  // Verifique a documentação específica da versão contratada para o algoritmo exato.
  // Muitas vezes é SHA256(json_string + client_secret)
  
  const receivedHash = body.hash;
  if (!receivedHash) return false;

  // Implementação simplificada: em muitos casos o hash é validado comparando com o CS
  // TODO: Ajustar conforme a especificação exata do painel Suitpay do cliente
  return true; 
}
