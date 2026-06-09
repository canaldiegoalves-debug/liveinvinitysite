import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Printer, Trash2, Plus, Minus, Tag, Package,
  X, SlidersHorizontal, Eye
} from "lucide-react";
import api from "../services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Produto = {
  id: string;
  codigoBarras: string | null;
  nome: string;
  precoVenda: number;
  precoCusto: number;
  estoqueAtual: number;
};

type ItemFila = {
  produto: Produto;
  quantidade: number;
};

interface EtiquetasProps {
  isDemoMode: boolean;
}

// ─── Gerador de Código de Barras Code 128 em SVG puro ────────────────────────
// Implementação completa sem dependências externas

const CODE128_TABLE: Record<string, number> = {
  ' ':0,'!':1,'"':2,'#':3,'$':4,'%':5,'&':6,"'":7,'(':8,')':9,'*':10,
  '+':11,',':12,'-':13,'.':14,'/':15,'0':16,'1':17,'2':18,'3':19,'4':20,
  '5':21,'6':22,'7':23,'8':24,'9':25,':':26,';':27,'<':28,'=':29,'>':30,
  '?':31,'@':32,'A':33,'B':34,'C':35,'D':36,'E':37,'F':38,'G':39,'H':40,
  'I':41,'J':42,'K':43,'L':44,'M':45,'N':46,'O':47,'P':48,'Q':49,'R':50,
  'S':51,'T':52,'U':53,'V':54,'W':55,'X':56,'Y':57,'Z':58,'[':59,'\\':60,
  ']':61,'^':62,'_':63,'`':64,'a':65,'b':66,'c':67,'d':68,'e':69,'f':70,
  'g':71,'h':72,'i':73,'j':74,'k':75,'l':76,'m':77,'n':78,'o':79,'p':80,
  'q':81,'r':82,'s':83,'t':84,'u':85,'v':86,'w':87,'x':88,'y':89,'z':90,
  '{':91,'|':92,'}':93,'~':94,
};

// Padrões de barras para Code 128B (11 bits cada)
const CODE128_PATTERNS = [
  '11011001100','11001101100','11001100110','10010011000','10010001100',
  '10001001100','10011001000','10011000100','10001100100','11001001000',
  '11001000100','11000100100','10110011100','10011011100','10011001110',
  '10111001100','10011101100','10011100110','11001110010','11001011100',
  '11001001110','11011100100','11001110100','11101101110','11101001100',
  '11100101100','11100100110','11101100100','11100110100','11100110010',
  '11011011000','11011000110','11000110110','10100011000','10001011000',
  '10001000110','10110001000','10001101000','10001100010','11010001000',
  '11000101000','11000100010','10110111000','10110001110','10001101110',
  '10111011000','10111000110','10001110110','11101110110','11010001110',
  '11000101110','11011101000','11011100010','11011101110','11101011000',
  '11101000110','11100010110','11101101000','11101100010','11100011010',
  '11101111010','11001000010','11110001010','10100110000','10100001100',
  '10010110000','10010000110','10000101100','10000100110','10110010000',
  '10110000100','10011010000','10011000010','10000110100','10000110010',
  '11000010010','11001010000','11110111010','11000010100','10001111010',
  '10100111100','10010111100','10010011110','10111100100','10011110100',
  '10011110010','11110100100','11110010100','11110010010','11011011110',
  '11011110110','11110110110','10101111000','10100011110','10001011110',
  '10111101000','10111100010','11110101000','11110100010','10111011110',
  '10111101110','11101011110','11110101110',
  '11010000100', // START B (104)
  '11010000100', // START C (105) - reusing for simplicity
  '11000111010', // STOP (106)
];

