"use client";

import { useState } from "react";

export default function AtivarLiveInfinity() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setKey(null);

    try {
      const res = await fetch("https://api.valoranegocios.com.br/api/public/claim-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setKey(data.key);
      } else {
        setError(data.error || "Não encontramos uma compra ativa para este e-mail.");
      }
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      color: "#f0f2f5",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        background: "rgba(18, 20, 29, 0.8)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 215, 0, 0.2)",
        borderRadius: "20px",
        padding: "40px 30px",
        textAlign: "center",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
      }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>
          🚀 <span style={{ background: "linear-gradient(135deg, #e50914, #ffcc00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LIVE INFINITY</span>
        </h1>
        <span style={{ background: "rgba(229, 9, 20, 0.15)", color: "#ff5252", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>
          Gerador de Chave Oficial
        </span>
        <p style={{ color: "#9aa0a6", fontSize: "14px", marginTop: "16px", marginBottom: "30px", lineHeight: "1.5" }}>
          Digite o mesmo e-mail preenchido no checkout da Cakto para visualizar sua chave de acesso.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#d1d5db", display: "block", marginBottom: "8px" }}>
            E-mail de Compra (Cakto)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu-email@gmail.com"
            required
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "#fff",
              fontSize: "15px",
              outline: "none",
              marginBottom: "20px"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #e50914, #ff4b2b)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "700",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer"
            }}
          >
            {loading ? "⏳ Buscando compra..." : "⚡ Gerar / Ver Minha Chave"}
          </button>
        </form>

        {error && (
          <div style={{ background: "rgba(229, 9, 20, 0.15)", border: "1px solid #e50914", color: "#ff5252", fontSize: "13px", padding: "14px", borderRadius: "10px", marginTop: "20px" }}>
            {error}
          </div>
        )}

        {key && (
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0, 230, 118, 0.3)", borderRadius: "16px", padding: "24px", marginTop: "24px" }}>
            <div style={{ color: "#00e676", fontSize: "13px", fontWeight: "700" }}>✅ CHAVE ENCONTRADA COM SUCESSO!</div>
            <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "800", color: "#ffcc00", background: "#000", border: "1px dashed #ffcc00", padding: "14px", borderRadius: "10px", margin: "16px 0", wordBreak: "break-all" }}>
              {key}
            </div>
            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                background: "#00e676",
                color: "#000",
                fontWeight: "800",
                fontSize: "14px",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              {copied ? "✅ Chave Copiada com Sucesso!" : "📋 Copiar Chave de Acesso"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
