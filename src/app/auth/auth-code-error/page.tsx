"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import styles from "../../cadastro/auth.module.css";

export default function AuthErrorPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ textAlign: "center" }}>
        <div style={{ color: "#ef4444", marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
          <AlertCircle size={64} />
        </div>
        <h1 className={styles.title}>Erro na Autenticação</h1>
        <p className={styles.subtitle} style={{ marginBottom: "2rem" }}>
          Não foi possível completar o login. Isso pode acontecer se o link expirou ou se houve um erro de comunicação com o Google/Supabase.
        </p>
        
        <Link href="/login" className={styles.submitBtn} style={{ textDecoration: "none" }}>
          Tentar novamente
        </Link>
        
        <p className={styles.footerText} style={{ marginTop: "1.5rem" }}>
          Dica: Tente usar o login por e-mail e senha caso o Google continue falhando.
        </p>
      </div>
    </div>
  );
}
