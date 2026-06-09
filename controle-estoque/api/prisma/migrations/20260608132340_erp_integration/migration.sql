-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fornecedores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financeiro_lancamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "data_vencimento" DATETIME NOT NULL,
    "data_pagamento" DATETIME,
    "motivo" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "financeiro_lancamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_empresa_id_key" ON "fornecedores"("cnpj", "empresa_id");
