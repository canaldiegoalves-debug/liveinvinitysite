/**
 * lib/efibank.ts
 * Cliente HTTP para a API PIX da EFÍ Bank (MODO REAL).
 */

import https from 'https';
import axios, { AxiosInstance } from 'axios';

const SANDBOX = process.env.EFI_SANDBOX === 'true';
const BASE_URL = SANDBOX ? 'https://pix-h.api.efipay.com.br' : 'https://pix.api.efipay.com.br';

let cachedToken: { value: string; expiresAt: number } | null = null;

// ─── Agente HTTPS com Certificado mTLS ───────────────────────────────────────
function createAgent(certBase64: string) {
  try {
    const pfx = Buffer.from(certBase64, 'base64');
    // Em alguns casos o certificado da Efí exige o Client ID como senha
    // Mas por padrão tentamos sem senha primeiro.
    return new https.Agent({ 
      pfx, 
      passphrase: '',
      // Importante: Algumas versões do Node/Axios podem precisar disso para mTLS
      rejectUnauthorized: false 
    });
  } catch (err) {
    throw new Error('ERRO: O certificado EFI_CERTIFICATE_BASE64 parece estar em formato inválido ou corrompido.');
  }
}

// ─── Obter Token OAuth2 ──────────────────────────────────────────────────────
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30000) return cachedToken.value;

  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[EFI ERROR] Credenciais ausentes:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret,
      env: process.env.NODE_ENV
    });
    throw new Error('⚠️ EFI_CLIENT_ID ou EFI_CLIENT_SECRET não definidos. Verifique as variáveis de ambiente na Vercel (Settings -> Environment Variables).');
  }


  const certBase64 = process.env.EFI_CERTIFICATE_BASE64 || '';
  if (!certBase64) {
    throw new Error('ERRO: EFI_CERTIFICATE_BASE64 não encontrada nas variáveis da Vercel.');
  }

  const auth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
  const agent = createAgent(certBase64);
  console.log('[EFI DEBUG] Tentando autenticar...', { 
    url: `${BASE_URL}/oauth/token`, 
    sandbox: SANDBOX,
    certSize: certBase64.length 
  });

  try {
    const response = await axios.post(`${BASE_URL}/oauth/token`, { grant_type: 'client_credentials' }, {
      headers: { 
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json' 
      },
      httpsAgent: agent
    });

    cachedToken = {
      value: response.data.access_token,
      expiresAt: now + response.data.expires_in * 1000
    };
    return cachedToken.value;
  } catch (err: any) {
    console.error('[EFI AUTH ERROR]', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      baseUrl: BASE_URL,
      sandbox: SANDBOX
    });
    
    if (err.response?.status === 401) {
      throw new Error(`Erro de Autenticação na Efí (401): ${JSON.stringify(err.response.data)}. Verifique se o Client_ID/Secret e o Certificado correspondem ao ambiente (${SANDBOX ? 'SANDBOX' : 'PRODUÇÃO'}).`);
    }
    throw new Error(`Falha ao obter token da Efí: ${err.message}`);
  }
}

// ─── Cliente Axios Autenticado ───────────────────────────────────────────────
async function getClient(): Promise<AxiosInstance> {
  const token = await getAccessToken();
  const certBase64 = process.env.EFI_CERTIFICATE_BASE64 || '';
  const agent = createAgent(certBase64);
  return axios.create({
    baseURL: BASE_URL,
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    httpsAgent: agent
  });
}

// ─── Criar Cobrança PIX ──────────────────────────────────────────────────────
export async function createPixCharge(amountBRL: number, userId: string, userName: string) {
  const client = await getClient();
  const pixKey = process.env.EFI_PIX_KEY;

  if (!pixKey) throw new Error('ERRO: EFI_PIX_KEY (sua chave PIX) não configurada na Vercel.');

  const cobRes = await client.post('/v2/cob', {
    calendario: { expiracao: 3600 },
    valor: { original: amountBRL.toFixed(2) },
    chave: pixKey,
    solicitacaoPagador: `Helix Bet - Depósito ${userName}`,
    infoAdicionais: [{ nome: 'ID Usuario', valor: userId }]
  });

  const txid = cobRes.data.txid;
  const locId = cobRes.data.loc.id;
  const qrRes = await client.get(`/v2/loc/${locId}/qrcode`);

  return {
    txid,
    qrcode: qrRes.data.qrcode,
    qrcodeImage: qrRes.data.imagemQrcode,
    valor: amountBRL.toFixed(2),
    expiracao: 3600
  };
}

// ─── Verificar Status ────────────────────────────────────────────────────────
export async function getChargeStatus(txid: string) {
  const client = await getClient();
  const res = await client.get(`/v2/cob/${txid}`);
  return {
    status: res.data.status, // ATIVA, CONCLUIDA, etc
    valor: res.data.valor.original,
    pago: res.data.status === 'CONCLUIDA'
  };
}

export async function sendPix(pixKey: string, amountBRL: number, userName: string, userId: string) {
  const client = await getClient();
  const myPixKey = process.env.EFI_PIX_KEY;
  
  if (!myPixKey) throw new Error('EFI_PIX_KEY não configurada.');

  // idEnvio é um ID único nosso para a requisição
  const idEnvio = `SAQUE${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const res = await client.put(`/v2/gn/pix/${idEnvio}`, {
    valor: amountBRL.toFixed(2),
    pagador: {
      chave: myPixKey
    },
    favorecido: {
      chave: pixKey
    }
  });

  return {
    e2eId: res.data.e2eId,
    status: res.data.status
  };
}

// ─── Configurar Webhook ──────────────────────────────────────────────────────
export async function setupWebhook(webhookUrl: string) {
  const client = await getClient();
  const pixKey = process.env.EFI_PIX_KEY;

  if (!pixKey) throw new Error('EFI_PIX_KEY não configurada.');

  console.log(`[EFI DEBUG] Registrando webhook para a chave ${pixKey} na URL: ${webhookUrl}`);

  try {
    const res = await client.put(`/v2/webhook/${pixKey}`, {
      webhookUrl: webhookUrl
    });
    return res.data;
  } catch (err: any) {
    console.error('[EFI WEBHOOK REG ERROR]', err.response?.data || err.message);
    throw new Error(`Falha ao registrar webhook: ${JSON.stringify(err.response?.data || err.message)}`);
  }
}

export function validatePixKey(key: string): boolean {
  const k = key.trim();
  return k.length >= 11; // Validação básica
}
