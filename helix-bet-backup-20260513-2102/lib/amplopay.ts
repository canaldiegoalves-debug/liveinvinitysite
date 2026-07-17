import axios from 'axios';

const AMPLOPAY_BASE_URL = 'https://app.amplopay.com/api/v1';

/**
 * Interface para criação de cobrança PIX (Cash-in)
 */
interface CreatePixRequest {
  amount: number;      // Valor em decimal (ex: 10.50)
  identifier: string;  // Seu ID único
  callbackUrl: string; // URL do Webhook
  client: {
    name: string;
    email: string;
    phone: string;     // Adicionado conforme documentação
    document: string;  // CPF ou CNPJ
  };
}

/**
 * Interface para criação de transferência PIX (Cash-out)
 */
interface CreateTransferRequest {
  amount: number;
  identifier: string;
  callbackUrl: string;
  pix: {
    type: 'cpf' | 'email' | 'phone' | 'evp';
    key: string;
  };
  owner: {
    name: string;
    document: {
      number: string;
      type: 'cpf' | 'cnpj';
    };
    ip: string;
  };
}

export class AmploPayClient {
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.publicKey = process.env.AMPLOPAY_PUBLIC_KEY || 'afiliadodiegoalves_w4vhyw91rjqhocsj';
    this.secretKey = process.env.AMPLOPAY_SECRET_KEY || 'r2px3zw5cxq1qr3agt0m757ef24u49ww31nua4w7fnqm37a7ocm4un7efov75gsq';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-public-key': this.publicKey.trim(),
      'x-secret-key': this.secretKey.trim(),
    };
  }

  /**
   * Gera uma cobrança PIX para depósito
   */
  async createPixCharge(data: CreatePixRequest) {
    try {
      const response = await axios.post(`${AMPLOPAY_BASE_URL}/gateway/pix/receive`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('AmploPay CreatePix Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Realiza uma transferência PIX para saque
   */
  async createTransfer(data: CreateTransferRequest) {
    try {
      const response = await axios.post(`${AMPLOPAY_BASE_URL}/gateway/transfers`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('AmploPay Transfer Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Consulta o status de uma transação
   */
  async getTransactionStatus(transactionId: string) {
    try {
      const response = await axios.get(`${AMPLOPAY_BASE_URL}/gateway/transactions/${transactionId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('AmploPay Status Error:', error.response?.data || error.message);
      throw error;
    }
  }
}
