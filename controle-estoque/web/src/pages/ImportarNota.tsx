import { useState } from "react";
import { CheckCircle, RefreshCw, UploadCloud, FileCode, Landmark, ShoppingBag, X } from "lucide-react";
import api from "../services/api";

interface ImportarNotaProps {
  loadData: () => Promise<void>;
  isDemoMode: boolean;
}

type ResumoNota = {
  numero: string;
  nomeEmitente: string;
  valorTotal: number;
  totalItens: number;
};

export function ImportarNota({ loadData, isDemoMode }: ImportarNotaProps) {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [resumoNota, setResumoNota] = useState<ResumoNota | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".xml")) {
      setXmlFile(file);
      setResumoNota(null); // Limpa resumos anteriores
    } else {
      alert("Por favor, envie apenas arquivos no formato XML de Notas Fiscais.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setXmlFile(file);
      setResumoNota(null);
    }
  };

  const limparArquivo = () => {
    setXmlFile(null);
    setUploadProgress(0);
  };

  const processarXml = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xmlFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setResumoNota(null);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 120);

    try {
      if (isDemoMode) {
        setTimeout(async () => {
          clearInterval(interval);
          setUploadProgress(100);
          
          // Dados simulados da nota no modo Demo
          const mockNota: ResumoNota = {
            numero: "000.124.981",
            nomeEmitente: "DISTRIBUIDORA DE ALIMENTOS VALORA LTDA",
            valorTotal: 1450.80,
            totalItens: Math.floor(Math.random() * 4) + 2 // Simula entre 2 e 5 itens
          };

          setResumoNota(mockNota);
          setIsUploading(false);
          setXmlFile(null);
          await loadData();
        }, 1200);
      } else {
        const formData = new FormData();
        formData.append("xml", xmlFile);

        const res = await api.post("/notas-fiscais/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        clearInterval(interval);
        setUploadProgress(100);

        const notaRetornada = res.data.nota;
        setResumoNota({
          numero: notaRetornada.numero,
          nomeEmitente: notaRetornada.nomeEmitente || "Fornecedor da Nota",
          valorTotal: Number(notaRetornada.valorTotal),
          totalItens: notaRetornada.itens?.length || 0
        });

        setIsUploading(false);
        setXmlFile(null);
        await loadData();
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      alert("Erro ao processar nota fiscal: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in text-zinc-100">
      
      {/* Header Informativo */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Importador ERP de NF-e</h2>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto">
          Faça upload da nota fiscal eletrônica em formato XML. O sistema atualizará o estoque, cadastrará fornecedores e gerará lançamentos financeiros automaticamente.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-8 space-y-6 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-650 to-indigo-700"></div>

        <form onSubmit={processarXml} className="space-y-6">
          
          {/* Drag & Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer relative overflow-hidden ${
              isDragOver 
                ? "border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-600/5" 
                : xmlFile 
                  ? "border-emerald-500/60 bg-emerald-500/5" 
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/60"
            }`}
          >
            <input 
              type="file" 
              accept=".xml" 
              id="xml-upload-file" 
              onChange={handleFileChange}
              className="hidden" 
              disabled={isUploading}
            />
            
            <label htmlFor="xml-upload-file" className="cursor-pointer space-y-4 block">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner border transition ${
                xmlFile 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400"
              }`}>
                {xmlFile ? <FileCode size={30} className="animate-pulse" /> : <UploadCloud size={30} />}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-white tracking-wide">
                  {xmlFile ? xmlFile.name : "Arraste e solte o XML da nota aqui"}
                </p>
                <p className="text-xs text-zinc-500">
                  {xmlFile ? `${(xmlFile.size / 1024).toFixed(1)} KB` : "Ou clique para navegar e selecionar o arquivo"}
                </p>
              </div>
            </label>

            {/* Botão de Cancelar Seleção */}
            {xmlFile && !isUploading && (
              <button
                type="button"
                onClick={limparArquivo}
                className="absolute top-3 right-3 text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition"
                title="Limpar arquivo"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Barra de Carregamento e Status */}
          {isUploading && (
            <div className="space-y-2.5 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl shadow-inner animate-pulse">
              <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="animate-spin text-indigo-400" size={14} /> Processando Lançamento...
                </span>
                <span className="font-mono text-indigo-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Botão de Envio (Apenas se houver arquivo selecionado) */}
          {xmlFile && !isUploading && (
            <div className="animate-fade-in">
              <button 
                type="submit" 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-extrabold text-sm transition shadow-lg shadow-indigo-600/10 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                Processar Nota Fiscal
              </button>
            </div>
          )}
        </form>

        {/* Resumo Detalhado da NF-e Processada com Sucesso */}
        {resumoNota && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-6 shadow-lg relative overflow-hidden animate-scale-up space-y-4">
            
            {/* Header do Card */}
            <div className="flex items-center gap-3 border-b border-emerald-500/25 pb-3">
              <CheckCircle size={22} className="text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm tracking-wide text-white uppercase">Lançamento Concluído no ERP!</h4>
                <p className="text-[10px] text-emerald-400 font-bold">ESTOQUE E CONTABILIDADE INTEGRADOS</p>
              </div>
            </div>

            {/* Grid de Informações da Nota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-350">
              <div className="space-y-1 bg-zinc-950/30 p-3 rounded-xl border border-emerald-500/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Número da NF-e</span>
                <span className="font-mono font-bold text-zinc-200 text-sm">{resumoNota.numero}</span>
              </div>

              <div className="space-y-1 bg-zinc-950/30 p-3 rounded-xl border border-emerald-500/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Faturamento Total</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">R$ {resumoNota.valorTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-1 bg-zinc-950/30 p-3 rounded-xl border border-emerald-500/5 md:col-span-2 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Fornecedor / Emitente</span>
                  <span className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                    <Landmark size={14} className="text-zinc-500" /> {resumoNota.nomeEmitente}
                  </span>
                </div>
                <div className="text-right shrink-0 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <ShoppingBag size={14} className="text-zinc-400" />
                  <span className="font-mono font-bold text-zinc-350">{resumoNota.totalItens} itens</span>
                </div>
              </div>
            </div>

            {/* Alerta ERP de Auditoria */}
            <p className="text-[10px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 p-3 rounded-xl text-center font-bold">
              Estoque físico atualizado, fornecedor catalogado e lançamento de despesa financeira de faturamento gerados com segurança.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
