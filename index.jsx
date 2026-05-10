import { useState, useRef, useEffect } from "react";

const GOLD = "#C9A84C";
const DARK = "#0A0A0A";
const DARK2 = "#111111";
const DARK3 = "#1A1A1A";
const BORDER = "#2A2A2A";

const MODES = [
  { id: "roteiro",    icon: "🎬", label: "Roteiro YouTube",     desc: "Roteiro completo para vídeo" },
  { id: "descricao",  icon: "📝", label: "Descrição & SEO",     desc: "Título, descrição e tags" },
  { id: "card",       icon: "🗺️", label: "Card Touristta",      desc: "Conteúdo para o app" },
  { id: "estrategia", icon: "📊", label: "Estratégia de Canal", desc: "Pauta e ideias de vídeos" },
];

const LOCATIONS = [
  "Cristo Redentor","Pedra da Gávea","Arpoador","Santa Teresa",
  "Pão de Açúcar","Lapa","Ipanema","Copacabana","Urca","Jardim Botânico",
  "Outro (digitar abaixo)",
];

const LANGS = [
  { id: "Português", label: "Português" },
  { id: "English",   label: "English"   },
  { id: "Español",   label: "Español"   },
];

const SYSTEM_PROMPTS = {
  roteiro: (loc, lang) => `Você é roteirista de turismo de luxo para YouTube. Idioma de resposta: ${lang}. Crie roteiro cinematográfico para "${loc}" com: 1.GANCHO INICIAL (0-15s) 2.INTRODUÇÃO (15-45s) 3.HISTÓRIA & MISTÉRIO 4.EXPERIÊNCIA SENSORIAL 5.O QUE NINGUÉM TE CONTA 6.CALL TO ACTION (mencione app Touristta) 7.10 HASHTAGS. Tom narrativo, luxuoso, sem clichês.`,
  descricao: (loc, lang) => `Você é especialista em SEO para YouTube de turismo. Idioma de resposta: ${lang}. Para "${loc}" gere: 1. 5 OPÇÕES DE TÍTULO (máx 70 chars, emoji, clickbait elegante) 2. DESCRIÇÃO COMPLETA (300 palavras, mencione app Touristta) 3. PRIMEIRAS 2 LINHAS (hook) 4. 30 TAGS otimizadas 5. HORÁRIO IDEAL DE PUBLICAÇÃO.`,
  card: (loc, lang) => `Você é curador do app Olhar Touristta, app GPS de luxo sobre Rio de Janeiro. Idioma de resposta: ${lang}. Para "${loc}" crie: 1.TÍTULO DO CARD (máx 40 chars) 2.SUBTÍTULO de mistério (máx 80 chars) 3.HISTÓRIA PRINCIPAL (250 palavras) 4.FATO MISTERIOSO 5.MELHOR HORÁRIO PARA VISITAR 6.DICA INSIDER 7.SCRIPT DE NARRAÇÃO (60 palavras).`,
  estrategia: (loc, lang) => `Você é estrategista de conteúdo para canal de turismo de luxo no YouTube. Idioma de resposta: ${lang}. Para o tema "${loc}" gere: 1.ANÁLISE DE OPORTUNIDADE 2. 10 IDEIAS DE VÍDEOS com títulos 3.SÉRIE SUGERIDA (3-5 episódios) 4.PÚBLICO-ALVO 5.PARCEIROS POTENCIAIS 6.MONETIZAÇÃO além do YouTube 7.CONCEITO DE THUMBNAIL.`,
};

