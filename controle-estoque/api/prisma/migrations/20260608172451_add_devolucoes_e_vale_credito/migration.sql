-- CreateTable
CREATE TABLE "devolucoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "valor_total" DECIMAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacao" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "devolucoes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "devolucoes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "devolucao_itens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "devolucao_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "preco_custo" DECIMAL NOT NULL,
    "preco_venda" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "devolucao_itens_devolucao_id_fkey" FOREIGN KEY ("devolucao_id") REFERENCES "devolucoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "devolucao_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vales_credito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "devolucao_id" TEXT,
    "codigo_unico" TEXT NOT NULL,
    "valor_inicial" DECIMAL NOT NULL,
    "valor_atual" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vales_credito_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vales_credito_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vales_credito_devolucao_id_fkey" FOREIGN KEY ("devolucao_id") REFERENCES "devolucoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "vales_credito_devolucao_id_key" ON "vales_credito"("devolucao_id");

-- CreateIndex
CREATE UNIQUE INDEX "vales_credito_codigo_unico_key" ON "vales_credito"("codigo_unico");
