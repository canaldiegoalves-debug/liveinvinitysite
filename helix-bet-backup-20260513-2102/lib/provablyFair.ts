import crypto from 'crypto';

/**
 * Sistema Provably Fair para o Helix Bet
 * Gera resultados determinísticos baseados em sementes do servidor e do cliente.
 */
export class ProvablyFair {
  
  /**
   * Gera um hash HMAC-SHA256 combinando as sementes e o nonce.
   */
  static generateHash(serverSeed: string, clientSeed: string, nonce: number, index: number = 0): string {
    const combined = `${serverSeed}:${clientSeed}:${nonce}:${index}`;
    return crypto.createHmac('sha256', serverSeed).update(combined).digest('hex');
  }

  /**
   * Converte o hash em um número flutuante entre 0 e 1 (similar ao Math.random())
   * mas de forma determinística.
   */
  static generateResult(hash: string, index: number = 0): number {
    // Pegamos 8 caracteres do hash começando pelo index para gerar um número
    const part = hash.substring(index * 8, (index + 1) * 8);
    const intValue = parseInt(part, 16);
    return intValue / 0xffffffff;
  }

  /**
   * Gera uma semente aleatória para o servidor (Hexadecimal)
   */
  static generateRandomSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Retorna o hash público (SHA-256) da semente do servidor.
   * Este é o valor que o jogador vê ANTES de jogar.
   */
  static getPublicHash(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }
}
