import { useEffect, useRef } from "react";

export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Filtro de tempo: leitores de código de barras simulam digitação ultra rápida.
      // Se o tempo entre teclas for maior que 50ms, assume que o usuário está digitando normalmente
      // no teclado e limpa o acumulador para não poluir.
      if (currentTime - lastKeyTimeRef.current > 50) {
        bufferRef.current = "";
      }

      lastKeyTimeRef.current = currentTime;

      // Se pressionar Enter, finaliza a leitura do código
      if (event.key === "Enter") {
        if (bufferRef.current.length >= 8) { // EAN-8 ou EAN-13
          onScan(bufferRef.current);
        }
        bufferRef.current = "";
        event.preventDefault();
        return;
      }

      // Desconsiderar teclas de controle
      if (event.key.length === 1 && /[0-9a-zA-Z]/.test(event.key)) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScan]);
}
