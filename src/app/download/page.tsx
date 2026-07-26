export default function DownloadPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      color: "#f0f2f5",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px 20px"
    }}>
      <div style={{ width: "100%", maxWidth: "820px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", background: "linear-gradient(135deg, #e50914, #ff4b2b, #ffcc00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px" }}>
          ⚡ CENTRAL DE DOWNLOADS
        </h1>
        <p style={{ color: "#9aa0a6", fontSize: "15px", marginBottom: "36px" }}>
          Baixe os pacotes oficiais das extensões Live Infinity e LiveCam para o seu navegador.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px" }}>
          {/* Live Infinity */}
          <div style={{ background: "rgba(18, 20, 29, 0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 204, 0, 0.25)", borderRadius: "20px", padding: "32px 24px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🚀</div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>Live Infinity</h2>
            <span style={{ background: "rgba(255, 204, 0, 0.15)", border: "1px solid rgba(255, 204, 0, 0.4)", color: "#ffcc00", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px" }}>
              Versão v10.1.0 Oficial
            </span>
            <p style={{ color: "#9aa0a6", fontSize: "13px", margin: "16px 0 24px", lineHeight: "1.5" }}>
              Extensão oficial de automação inteligente, GMV em tempo real, refixação de produtos e respostas no TikTok Shop.
            </p>
            <a
              href="/downloads/live-infinity.zip"
              download
              style={{ display: "block", background: "linear-gradient(135deg, #e50914, #ff4b2b)", color: "#fff", fontWeight: "700", fontSize: "15px", padding: "15px", borderRadius: "12px", textDecoration: "none" }}
            >
              ⬇️ Baixar Live Infinity v10.1.0 (.zip)
            </a>
          </div>

          {/* LiveCam */}
          <div style={{ background: "rgba(18, 20, 29, 0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 204, 0, 0.35)", borderRadius: "20px", padding: "32px 24px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>📹</div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>LiveCam Infinity</h2>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }}>
              <span style={{ background: "rgba(255, 204, 0, 0.15)", border: "1px solid rgba(255, 204, 0, 0.4)", color: "#ffcc00", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px" }}>
                Versão v1.5.0 Oficial
              </span>
              <span style={{ background: "rgba(0, 230, 118, 0.15)", border: "1px solid rgba(0, 230, 118, 0.4)", color: "#00e676", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "20px" }}>
                🛡️ Proteção Anti-Clonagem
              </span>
            </div>
            <p style={{ color: "#9aa0a6", fontSize: "13px", margin: "12px 0 24px", lineHeight: "1.5" }}>
              Câmera virtual HD 1-clique com retomada pós-F5, Overlays Interativos (Drag & Drop) e código 100% criptografado contra clonagem.
            </p>
            <a
              href="/downloads/livecam.zip"
              download
              style={{ display: "block", background: "linear-gradient(135deg, #ffcc00, #ffa500)", color: "#000", fontWeight: "900", fontSize: "15px", padding: "15px", borderRadius: "12px", textDecoration: "none", boxShadow: "0 8px 24px rgba(255, 204, 0, 0.25)" }}
            >
              ⬇️ Baixar LiveCam v1.5.0 Blindada (.zip)
            </a>
          </div>
        </div>

        <div style={{ background: "rgba(18, 20, 29, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "28px", textAlign: "left" }}>
          <h3 style={{ fontSize: "18px", color: "#ffcc00", marginBottom: "16px" }}>🛠️ Como Instalar no Google Chrome / Microsoft Edge:</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#d1d5db" }}>
            <div>1. Clique no botão acima para baixar o arquivo <strong>.zip</strong> da extensão desejada.</div>
            <div>2. Extraia/descompacte o arquivo <strong>.zip</strong> na sua pasta de downloads.</div>
            <div>3. Acesse <code>chrome://extensions</code> no seu navegador.</div>
            <div>4. No canto superior direito, ative a chave <strong>"Modo do Desenvolvedor"</strong>.</div>
            <div>5. Clique em <strong>"Carregar sem compactação"</strong> e selecione a pasta descompactada. Pronto!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
