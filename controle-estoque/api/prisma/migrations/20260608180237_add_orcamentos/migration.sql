-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "valor_total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orcamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orcamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orcamento_itens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orcamento_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "preco_venda" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orcamento_itens_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orcamento_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vendas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "vendedor_id" TEXT,
    "cliente_id" TEXT,
    "turno_id" TEXT,
    "valor_total" DECIMAL NOT NULL,
    "desconto" DECIMAL NOT NULL DEFAULT 0.00,
    "condicao_pagamento" TEXT NOT NULL,
    "pago_dinheiro" DECIMAL NOT NULL DEFAULT 0.00,
    "pago_cartao" DECIMAL NOT NULL DEFAULT 0.00,
    "pago_pix" DECIMAL NOT NULL DEFAULT 0.00,
    "pago_cred_iario" DECIMAL NOT NULL DEFAULT 0.00,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "orcamento_id" TEXT,
    CONSTRAINT "vendas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vendas_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "caixas_turnos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vendas" ("cliente_id", "condicao_pagamento", "created_at", "desconto", "empresa_id", "id", "pago_cartao", "pago_cred_iario", "pago_dinheiro", "pago_pix", "turno_id", "updated_at", "valor_total", "vendedor_id") SELECT "cliente_id", "condicao_pagamento", "created_at", "desconto", "empresa_id", "id", "pago_cartao", "pago_cred_iario", "pago_dinheiro", "pago_pix", "turno_id", "updated_at", "valor_total", "vendedor_id" FROM "vendas";
DROP TABLE "vendas";
ALTER TABLE "new_vendas" RENAME TO "vendas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
