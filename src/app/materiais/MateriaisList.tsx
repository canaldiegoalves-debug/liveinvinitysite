"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import styles from "@/components/layout/list.module.css";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { createMaterial, updateMaterial, deleteMaterial } from "@/app/actions/materiais";
import { getNichoById } from "@/lib/nichos";

type Material = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  valorPago: number;
  qtdEstoque: number;
  custoUnitario: number;
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function MateriaisList({ 
  initialMateriais,
  empresa 
}: { 
  initialMateriais: Material[];
  empresa: { nicho: string };
}) {
  const nichoConfig = getNichoById(empresa.nicho);
  const labelMaterial = nichoConfig?.labelMaterial || "Material";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidade, setUnidade] = useState(nichoConfig?.unidadesPrincipais[0] || "unidade");
  const [valorPago, setValorPago] = useState("");
  const [qtdEstoque, setQtdEstoque] = useState("");

  const custoUnitarioPreview =
    valorPago && qtdEstoque && parseFloat(qtdEstoque) > 0
      ? parseFloat(valorPago.replace(",", ".")) / parseFloat(qtdEstoque.replace(",", "."))
      : 0;

  const openCreate = () => {
    setEditingItem(null);
    setNome(""); 
    setCategoria(nichoConfig?.categoriasMateriais[0] || ""); 
    setUnidade(nichoConfig?.unidadesPrincipais[0] || "unidade"); 
    setValorPago(""); 
    setQtdEstoque("");
    setIsModalOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditingItem(m);
    setNome(m.nome); setCategoria(m.categoria); setUnidade(m.unidade);
    setValorPago(m.valorPago.toString()); setQtdEstoque(m.qtdEstoque.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = {
        nome, categoria, unidade,
        valorPago: parseFloat(valorPago.replace(",", ".")),
        qtdEstoque: parseFloat(qtdEstoque.replace(",", ".")),
      };
      if (editingItem) {
        await updateMaterial(editingItem.id, data);
      } else {
        await createMaterial(data);
      }
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const filtrados = initialMateriais.filter(
    (m) => m.nome.toLowerCase().includes(busca.toLowerCase()) || m.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{labelMaterial}s</h1>
          <p className={styles.subtitle}>Gerencie {labelMaterial.toLowerCase()}s, estoque e custo unitário automático</p>
        </div>
        <button className={`premium-button ${styles.primaryBtn}`} onClick={openCreate}>
          <Plus size={18} /> Novo {labelMaterial}
        </button>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.filters}>
          <input type="text" placeholder={`Buscar ${labelMaterial.toLowerCase()} ou categoria...`} className={styles.searchInput} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Unidade</th>
              <th>Valor Pago</th>
              <th>Em Estoque</th>
              <th>Custo Unitário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  <Package size={32} style={{ marginBottom: "0.5rem", opacity: 0.4 }} />
                  <br />Nenhum {labelMaterial.toLowerCase()} cadastrado.
                </td>
              </tr>
            ) : (
              filtrados.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.nome}</td>
                  <td>
                    <span className={styles.categoryTag}>{m.categoria}</span>
                  </td>
                  <td>{m.unidade}</td>
                  <td>{fmt(m.valorPago)}</td>
                  <td>
                    {m.qtdEstoque} {m.unidade}
                  </td>
                  <td style={{ color: "var(--primary)", fontWeight: 600 }}>
                    {fmt(m.custoUnitario)}/{m.unidade}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Edit2 size={16} className={styles.actionIcon} onClick={() => openEdit(m)} />
                      <Trash2 size={16} className={`${styles.actionIcon} ${styles.actionDelete}`} onClick={() => deleteMaterial(m.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Editar ${labelMaterial}` : `Cadastrar ${labelMaterial}`}>
        <form onSubmit={handleSubmit}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nome do {labelMaterial} *</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className={formStyles.input} placeholder={`Ex: ${nichoConfig?.exemplosMateriais[0]?.nome || "Item A"}`} />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Categoria</label>
            <select className={formStyles.select} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Selecione ou digite...</option>
              {nichoConfig?.categoriasMateriais.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input 
              type="text" 
              value={categoria} 
              onChange={(e) => setCategoria(e.target.value)} 
              className={formStyles.input} 
              style={{ marginTop: "0.5rem" }}
              placeholder="Ou digite uma nova categoria..." 
            />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div className={formStyles.formGroup} style={{ flex: 1 }}>
              <label className={formStyles.label}>Unidade de Medida *</label>
              <select className={formStyles.select} value={unidade} onChange={(e) => setUnidade(e.target.value)}>
                {nichoConfig?.unidadesPrincipais.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="unidade">Unidade</option>
                <option value="litro">Litro (L)</option>
                <option value="ml">Mililitro (mL)</option>
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="folha">Folha</option>
                <option value="m²">Metro Quadrado (m²)</option>
              </select>
            </div>
            <div className={formStyles.formGroup} style={{ flex: 1 }}>
              <label className={formStyles.label}>Qtd em Estoque *</label>
              <input type="number" required step="0.001" min="0.001" value={qtdEstoque} onChange={(e) => setQtdEstoque(e.target.value)} className={formStyles.input} placeholder="Ex: 5" />
            </div>
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Valor Total Pago (R$) *</label>
            <input type="number" required step="0.01" value={valorPago} onChange={(e) => setValorPago(e.target.value)} className={formStyles.input} placeholder="Ex: 150.00" />
          </div>

          {custoUnitarioPreview > 0 && (
            <div style={{ padding: "0.75rem 1rem", background: "rgba(107, 70, 193, 0.08)", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--primary)", fontWeight: 600 }}>
              Custo unitário calculado: {fmt(custoUnitarioPreview)} / {unidade}
            </div>
          )}

          <div className={formStyles.actions}>
            <button type="button" className={formStyles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={isLoading} className="premium-button">
              {isLoading ? "Salvando..." : editingItem ? "Salvar Alterações" : `Cadastrar ${labelMaterial}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
