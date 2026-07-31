export default function DownloadPage() {
  const version = "11.0.5";
  const livecamVersion = "3.6.4";

  const browsers = [
    {
      id: "chrome",
      name: "Google Chrome",
      file: "/downloads/live-infinity/live-infinity-chrome.zip",
      icon: "/images/browsers/chrome.svg",
      gradient: "linear-gradient(135deg, #4285f4, #34a853)",
      shadow: "rgba(66, 133, 244, 0.35)",
      text: "Baixar para Google Chrome"
    },
    {
      id: "edge",
      name: "Microsoft Edge",
      file: "/downloads/live-infinity/live-infinity-edge.zip",
      icon: "/images/browsers/edge.svg",
      gradient: "linear-gradient(135deg, #0aa0f6, #0fc7b1)",
      shadow: "rgba(10, 160, 246, 0.35)",
      text: "Baixar para Microsoft Edge"
    },
    {
      id: "opera",
      name: "Opera",
      file: "/downloads/live-infinity/live-infinity-opera.zip",
      icon: "/images/browsers/opera.svg",
      gradient: "linear-gradient(135deg, #ff1b2d, #b00020)",
      shadow: "rgba(255, 27, 45, 0.35)",
      text: "Baixar para Opera"
    },
    {
      id: "opera-gx",
      name: "Opera GX",
      file: "/downloads/live-infinity/live-infinity-opera-gx.zip",
      icon: "/images/browsers/opera-gx.svg",
      gradient: "linear-gradient(135deg, #ff1744, #7b001c)",
      shadow: "rgba(255, 23, 68, 0.35)",
      text: "Baixar para Opera GX"
    },
    {
      id: "brave",
      name: "Brave",
      file: "/downloads/live-infinity/live-infinity-brave.zip",
      icon: "/images/browsers/brave.svg",
      gradient: "linear-gradient(135deg, #ff5f1f, #d93800)",
      shadow: "rgba(255, 95, 31, 0.35)",
      text: "Baixar para Brave"
    },
    {
      id: "vivaldi",
      name: "Vivaldi",
      file: "/downloads/live-infinity/live-infinity-vivaldi.zip",
      icon: "/images/browsers/vivaldi.svg",
      gradient: "linear-gradient(135deg, #ef3939, #b71328)",
      shadow: "rgba(239, 57, 57, 0.35)",
      text: "Baixar para Vivaldi"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a12",
      color: "#f0f2f5",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px"
    }}>
      <style>{`
        .browser-downloads {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 900px) {
          .browser-downloads {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .browser-downloads {
            grid-template-columns: 1fr;
          }
        }

        .browser-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 20px;
          min-height: 64px;
          border-radius: 14px;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          cursor: pointer;
          box-sizing: border-box;
        }

        .browser-btn:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
        }

        .browser-icon {
          width: 28px;
          height: 28px;
          object-fit: contain;
          flex-shrink: 0;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: "920px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "clamp(2rem, 4vw, 2.5rem)",
          fontWeight: "900",
          background: "linear-gradient(135deg, #e50914, #ff4b2b, #ffcc00)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px",
          letterSpacing: "-0.02em"
        }}>
          ⚡ CENTRAL DE DOWNLOADS OFICIAL
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "40px" }}>
          Baixe os pacotes oficiais das extensões para o seu navegador homologado.
        </p>

        {/* CONTAINER DA SEÇÃO LIVE INFINITY */}
        <div style={{
          background: "rgba(15, 20, 32, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 204, 0, 0.35)",
          borderRadius: "24px",
          padding: "36px 28px",
          marginBottom: "40px",
          textAlign: "left",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "32px" }}>🚀</span>
              <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#fff", margin: 0 }}>LIVE INFINITY</h2>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{
                background: "rgba(255, 204, 0, 0.15)",
                border: "1px solid rgba(255, 204, 0, 0.4)",
                color: "#ffcc00",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 14px",
                borderRadius: "20px"
              }}>
                Versão v{version} OFFICIAL
              </span>
              <span style={{
                background: "rgba(0, 230, 118, 0.15)",
                border: "1px solid rgba(0, 230, 118, 0.4)",
                color: "#00e676",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 14px",
                borderRadius: "20px"
              }}>
                🛡️ Proteção Anti-Clonagem
              </span>
            </div>
          </div>

          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "12px 0 24px", lineHeight: "1.6" }}>
            Automação inteligente de lives no TikTok Shop. Selecione abaixo o seu navegador para baixar o pacote oficial atualizado.
          </p>

          <p style={{ fontSize: "13px", fontWeight: "800", color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Escolha seu navegador (Chromium):
          </p>

          {/* GRADE DOS BOTÕES DOS NAVEGADORES */}
          <div className="browser-downloads">
            {browsers.map((b) => (
              <a
                key={b.id}
                href={b.file}
                download
                className="browser-btn"
                style={{
                  background: b.gradient,
                  boxShadow: `0 8px 24px ${b.shadow}`
                }}
              >
                <img src={b.icon} alt={b.name} className="browser-icon" />
                <span>{b.text}</span>
              </a>
            ))}
          </div>

          {/* AVISO DO FIREFOX */}
          <div style={{
            background: "rgba(255, 35, 35, 0.08)",
            border: "1px solid rgba(255, 35, 35, 0.25)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            color: "#f87171",
            fontSize: "14px",
            fontWeight: "600",
            lineHeight: "1.5"
          }}>
            <span style={{ fontSize: "22px", flexShrink: 0 }}>🦊</span>
            <div>
              <strong>Mozilla Firefox:</strong> Ainda não liberado comercialmente. A extensão foi desenvolvida e homologada exclusivamente para navegadores baseados em Chromium.
            </div>
          </div>
        </div>

        {/* CONTAINER DA SEÇÃO LIVECAM INFINITY */}
        <div style={{
          background: "rgba(15, 20, 32, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 204, 0, 0.25)",
          borderRadius: "24px",
          padding: "36px 28px",
          marginBottom: "40px",
          textAlign: "left",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "32px" }}>📹</span>
              <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#fff", margin: 0 }}>LiveCam Infinity</h2>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{
                background: "rgba(255, 204, 0, 0.15)",
                border: "1px solid rgba(255, 204, 0, 0.4)",
                color: "#ffcc00",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 14px",
                borderRadius: "20px"
              }}>
                Versão v{livecamVersion} OFFICIAL
              </span>
              <span style={{
                background: "rgba(0, 230, 118, 0.15)",
                border: "1px solid rgba(0, 230, 118, 0.4)",
                color: "#00e676",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 14px",
                borderRadius: "20px"
              }}>
                🛡️ Proteção Anti-Clonagem
              </span>
            </div>
          </div>

          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "12px 0 24px", lineHeight: "1.6" }}>
            Câmera virtual HD 1-clique com retomada pós-F5, Overlays Interativos (Drag & Drop) e código 100% criptografado contra clonagem.
          </p>

          <a
            href="/downloads/livecam.zip"
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(135deg, #ffcc00, #ffa500)",
              color: "#000",
              fontWeight: "900",
              fontSize: "15px",
              padding: "16px 28px",
              borderRadius: "14px",
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(255, 204, 0, 0.25)"
            }}
          >
            <span>⬇️ Baixar LiveCam v3.6.4 Blindada (.zip)</span>
          </a>
        </div>

        {/* INSTRUÇÕES DE INSTALAÇÃO */}
        <div style={{
          background: "rgba(15, 20, 32, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "28px",
          textAlign: "left"
        }}>
          <h3 style={{ fontSize: "18px", color: "#ffcc00", marginBottom: "16px", fontWeight: "800" }}>
            🛠️ Como Instalar as Extensões no seu Navegador Chromium:
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
            <div>1. Clique no botão correspondente ao seu navegador Chromium acima para baixar o arquivo <strong>.zip</strong> oficial.</div>
            <div>2. Extraia/descompacte o arquivo <strong>.zip</strong> em uma pasta local do seu computador.</div>
            <div>3. Acesse a página de extensões do seu navegador (ex: <code>chrome://extensions</code> no Chrome/Brave/Opera ou <code>edge://extensions</code> no Edge).</div>
            <div>4. No canto superior direito, ative a opção <strong>"Modo do Desenvolvedor"</strong> (Developer mode).</div>
            <div>5. Clique no botão <strong>"Carregar sem compactação"</strong> (Load unpacked) e selecione a pasta descompactada. Pronto!</div>
          </div>
        </div>

      </div>
    </div>
  );
}
