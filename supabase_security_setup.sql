-- VALORA SAAS: SEGURANÇA MÁXIMA (RLS HARDENED)
-- Este script configura o Row Level Security para suportar múltiplos usuários (Equipe)
-- e garantir que ninguém acesse dados de outra empresa.

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Servico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orcamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agendamento" ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para a tabela Empresa
-- Um usuário só vê a empresa se ele for o dono ou se ele for um funcionário vinculado (empresaId coincide)
CREATE POLICY "Users can see their company" ON "Empresa"
  FOR SELECT USING (
    id IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "Only owners can update company" ON "Empresa"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- 3. Políticas para a tabela User
-- Um usuário só vê a si mesmo e seus colegas de equipe
CREATE POLICY "Users can see themselves and teammates" ON "User"
  FOR SELECT USING (
    id = auth.uid()::text OR 
    "empresaId" IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text)
  );

-- 4. Política Universal para tabelas vinculadas (Cliente, Material, Servico, Orcamento)
-- O usuário deve ter o mesmo empresaId que o registro
CREATE POLICY "Access by company ID - Cliente" ON "Cliente"
  FOR ALL USING ("empresaId" IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text));

CREATE POLICY "Access by company ID - Material" ON "Material"
  FOR ALL USING ("empresaId" IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text));

CREATE POLICY "Access by company ID - Servico" ON "Servico"
  FOR ALL USING ("empresaId" IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text));

CREATE POLICY "Access by company ID - Orcamento" ON "Orcamento"
  FOR ALL USING ("empresaId" IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text));

-- 5. Agendamentos (Vinculados via Orçamento)
CREATE POLICY "Access by company ID - Agendamento" ON "Agendamento"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Orcamento"
      WHERE "Orcamento".id = "Agendamento"."orcamentoId"
      AND "Orcamento"."empresaId" IN (SELECT "empresaId" FROM "User" WHERE id = auth.uid()::text)
    )
  );

-- 6. Proteção Extra: Impedir deleção acidental de usuários sem ser Admin
-- (Configurado via Admin Actions no código, mas o RLS ajuda)
