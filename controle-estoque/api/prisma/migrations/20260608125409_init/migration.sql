-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome_fantasia" TEXT NOT NULL,
    "razao_social" TEXT,
    "cnpj" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operador',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "nome" TEXT NOT NULL,
    "preco_custo" DECIMAL NOT NULL DEFAULT 0.00,
    "preco_venda" DECIMAL NOT NULL DEFAULT 0.00,
    "lucro_percentual" DECIMAL NOT NULL DEFAULT 0.00,
    "estoque_atual" DECIMAL NOT NULL DEFAULT 0.000,
    "estoque_minimo" DECIMAL DEFAULT 0.000,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "produtos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT,
    "chave_acesso" TEXT,
    "emitente_nome" TEXT,
    "emitente_cnpj" TEXT,
    "valor_total" DECIMAL NOT NULL DEFAULT 0.00,
    "data_emissao" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notas_fiscais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nota_fiscal_itens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota_fiscal_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "preco_custo" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nota_fiscal_itens_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nota_fiscal_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_empresa_id_key" ON "usuarios"("email", "empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_barras_empresa_id_key" ON "produtos"("codigo_barras", "empresa_id");
