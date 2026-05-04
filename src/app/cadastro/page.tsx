"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./auth.module.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Verifique seu e-mail para confirmar o cadastro!" });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>V</div>
          <h1>Crie sua conta no VALORA</h1>
          <p>Transforme sua gestão em minutos.</p>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <button onClick={handleGoogleLogin} className={styles.googleBtn}>
          <img src="https://www.google.com/favicon.ico" alt="Google" width={18} />
          Cadastrar com Google
        </button>

        <div className={styles.divider}>
          <span>ou use seu e-mail</span>
        </div>

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><User size={16} /> Nome Completo</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamado?" />
          </div>
          <div className={styles.inputGroup}>
            <label><Mail size={16} /> E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className={styles.inputGroup}>
            <label><Lock size={16} /> Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? "Criando conta..." : "Cadastrar Gratuitamente"} <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
