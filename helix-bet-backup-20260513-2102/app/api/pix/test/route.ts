import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/efibank';

export async function GET() {
  try {
    console.log('--- TESTANDO CONEXÃO EFÍ ---');
    const token = await getAccessToken();
    return NextResponse.json({ success: true, token: token.substring(0, 10) + '...' });
  } catch (err: any) {
    console.error('[TEST ERROR]', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      details: err.response?.data || 'Sem detalhes da resposta'
    }, { status: 500 });
  }
}

// Exportando getAccessToken para o teste (precisamos exportar no efibank.ts primeiro)
