import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import xml2js from "xml2js";
import { PrecificacaoService } from "./PrecificacaoService";
import { EstoqueService } from "./EstoqueService";

interface ItemNotaParsed {
  codigoBarras: string | null;
  nome: string;
  quantidade: number;
  precoCusto: number;
  ncm?: string | null;
  csosn?: string | null;
}

interface NfDataParsed {
  numero: string;
  serie: string;
  chaveAcesso: string;
  emitenteNome: string;
  emitenteCnpj: string;
  valorTotal: number;
  dataEmissao: Date | null;
  itens: ItemNotaParsed[];
}

export class NotaFiscalService {
  /**
   * Lê o arquivo XML da NF-e e realiza o parse dos dados da nota e de seus itens.
   */
  static async parseXml(xmlBuffer: Buffer): Promise<NfDataParsed> {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
    const result = await parser.parseStringPromise(xmlBuffer.toString("utf-8"));

    // Estrutura padrão de NF-e 4.0
    const nfe = result.nfeProc?.NFe || result.NFe;
    if (!nfe) {
      throw new Error("Arquivo XML não reconhecido como uma Nota Fiscal Eletrônica (NF-e) válida.");
    }

    const infNFe = nfe.infNFe;
    const ide = infNFe.ide;
    const emit = infNFe.emit;
    
    // Obter chave de acesso do atributo Id da tag infNFe
    let chaveAcesso = "";
    if (infNFe.$ && infNFe.$.Id) {
      chaveAcesso = infNFe.$.Id.replace("NFe", "");
    }

    // Processar itens da nota (podem vir como único objeto ou array)
    const detList = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
    const itens: ItemNotaParsed[] = detList.map((item: any) => {
      const prod = item.prod;
      const ean = prod.cEAN && prod.cEAN !== "SEM GTIN" ? String(prod.cEAN).trim() : null;
      const ncm = prod.NCM ? String(prod.NCM).trim() : null;

      // Extrator de CSOSN / CST do ICMS de forma flexível e tolerante a falhas
      let csosn: string | null = null;
      if (item.imposto && item.imposto.ICMS) {
        const icms = item.imposto.ICMS;
        for (const key in icms) {
          if (icms[key] && typeof icms[key] === "object") {
            const subIcms = icms[key];
            if (subIcms.CSOSN) {
              csosn = String(subIcms.CSOSN).trim();
              break;
            }
            if (subIcms.CST) {
              csosn = String(subIcms.CST).trim();
              break;
            }
          }
        }
      }
      
      return {
        codigoBarras: ean,
        nome: String(prod.xProd).trim(),
        quantidade: parseFloat(prod.qCom),
        precoCusto: parseFloat(prod.vUnCom),
        ncm: ncm ? ncm.replace(/\D/g, "").slice(0, 8) : null,
        csosn: csosn ? csosn.replace(/\D/g, "").slice(0, 4) : null,
      };
    });

    return {
      numero: String(ide.nNF),
      serie: String(ide.serie),
      chaveAcesso,
      emitenteNome: String(emit.xNome).trim(),
      emitenteCnpj: String(emit.CNPJ || emit.CPF),
      valorTotal: parseFloat(infNFe.total.ICMSTot.vNF),
      dataEmissao: ide.dhEmi ? new Date(ide.dhEmi) : null,
      itens,
    };
  }

