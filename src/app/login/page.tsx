"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../cadastro/auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      router.push("/");
      router.refresh();
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
          <h1>Bem-vindo de volta</h1>
          <p>Acesse sua conta para gerenciar seus orçamentos.</p>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <button onClick={handleGoogleLogin} className={styles.googleBtn}>
          <img src="https://www.google.com/favicon.ico" alt="Google" width={18} />
          Entrar com Google
        </button>

        <div className={styles.divider}>
          <span>ou use seu e-mail</span>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><Mail size={16} /> E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className={styles.inputGroup}>
            <label><Lock size={16} /> Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha secreta" />
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? "Acessando..." : "Entrar no Painel"} <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Ainda não tem conta? <Link href="/cadastro">Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