function TypewriterText({ text, speed = 6 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed(""); setDone(false); idx.current = 0;
    if (!text) return;
    const iv = setInterval(() => {
      if (idx.current < text.length) { setDisplayed(text.slice(0, idx.current + 1)); idx.current++; }
      else { setDone(true); clearInterval(iv); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <span>
      {displayed}
      {!done && <span style={{ color: GOLD, animation: "blink 0.7s step-end infinite" }}>▋</span>}
    </span>
  );
}

export default function TouristtaAgent() {
  const [mode, setMode]           = useState("roteiro");
  const [location, setLocation]   = useState("Cristo Redentor");
  const [customLoc, setCustomLoc] = useState("");
  const [lang, setLang]           = useState("Português");
  const [extra, setExtra]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState("");
  const [rawResult, setRawResult] = useState("");
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);
  const [history, setHistory]     = useState([]);
  const outputRef = useRef(null);

  const finalLoc = location === "Outro (digitar abaixo)" ? customLoc : location;
  const activeMode = MODES.find(m => m.id === mode);

  async function generate() {
    if (!finalLoc.trim()) return;
    setLoading(true); setResult(""); setRawResult(""); setError(""); setCopied(false);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPTS[mode](finalLoc, lang),
          messages: [{ role: "user", content: `Local: ${finalLoc}${extra ? `\nContexto: ${extra}` : ""}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "";
      setRawResult(text); setResult(text);
      setHistory(h => [{ mode, loc: finalLoc, lang, result: text, ts: Date.now() }, ...h.slice(0, 3)]);
    } catch (e) {
      setError("Erro ao conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(rawResult);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function formatResult(text) {
    return text.split("\n").map((line, i) => {
      const isHeader = /^\d+\./.test(line) || /^#{1,3}\s/.test(line) ||
        (line.trim() === line.trim().toUpperCase() && line.trim().length > 3 && /[A-ZÁÉÍÓÚÃÕ]/.test(line));
      if (isHeader) return (
        <p key={i} style={{ color: GOLD, fontWeight: 700, marginTop: 16, marginBottom: 4, fontSize: 12, letterSpacing: 1, fontFamily: "Montserrat,sans-serif" }}>
          {line.replace(/^#+\s/, "")}
        </p>
      );
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
      return (
        <p key={i} style={{ color: "#D0C4A0", lineHeight: 1.8, fontSize: 13, margin: "2px 0", fontFamily: "Montserrat,sans-serif" }}>
          {line}
        </p>
      );
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#E8D5A3" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Montserrat:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink  { 50% { opacity: 0; } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select, textarea, input { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #C9A84C44; border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 6, color: GOLD, fontFamily: "Montserrat,sans-serif", fontWeight: 300, marginBottom: 14 }}>
            MARCOS AURELIO GONZAGA · TOURISTTA ECOSYSTEM
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond,serif", fontSize: "clamp(30px,6vw,50px)", fontWeight: 300, color: "#F0E0B0", letterSpacing: 2, lineHeight: 1.2, marginBottom: 10 }}>
            Agente de Conteúdo
          </h1>
          <div style={{ fontFamily: "Cormorant Garamond,serif", fontSize: 19, color: GOLD, fontStyle: "italic", fontWeight: 300 }}>
            O Rio Que Ninguém Te Contou
          </div>
          <div style={{ width: 60, height: 1, background: `linear-gradient(to right,transparent,${GOLD},transparent)`, margin: "18px auto 0" }} />
        </div>

        {/* Mode selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#555", fontFamily: "Montserrat,sans-serif", marginBottom: 12 }}>MÓDULO DE GERAÇÃO</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setResult(""); }}
                style={{
                  background: mode === m.id ? "#1A1408" : "#111",
                  border: `1px solid ${mode === m.id ? GOLD : "#2A2A2A"}`,
                  borderRadius: 8, padding: "14px 16px", textAlign: "left",
                  color: "#E8D5A3", cursor: "pointer",
                }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 600, fontSize: 12, color: mode === m.id ? GOLD : "#AAA", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 10, color: "#555" }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Config panel */}
        <div style={{ background: DARK2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* Location */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", fontFamily: "Montserrat,sans-serif", marginBottom: 8 }}>LOCALIZAÇÃO</div>
              <select value={location} onChange={e => setLocation(e.target.value)}
                style={{ width: "100%", background: DARK3, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "10px 12px", color: "#E8D5A3", fontSize: 13, fontFamily: "Montserrat,sans-serif" }}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Language */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", fontFamily: "Montserrat,sans-serif", marginBottom: 8 }}>IDIOMA</div>
              <div style={{ display: "flex", gap: 6 }}>
                {LANGS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLang(l.id)}
                    style={{
                      flex: 1,
                      padding: "10px 4px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: "Montserrat,sans-serif",
                      fontWeight: lang === l.id ? 700 : 400,
                      background: lang === l.id ? "#1A1408" : DARK3,
                      color: lang === l.id ? GOLD : "#666",
                      border: `2px solid ${lang === l.id ? GOLD : BORDER}`,
                      cursor: "pointer",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom location input */}
          {location === "Outro (digitar abaixo)" && (
            <div style={{ marginBottom: 16 }}>
              <input value={customLoc} onChange={e => setCustomLoc(e.target.value)}
                placeholder="Digite o local ou tema do vídeo..."
                style={{ width: "100%", background: DARK3, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "10px 12px", color: "#E8D5A3", fontSize: 13, fontFamily: "Montserrat,sans-serif" }} />
            </div>
          )}

          {/* Extra context */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", fontFamily: "Montserrat,sans-serif", marginBottom: 8 }}>
              CONTEXTO ADICIONAL <span style={{ color: "#333" }}>(opcional)</span>
            </div>
            <textarea value={extra} onChange={e => setExtra(e.target.value)}
              placeholder="Ex: focar no pôr do sol, público internacional, tom mais misterioso..."
              rows={2}
              style={{ width: "100%", background: DARK3, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "10px 12px", color: "#E8D5A3", fontSize: 13, fontFamily: "Montserrat,sans-serif", resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>

        {/* Lang indicator */}
        <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 11, color: "#555", marginBottom: 14, textAlign: "right" }}>
          Idioma selecionado: <span style={{ color: GOLD, fontWeight: 600 }}>{lang}</span>
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={loading || !finalLoc.trim()}
          style={{
            width: "100%", padding: "16px",
            background: loading ? "#1A1408" : `linear-gradient(135deg,#8B6914,${GOLD},#8B6914)`,
            border: `1px solid ${GOLD}`, borderRadius: 8,
            color: loading ? GOLD : "#0A0A0A",
            fontFamily: "Montserrat,sans-serif", fontWeight: 700,
            fontSize: 13, letterSpacing: 2, marginBottom: 28,
            cursor: loading || !finalLoc.trim() ? "not-allowed" : "pointer",
            opacity: (!finalLoc.trim() && !loading) ? 0.5 : 1,
          }}>
          {loading
            ? <span style={{ animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }}>✦ GERANDO CONTEÚDO... ✦</span>
            : `✦ GERAR ${activeMode?.label.toUpperCase()} ✦`}
        </button>

        {/* Error */}
        {error && (
          <div style={{ background: "#1A0A0A", border: "1px solid #5C1A1A", borderRadius: 8, padding: 16, marginBottom: 20, color: "#FF7070", fontSize: 13, fontFamily: "Montserrat,sans-serif" }}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div ref={outputRef} style={{ background: DARK2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 28, animation: "fadeIn 0.4s ease" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0F0F0F" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{activeMode?.icon}</span>
                <div>
                  <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 1 }}>{activeMode?.label.toUpperCase()}</div>
                  <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 10, color: "#555" }}>{finalLoc} · {lang}</div>
                </div>
              </div>
              <button onClick={copyAll}
                style={{ background: copied ? "#1A2A1A" : "transparent", border: `1px solid ${copied ? "#4CAF50" : BORDER}`, borderRadius: 6, padding: "6px 14px", color: copied ? "#4CAF50" : "#888", fontFamily: "Montserrat,sans-serif", fontSize: 11, cursor: "pointer" }}>
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
            <div style={{ padding: 20, maxHeight: 480, overflowY: "auto" }}>
              <TypewriterText text={result} />
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", fontFamily: "Montserrat,sans-serif", marginBottom: 12 }}>HISTÓRICO DA SESSÃO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.slice(1).map(h => (
                <div key={h.ts} onClick={() => setResult(h.result)}
                  style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <span style={{ fontSize: 16 }}>{MODES.find(m => m.id === h.mode)?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 11, color: "#777" }}>
                      {MODES.find(m => m.id === h.mode)?.label} · {h.loc} · {h.lang}
                    </div>
                  </div>
                  <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 11, color: "#444" }}>ver →</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <div style={{ width: 40, height: 1, background: `linear-gradient(to right,transparent,${GOLD}44,transparent)`, margin: "0 auto 16px" }} />
          <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 10, color: "#333", letterSpacing: 2 }}>
            OLHAR TOURISTTA · MARCOS AURELIO GONZAGA · marcosagonzaga44@gmail.com
          </div>
        </div>

      </div>
    </div>
  );
}