  /**
   * Processa a Nota Fiscal, gerencia fornecedor, cria despesa financeira e dá entrada física no estoque.
   */
  static async processarEntradaNota(empresaId: string, nfData: NfDataParsed, usuarioId?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar se a nota com este número e emitente já foi cadastrada para evitar duplicidade
      const nfExistente = await tx.notaFiscal.findFirst({
        where: { numero: nfData.numero, empresaId, emitenteCnpj: nfData.emitenteCnpj },
      });

      if (nfExistente) {
        throw new Error(`Esta Nota Fiscal (Nº ${nfData.numero}) já foi importada anteriormente.`);
      }

      // 2. INTEGRACAO ERP - Cadastrar/Buscar Fornecedor
      let fornecedor = null;
      if (nfData.emitenteCnpj) {
        fornecedor = await tx.fornecedor.findFirst({
          where: { cnpj: nfData.emitenteCnpj, empresaId },
        });

        if (!fornecedor && nfData.emitenteNome) {
          fornecedor = await tx.fornecedor.create({
            data: {
              empresaId,
              cnpj: nfData.emitenteCnpj,
              razaoSocial: nfData.emitenteNome,
            },
          });
        }
      }

      // 3. INTEGRACAO ERP - Lançamento Financeiro de DESPESA
      await tx.lancamentoFinanceiro.create({
        data: {
          empresaId,
          tipo: "DESPESA",
          valor: new Prisma.Decimal(nfData.valorTotal.toFixed(2)),
          status: "PAGO", // Notas importadas representam compras faturadas
          dataVencimento: nfData.dataEmissao || new Date(),
          dataPagamento: nfData.dataEmissao || new Date(),
          motivo: `Compra - NF-e nº ${nfData.numero} (${nfData.emitenteNome || "Fornecedor"})`,
        },
      });

      // 4. Cadastrar a Nota Fiscal
      const nf = await tx.notaFiscal.create({
        data: {
          empresaId,
          numero: nfData.numero,
          serie: nfData.serie,
          chaveAcesso: nfData.chaveAcesso,
          emitenteNome: nfData.emitenteNome,
          emitenteCnpj: nfData.emitenteCnpj,
          valorTotal: new Prisma.Decimal(nfData.valorTotal.toFixed(2)),
          dataEmissao: nfData.dataEmissao,
        },
      });

      // 5. Cadastrar ou atualizar cada produto no estoque
      for (const item of nfData.itens) {
        let produtoId = "";

        // Buscar produto existente por EAN
        let produto = item.codigoBarras 
          ? await tx.produto.findFirst({ where: { codigoBarras: item.codigoBarras, empresaId } })
          : null;

        if (produto) {
          // Produto já existe: atualiza preço de custo, venda, e informações fiscais (se presentes na NF)
          const novoCusto = item.precoCusto;
          const lucroHistorico = Number(produto.lucroPercentual);
          const novaVenda = PrecificacaoService.calcularPrecoVenda(novoCusto, lucroHistorico);

          await tx.produto.update({
            where: { id: produto.id },
            data: {
              precoCusto: new Prisma.Decimal(novoCusto.toFixed(2)),
              precoVenda: new Prisma.Decimal(novaVenda.toFixed(2)),
              ncm: item.ncm || produto.ncm,
              csosn: item.csosn || produto.csosn,
            },
          });
          produtoId = produto.id;
        } else {
          // Produto não existe: cadastra com margem inicial de 50%
          const lucroPadrao = 50.00;
          const precoVendaCalculado = PrecificacaoService.calcularPrecoVenda(item.precoCusto, lucroPadrao);
          const estoqueMinimoCalculado = Math.ceil(item.quantidade * 0.15);

          const novoProduto = await tx.produto.create({
            data: {
              empresaId,
              nome: item.nome,
              codigoBarras: item.codigoBarras,
              precoCusto: new Prisma.Decimal(item.precoCusto.toFixed(2)),
              precoVenda: new Prisma.Decimal(precoVendaCalculado.toFixed(2)),
              lucroPercentual: new Prisma.Decimal(lucroPadrao.toFixed(2)),
              estoqueAtual: new Prisma.Decimal("0.000"), // Inicializa em zero para a movimentação adicionar o valor correto
              estoqueMinimo: new Prisma.Decimal(estoqueMinimoCalculado.toFixed(3)),
              ncm: item.ncm || null,
              csosn: item.csosn || null,
            },
          });
          produtoId = novoProduto.id;
        }

        // Registrar movimentação de estoque
        await EstoqueService.registrarMovimentacao({
          empresaId,
          produtoId,
          usuarioId,
          tipo: "ENTRADA",
          quantidade: item.quantidade,
          motivo: `NF-e Entrada nº ${nfData.numero} (${nfData.emitenteNome})`,
        });

        // Salvar item da nota fiscal
        await tx.notaFiscalItem.create({
          data: {
            notaFiscalId: nf.id,
            produtoId: produtoId,
            quantidade: new Prisma.Decimal(item.quantidade.toFixed(3)),
            precoCusto: new Prisma.Decimal(item.precoCusto.toFixed(2)),
          },
        });
      }

      return nf;
    });
  }
}
