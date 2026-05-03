-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Servico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orcamento" ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para a tabela Empresa (Dono vê sua própria empresa)
CREATE POLICY "Users can only see their own company" ON "Empresa"
  FOR ALL USING (auth.uid()::text = "userId");

-- 3. Políticas para Clientes (Só vê clientes da sua empresa)
CREATE POLICY "Users can only see their company's clients" ON "Cliente"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Empresa" 
      WHERE "Empresa".id = "Cliente"."empresaId" 
      AND "Empresa"."userId" = auth.uid()::text
    )
  );

-- 4. Políticas para Materiais
CREATE POLICY "Users can only see their company's materials" ON "Material"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Empresa" 
      WHERE "Empresa".id = "Material"."empresaId" 
      AND "Empresa"."userId" = auth.uid()::text
    )
  );

-- 5. Políticas para Serviços
CREATE POLICY "Users can only see their company's services" ON "Servico"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Empresa" 
      WHERE "Empresa".id = "Servico"."empresaId" 
      AND "Empresa"."userId" = auth.uid()::text
    )
  );

-- 6. Políticas para Orçamentos
CREATE POLICY "Users can only see their company's quotes" ON "Orcamento"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Empresa" 
      WHERE "Empresa".id = "Orcamento"."empresaId" 
      AND "Empresa"."userId" = auth.uid()::text
    )
  );