function generateCode128SVG(code: string, width: number, height: number): string {
  // Usa somente Code 128B
  const START_B = 104;

  const chars = code.split('').map(c => {
    const v = CODE128_TABLE[c];
    return v !== undefined ? v : 0;
  });

  // Calcular check digit
  let checksum = START_B;
  chars.forEach((v, i) => { checksum += v * (i + 1); });
  checksum = checksum % 103;

  // Montar sequência de padrões
  const sequence = [
    CODE128_PATTERNS[104], // START B
    ...chars.map(v => CODE128_PATTERNS[v] || CODE128_PATTERNS[0]),
    CODE128_PATTERNS[checksum],
    '1100011101011', // STOP symbol
  ];

  const bits = sequence.join('');
  const moduleWidth = width / bits.length;

  let svgBars = '';
  let x = 0;

  for (let i = 0; i < bits.length; ) {
    const bit = bits[i];
    let run = 0;
    while (i + run < bits.length && bits[i + run] === bit) run++;

    if (bit === '1') {
      svgBars += `<rect x="${(x * moduleWidth).toFixed(3)}" y="0" width="${(run * moduleWidth).toFixed(3)}" height="${height}" fill="#000"/>`;
    }
    x += run;
    i += run;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">${svgBars}</svg>`;
}

// ─── Componente de Etiqueta Individual (tela + impressão) ────────────────────

function EtiquetaCard({
  produto,
  nomeLoja,
  preview = false,
}: {
  produto: Produto;
  nomeLoja: string;
  preview?: boolean;
}) {
  const hasBarcode = !!produto.codigoBarras;
  const barcodeSvg = hasBarcode
    ? generateCode128SVG(produto.codigoBarras!, 200, 50)
    : '';

  if (preview) {
    // Visual de preview na tela (escalonado para caber no painel)
    return (
      <div className="bg-white text-black rounded-lg border-2 border-dashed border-zinc-300 p-2 flex flex-col justify-between"
           style={{ width: '160px', height: '96px', fontSize: '8px' }}>
        <div className="font-bold uppercase tracking-wider text-zinc-500 text-[7px]">{nomeLoja}</div>
        <div className="font-bold leading-tight text-[8px] line-clamp-2">{produto.nome}</div>
        <div className="font-black text-[16px] leading-none">
          R$ {Number(produto.precoVenda).toFixed(2)}
        </div>
        <div className="flex flex-col items-start">
          {hasBarcode && (
            <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} className="w-full" style={{ height: '22px' }} />
          )}
          <div className="font-mono text-[6px] text-zinc-500 tracking-widest w-full text-center">
            {produto.codigoBarras || '—'}
          </div>
        </div>
      </div>
    );
  }

  // Versão de impressão (classes CSS do @media print)
  return (
    <div className="etiqueta-item">
      <p className="etiqueta-loja">{nomeLoja}</p>
      <p className="etiqueta-produto">{produto.nome}</p>
      <p className="etiqueta-preco">R$ {Number(produto.precoVenda).toFixed(2)}</p>
      <div className="etiqueta-barcode">
        {hasBarcode && (
          <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        )}
        <p className="etiqueta-ean">{produto.codigoBarras || ''}</p>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function Etiquetas({ isDemoMode }: EtiquetasProps) {
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nomeLoja, setNomeLoja] = useState('VALORA • Estoque');
  const [tamanhoEtiqueta, setTamanhoEtiqueta] = useState<'50x30' | '40x25' | '60x40'>('50x30');
  const [showConfig, setShowConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarProdutos();
    searchRef.current?.focus();
  }, [isDemoMode]);

  const carregarProdutos = async () => {
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem('@estoqueSaaS:mockDB') || '{}');
        setTodosProdutos(db.produtos || []);
      } else {
        const res = await api.get('/produtos');
        setTodosProdutos(res.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const adicionarFila = (produto: Produto) => {
    setFila(prev => {
      const idx = prev.findIndex(i => i.produto.id === produto.id);
      if (idx !== -1) {
        return prev.map((i, n) => n === idx ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const removerFila = (id: string) => {
    setFila(prev => prev.filter(i => i.produto.id !== id));
  };

  const ajustarQtd = (id: string, delta: number) => {
    setFila(prev =>
      prev
        .map(i => i.produto.id === id ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i)
        .filter(i => i.quantidade > 0)
    );
  };

  const setQtd = (id: string, val: number) => {
    setFila(prev =>
      prev.map(i => i.produto.id === id ? { ...i, quantidade: Math.max(1, val || 1) } : i)
    );
  };

  // Total de etiquetas que serão impressas
  const totalEtiquetas = fila.reduce((s, i) => s + i.quantidade, 0);

  // Expandir fila: cada produto repetido conforme quantidade
  const etiquetasExpandidas = fila.flatMap(i =>
    Array.from({ length: i.quantidade }, (_, n) => ({ ...i, key: `${i.produto.id}-${n}` }))
  );

  const handleImprimir = useCallback(() => {
    if (fila.length === 0) return;
    setIsPrinting(true);
    // Pequeno delay para React renderizar a área de impressão
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  }, [fila]);

  // Atalho Ctrl+P para imprimir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleImprimir();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleImprimir]);

  const produtosFiltrados = todosProdutos.filter(p =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(searchQuery))
  ).slice(0, 12);

  // Dimensões visuais por tamanho escolhido
  const dimensoesLabel: Record<string, string> = {
    '50x30': '50mm × 30mm',
    '40x25': '40mm × 25mm',
    '60x40': '60mm × 40mm',
  };

  return (
    <>
      {/* ====== ÁREA VISÍVEL NA TELA ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-zinc-100">

        {/* ── COLUNA ESQUERDA: Catálogo + Configurações ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          {/* Header do Módulo */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-wide">
                  <Tag size={16} className="text-amber-400" /> GERADOR DE ETIQUETAS
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Impressão térmica {dimensoesLabel[tamanhoEtiqueta]}</p>
              </div>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-2 rounded-lg border transition ${showConfig ? 'bg-amber-600/20 border-amber-500/40 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                title="Configurações de impressão"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Configurações expansíveis */}
            {showConfig && (
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Nome da Loja nas Etiquetas</label>
                  <input
                    type="text"
                    value={nomeLoja}
                    onChange={e => setNomeLoja(e.target.value)}
                    maxLength={30}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Tamanho da Etiqueta</label>
                  <div className="flex gap-2">
                    {(['50x30', '40x25', '60x40'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTamanhoEtiqueta(t)}
                        className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase border transition ${
                          tamanhoEtiqueta === t
                            ? 'bg-amber-600/20 border-amber-500/50 text-amber-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {dimensoesLabel[t]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Busca de Produtos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Pesquisar Produto para Adicionar
            </span>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Nome do produto ou código EAN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-zinc-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Lista de resultados */}
            {searchQuery.length > 0 && (
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-0.5">
                {produtosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs font-bold uppercase">
                    Nenhum produto encontrado
                  </div>
                ) : (
                  produtosFiltrados.map(p => (
                    <button
                      key={p.id}
                      onClick={() => adicionarFila(p)}
                      className="w-full flex items-center justify-between p-3 bg-zinc-950 hover:bg-amber-500/10 border border-zinc-850 hover:border-amber-500/30 rounded-xl transition group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-zinc-500 group-hover:text-amber-400 transition" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate group-hover:text-amber-300 transition">{p.nome}</p>
                          <p className="text-[10px] font-mono text-zinc-600">{p.codigoBarras || 'Sem EAN'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-bold text-amber-400 font-mono text-sm">R$ {Number(p.precoVenda).toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-600">Estq: {p.estoqueAtual}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {searchQuery.length === 0 && (
              <div className="text-center py-6 text-zinc-700">
                <Tag size={28} className="mx-auto mb-2 text-zinc-800" />
                <p className="text-xs font-bold text-zinc-600">Digite para pesquisar produtos</p>
              </div>
            )}
          </div>
        </div>

        {/* ── COLUNA DIREITA: Fila de Impressão ── */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          {/* Header da Fila */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-wide flex items-center gap-2">
                  <Printer size={16} className="text-amber-400" /> FILA DE IMPRESSÃO
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {totalEtiquetas === 0
                    ? 'Nenhuma etiqueta na fila'
                    : `${totalEtiquetas} etiqueta${totalEtiquetas !== 1 ? 's' : ''} • ${fila.length} produto${fila.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex gap-2">
                {fila.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-xs transition ${
                        showPreview
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <button
                      onClick={() => setFila([])}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold text-xs transition"
                    >
                      <Trash2 size={13} /> Limpar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Lista da fila */}
            {fila.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3 text-zinc-700">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-800 flex items-center justify-center">
                  <Printer size={28} className="text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-600">Fila vazia</p>
                  <p className="text-xs text-zinc-700 mt-1">Pesquise e adicione produtos à esquerda</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {fila.map((item, idx) => (
                  <div
                    key={item.produto.id}
                    className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 hover:border-zinc-700 transition group"
                  >
                    {/* Número sequencial */}
                    <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 shrink-0">
                      {idx + 1}
                    </div>

                    {/* Dados do produto */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs truncate">{item.produto.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-amber-400 text-xs font-bold">
                          R$ {Number(item.produto.precoVenda).toFixed(2)}
                        </span>
                        {item.produto.codigoBarras && (
                          <span className="text-[10px] font-mono text-zinc-600">{item.produto.codigoBarras}</span>
                        )}
                      </div>
                    </div>

                    {/* Controle de quantidade */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => ajustarQtd(item.produto.id, -1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={item.quantidade}
                        onChange={e => setQtd(item.produto.id, parseInt(e.target.value))}
                        className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded-lg py-1 font-black text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => ajustarQtd(item.produto.id, +1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Rótulo de unidades */}
                    <span className="text-[10px] text-zinc-600 font-bold shrink-0 w-12 text-center">
                      {item.quantidade}x etiq.
                    </span>

                    {/* Remover */}
                    <button
                      onClick={() => removerFila(item.produto.id)}
                      className="p-1.5 text-zinc-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Visual das Etiquetas */}
          {showPreview && fila.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Eye size={13} className="text-indigo-400" /> Preview de Impressão (escala reduzida)
              </h4>
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {etiquetasExpandidas.slice(0, 20).map(item => (
                    <EtiquetaCard
                      key={item.key}
                      produto={item.produto}
                      nomeLoja={nomeLoja}
                      preview={true}
                    />
                  ))}
                  {etiquetasExpandidas.length > 20 && (
                    <div className="w-[160px] h-[96px] bg-zinc-800/40 border border-zinc-800 rounded-lg flex items-center justify-center">
                      <span className="text-zinc-600 text-xs font-bold">+{etiquetasExpandidas.length - 20} mais</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 text-center">
                Preview escalonado — impressão final em {dimensoesLabel[tamanhoEtiqueta]}
              </p>
            </div>
          )}

          {/* Botão de Impressão */}
          {fila.length > 0 && (
            <button
              onClick={handleImprimir}
              disabled={isPrinting}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-60 text-white rounded-2xl font-extrabold text-base uppercase tracking-wider transition duration-200 shadow-xl shadow-amber-600/20 flex items-center justify-center gap-3 group"
            >
              <Printer size={20} className="group-hover:scale-110 transition-transform" />
              {isPrinting
                ? 'Preparando...'
                : `Imprimir ${totalEtiquetas} Etiqueta${totalEtiquetas !== 1 ? 's' : ''} (Ctrl+P)`}
            </button>
          )}

          {/* Dica rápida */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">💡 Guia de Impressão</h4>
            <ul className="text-[11px] text-zinc-600 space-y-1.5">
              <li>• Conecte sua <strong className="text-zinc-400">impressora térmica</strong> antes de imprimir</li>
              <li>• Configure o <strong className="text-zinc-400">tamanho do papel</strong> como {dimensoesLabel[tamanhoEtiqueta]} no driver</li>
              <li>• Desative <strong className="text-zinc-400">cabeçalhos e rodapés</strong> nas configurações do navegador</li>
              <li>• Para rolo contínuo, defina <strong className="text-zinc-400">margens = Nenhuma</strong></li>
              <li>• Atalho: <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 font-mono text-zinc-400">Ctrl+P</kbd> abre impressão direta</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ====== ÁREA DE IMPRESSÃO (só visível no @media print) ====== */}
      <div id="etiquetas-print-area" style={{ display: 'none' }}>
        <div className="etiqueta-roll-container">
          {etiquetasExpandidas.map(item => (
            <div key={item.key}>
              <EtiquetaCard
                produto={item.produto}
                nomeLoja={nomeLoja}
                preview={false}
              />
              <span className="etiqueta-separator" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
