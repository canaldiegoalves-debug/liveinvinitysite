import { Prisma } from "@prisma/client";

export class PrecificacaoService {
  /**
   * Calcula o preço de venda baseado no custo e percentual de lucro (Markup).
   * Fórmula: Venda = Custo * (1 + Lucro% / 100)
   */
  static calcularPrecoVenda(precoCusto: number, lucroPercentual: number): number {
    if (precoCusto < 0) return 0;
    const lucro = Math.max(0, lucroPercentual);
    const precoVenda = precoCusto * (1 + lucro / 100);
    return parseFloat(precoVenda.toFixed(2));
  }

  /**
   * Calcula o percentual de lucro obtido a partir do preço de custo e de venda.
   * Fórmula: Lucro% = ((Venda - Custo) / Custo) * 100
   */
  static calcularLucroPercentual(precoCusto: number, precoVenda: number): number {
    if (precoCusto <= 0 || precoVenda < precoCusto) return 0;
    const lucro = ((precoVenda - precoCusto) / precoCusto) * 100;
    return parseFloat(lucro.toFixed(2));
  }
}
