import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helix Jump Original",
  description: "A melhor versão web do Helix Jump",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const urlParams = new URLSearchParams(window.location.search);
            const ref = urlParams.get('ref');
            if (ref) {
              sessionStorage.setItem('helix_ref', ref);
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
            }
            // Anti-Inspect Element e Bloqueio de Teclas
            document.addEventListener('contextmenu', function(e) {
              e.preventDefault();
            });
            document.onkeydown = function(e) {
              // Bloqueia F12
              if (e.keyCode === 123) {
                return false;
              }
              // Bloqueia Ctrl+Shift+I (Inspecionar) e Ctrl+Shift+J (Console) e Ctrl+Shift+C (Inspecionar elemento)
              if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
                return false;
              }
              // Bloqueia Ctrl+U (Ver código fonte)
              if (e.ctrlKey && e.keyCode === 85) {
                return false;
              }
            };
          })();
        `}} />
      </body>
    </html>
  );
}
