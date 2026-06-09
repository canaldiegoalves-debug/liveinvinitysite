/*
  Warnings:

  - You are about to drop the column `saldo_devedor` on the `clientes` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "vendedor_id" TEXT,
    "cliente_id" TEXT,
    "valor_total" DECIMAL NOT NULL,
    "desconto" DECIMAL NOT NULL DEFAULT 0.00,
    "condicao_pagamento" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vendas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vendas_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comissoes_vendas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "venda_id" TEXT NOT NULL,
    "valor_venda" DECIMAL NOT NULL,
    "valor_comissao" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "data_competencia" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comissoes_vendas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comissoes_vendas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comissoes_vendas_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf_cnpj" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "saldo_de_vedor" DECIMAL NOT NULL DEFAULT 0.00,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_clientes" ("cpf_cnpj", "created_at", "empresa_id", "endereco", "id", "nome", "telefone", "updated_at") SELECT "cpf_cnpj", "created_at", "empresa_id", "endereco", "id", "nome", "telefone", "updated_at" FROM "clientes";
DROP TABLE "clientes";
ALTER TABLE "new_clientes" RENAME TO "clientes";
CREATE UNIQUE INDEX "clientes_cpf_cnpj_empresa_id_key" ON "clientes"("cpf_cnpj", "empresa_id");
CREATE TABLE "new_contas_receber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "venda_id" TEXT,
    "valor" DECIMAL NOT NULL,
    "data_vencimento" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "valor_pago" DECIMAL NOT NULL DEFAULT 0.00,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contas_receber_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contas_receber_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contas_receber_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_contas_receber" ("cliente_id", "created_at", "data_vencimento", "empresa_id", "id", "status", "updated_at", "valor", "valor_pago", "venda_id") SELECT "cliente_id", "created_at", "data_vencimento", "empresa_id", "id", "status", "updated_at", "valor", "valor_pago", "venda_id" FROM "contas_receber";
DROP TABLE "contas_receber";
ALTER TABLE "new_contas_receber" RENAME TO "contas_receber";
CREATE TABLE "new_usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operador',
    "percentual_comissao" DECIMAL NOT NULL DEFAULT 0.00,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_usuarios" ("created_at", "email", "empresa_id", "id", "nome", "role", "senha_hash", "updated_at") SELECT "created_at", "email", "empresa_id", "id", "nome", "role", "senha_hash", "updated_at" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_email_empresa_id_key" ON "usuarios"("email", "empresa_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
