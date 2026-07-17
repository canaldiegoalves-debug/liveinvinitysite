import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function GET(req: NextRequest) {
  const results: any = {
    env: {
      EFI_CLIENT_ID: !!process.env.EFI_CLIENT_ID,
      EFI_CLIENT_SECRET: !!process.env.EFI_CLIENT_SECRET,
      EFI_PIX_KEY: !!process.env.EFI_PIX_KEY,
      EFI_CERTIFICATE_BASE64: !!process.env.EFI_CERTIFICATE_BASE64,
      EFI_SANDBOX: process.env.EFI_SANDBOX,
    },
    connectionTest: null,
    error: null
  };

  try {
    const certBase64 = process.env.EFI_CERTIFICATE_BASE64;
    if (!certBase64) throw new Error('Certificado ausente');

    const pfx = Buffer.from(certBase64, 'base64');
    const agent = new https.Agent({ pfx, passphrase: '' });

    const auth = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64');
    const baseUrl = process.env.EFI_SANDBOX === 'true' ? 'https://pix-h.api.efipay.com.br' : 'https://pix.api.efipay.com.br';

    const res = await axios.post(`${baseUrl}/oauth/token`, { grant_type: 'client_credentials' }, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      httpsAgent: agent,
      timeout: 10000
    });

    results.connectionTest = 'SUCCESS';
    results.tokenType = res.data.token_type;
  } catch (err: any) {
    results.connectionTest = 'FAILED';
    results.error = err.response?.data || err.message;
    results.axiosError = err.code;
  }

  return NextResponse.json(results);
}
