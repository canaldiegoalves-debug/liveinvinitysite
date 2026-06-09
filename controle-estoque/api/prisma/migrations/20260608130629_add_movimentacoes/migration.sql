-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "tipo" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimentacoes_estoque_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimentacoes_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimentacoes_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
