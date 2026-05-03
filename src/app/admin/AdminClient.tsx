"use client";

import { useState } from "react";
import { Edit2, Trash2, Shield, User, Star, Map, Briefcase, X, Save } from "lucide-react";
import styles from "./admin.module.css";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { updateUserDetails, deleteUserAdmin } from "@/app/actions/admin";
import { NICHOS } from "@/lib/nichos";

type UserData = {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  createdAt: Date;
  empresa: {
    nome: string;
    nicho: string;
    plano: string;
    _count: {
      clientes: number;
      orcamentos: number;
    }
  } | null;
};

export function AdminClient({ initialUsers, currentUserId }: { initialUsers: UserData[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Edit states
  const [editRole, setEditRole] = useState("");
  const [editPlano, setEditPlano] = useState("");
  const [editNicho, setEditNicho] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editEmpresaNome, setEditEmpresaNome] = useState("");

  const openEdit = (u: UserData) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditPlano(u.empresa?.plano || "free");
    setEditNicho(u.empresa?.nicho || "");
    setEditNome(u.nome || "");
    setEditEmpresaNome(u.empresa?.nome || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      await updateUserDetails(selectedUser.id, {
        role: editRole,
        nome: editNome,
        empresa: {
          plano: editPlano,
          nicho: editNicho,
          nome: editEmpresaNome,
        }
      });
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? {
        ...u,
        role: editRole,
        nome: editNome,
        empresa: u.empresa ? { ...u.empresa, plano: editPlano, nicho: editNicho, nome: editEmpresaNome } : null
      } : u));
      setIsEditOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUserId) return alert("Você não pode deletar a si mesmo!");
    if (!confirm("TEM CERTEZA? Isso apagará permanentemente o usuário e todos os seus dados!")) return;
    
    setIsLoading(true);
    try {
      await deleteUserAdmin(id);
      setUsers(users.filter(u => u.id !== id));
    } finally {
      setIsLoading(false);
    }
  };

  const usersToNotify = users.filter(u => {
    if (u.empresa?.metodoPagamento !== "pix" || !u.empresa?.planoExpiresAt) return false;
    const exp = new Date(u.empresa.planoExpiresAt);
    const hoje = new Date();
    const diff = exp.getTime() - hoje.getTime();
    const faltam24h = diff > 0 && diff <= (24 * 60 * 60 * 1000);
    return faltam24h;
  });

  const sendReminder = (u: UserData) => {
    const tel = u.empresa?.telefone?.replace(/\D/g, "");
    if (!tel) return alert("Empresa sem telefone cadastrado.");
    const msg = encodeURIComponent(
      `Olá ${u.nome || "amigo"}! 👋\n\nNotamos que sua assinatura *VALORA* (Plano ${u.empresa?.plano.toUpperCase()}) vence em menos de 24 horas.\n\nPara não perder o acesso às suas ferramentas de precificação e orçamentos, você pode renovar agora pelo link abaixo:\n\n${u.empresa?.plano === "pro" ? "https://pay.cakto.com.br/ngh5cw4_867592" : "https://pay.cakto.com.br/hy29b5b_867594"}\n\nQualquer dúvida, conte conosco! 🚀`
    );
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
  };

  return (
    <>
      {usersToNotify.length > 0 && (
        <div className={styles.alertBox}>
          <div className={styles.alertHeader}>
            <Shield size={18} />
            <h3>Atenção: {usersToNotify.length} cobranças PIX vencendo em 24h</h3>
          </div>
          <div className={styles.alertList}>
            {usersToNotify.map(u => (
              <div key={u.id} className={styles.alertItem}>
                <span>{u.nome} ({u.email})</span>
                <button onClick={() => sendReminder(u)} className={styles.whatsappBtn}>
                  Enviar Lembrete via WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuário / Empresa</th>
              <th>Nicho</th>
              <th>Acesso</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className={styles.userMain}>
                    <div className={styles.avatar}>{(u.nome?.[0] || u.email[0]).toUpperCase()}</div>
                    <div>
                      <div className={styles.userName}>{u.nome || "Sem nome"}</div>
                      <div className={styles.userEmail}>{u.email}</div>
                      <div className={styles.empName}>{u.empresa?.nome || "Sem empresa"}</div>
                    </div>
                  </div>
                </td>
                <td><span className={styles.nichoTag}>{u.empresa?.nicho || "---"}</span></td>
                <td>
                  <span className={`${styles.roleBadge} ${styles["role" + u.role]}`}>
                    {u.role === "admin" ? <Star size={12} /> : u.role === "moderator" ? <Shield size={12} /> : <User size={12} />}
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`${styles.planoBadge} ${styles["plano" + (u.empresa?.plano || "free")]}`}>
                    {u.empresa?.plano.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className={styles.userStats}>
                    <span>{u.empresa?._count.clientes || 0} CLI</span>
                    <span>{u.empresa?._count.orcamentos || 0} ORC</span>
                  </div>
                </td>
                <td>
                  <div className={styles.adminActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(u)} title="Editar Usuário"><Edit2 size={16} /></button>
                    <button className={styles.delBtn} onClick={() => handleDelete(u.id)} title="Excluir Usuário"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Gestão de Usuário: ${selectedUser?.email}`}>
        <form onSubmit={handleUpdate} className={styles.adminForm}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nome Completo</label>
            <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)} className={formStyles.input} />
          </div>

          <div className={styles.formRow}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Nível de Acesso</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className={formStyles.select}>
                <option value="user">USUÁRIO PADRÃO</option>
                <option value="moderator">MODERADOR (SUPORTE)</option>
                <option value="admin">ADMINISTRADOR TOTAL</option>
              </select>
            </div>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Plano da Assinatura</label>
              <select value={editPlano} onChange={e => setEditPlano(e.target.value)} className={formStyles.select}>
                <option value="free">GRATUITO</option>
                <option value="premium">PREMIUM (PDF LIBERADO)</option>
                <option value="pro">PROFISSIONAL (TURBO)</option>
              </select>
            </div>
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nome da Empresa</label>
            <input type="text" value={editEmpresaNome} onChange={e => setEditEmpresaNome(e.target.value)} className={formStyles.input} />
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nicho de Atuação</label>
            <select value={editNicho} onChange={e => setEditNicho(e.target.value)} className={formStyles.select}>
              <option value="">NÃO DEFINIDO</option>
              {NICHOS.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
            </select>
          </div>

          <div className={formStyles.actions}>
            <button type="button" className={formStyles.cancelBtn} onClick={() => setIsEditOpen(false)}>Cancelar</button>
            <button type="submit" disabled={isLoading} className="premium-button">
              {isLoading ? "Salvando..." : <><Save size={18} /> Salvar Alterações</>}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
