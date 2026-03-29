import React, { useState, useEffect, useCallback } from "react";
import { Hash, Copy, Check, AlertTriangle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── SHA-256 via WebCrypto API ──────────────────────────────────────────────
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Colore les caractères différents entre deux hashes
function DiffHash({ a, b }) {
  if (!a || !b) return <span className="mono" style={{ fontSize: "0.72rem", wordBreak: "break-all", lineHeight: 2 }}>{a || b}</span>;
  return (
    <span className="mono" style={{ fontSize: "0.72rem", wordBreak: "break-all", lineHeight: 2 }}>
      {a.split("").map((char, i) => (
        <span key={i} style={{ color: char !== b[i] ? "var(--accent-red)" : "var(--text-secondary)", transition: "color 0.3s ease" }}>
          {char}
        </span>
      ))}
    </span>
  );
}



export default function BasicsPage() {
  const [inputA, setInputA] = useState("Bonjour Blockchain!");
  const [inputB, setInputB] = useState("Bonjour blockchain?");
  const [hashA, setHashA] = useState("");
  const [hashB, setHashB] = useState("");
  const [timeA, setTimeA] = useState(0);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [singleInput, setSingleInput] = useState("Bitcoin");
  const [singleHash, setSingleHash] = useState("");

  const computeHash = useCallback(async (text, setter, timeSetter) => {
    const start = performance.now();
    const h = await sha256(text);
    const end = performance.now();
    setter(h);
    if (timeSetter) timeSetter(Math.round((end - start) * 1000));
  }, []);

  useEffect(() => { computeHash(inputA, setHashA, setTimeA); }, [inputA, computeHash]);
  useEffect(() => { computeHash(inputB, setHashB, null); }, [inputB, computeHash]);
  useEffect(() => { computeHash(singleInput, setSingleHash, null); }, [singleInput, computeHash]);

  const copy = async (text, setCopied) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffCount = hashA && hashB ? hashA.split("").filter((c, i) => c !== hashB[i]).length : 0;
  const diffPct = Math.round((diffCount / 64) * 100);

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)" }}>
          <Hash size={26} color="white" />
        </div>
        <div>
          <h1 className="page-title">Basics — Hachage SHA-256</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Comprendre les propriétés fondamentales du hachage cryptographique
          </p>
        </div>
      </div>

      {/* ── Section 1: Simple hash ── */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
          <BookOpen size={16} style={{ color: "var(--accent-yellow)" }} />
          <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
            Calcul de Hash Simple
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div>
            <label className="input-label">Votre texte</label>
            <textarea
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              className="input-field"
              rows={4}
              style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, marginTop: "0.5rem" }}
              placeholder="Entrez n'importe quel texte…"
            />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              {["Bitcoin", "Blockchain", "Hello World", "2026-03-06"].map(preset => (
                <button key={preset} onClick={() => setSingleInput(preset)} className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem" }}>
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label className="input-label" style={{ color: "var(--accent-yellow)" }}>SHA-256 Hash</label>
              <button onClick={() => copy(singleHash, setCopiedA)} style={{ background: "none", border: "none", color: copiedA ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem" }}>
                {copiedA ? <Check size={12} /> : <Copy size={12} />} {copiedA ? "Copié!" : "Copier"}
              </button>
            </div>
            <div style={{ background: "rgba(10,14,26,0.6)", borderRadius: "var(--radius-sm)", padding: "1rem", border: "1px solid rgba(245,158,11,0.2)", minHeight: "120px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div className="mono" style={{ fontSize: "0.72rem", wordBreak: "break-all", color: "var(--accent-yellow)", lineHeight: 2 }}>
                {singleHash || "…"}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Input: <strong style={{ color: "var(--text-primary)" }}>{singleInput.length} chars</strong>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Output: <strong style={{ color: "var(--text-primary)" }}>256 bits / 64 hex</strong>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Temps: <strong style={{ color: "var(--text-primary)" }}>{timeA} µs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Avalanche effect ── */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />
          <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
            Démonstration — Effet Avalanche
          </h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
          Modifiez un seul caractère dans l'un des champs et observez comment le hash change complètement. Les caractères <span style={{ color: "var(--accent-red)", fontWeight: 700 }}>en rouge</span> sont différents.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Texte A", value: inputA, onChange: setInputA, hash: hashA, diffHash: hashB, copied: copiedA, setCopied: setCopiedA, color: "#f59e0b" },
            { label: "Texte B", value: inputB, onChange: setInputB, hash: hashB, diffHash: hashA, copied: copiedB, setCopied: setCopiedB, color: "#a855f7" },
          ].map(({ label, value, onChange, hash, diffHash, copied, setCopied, color }) => (
            <div key={label} className="glass-card" style={{ padding: "1.25rem", background: "rgba(10,14,26,0.3)" }}>
              <label className="input-label" style={{ color, marginBottom: "0.5rem", display: "block" }}>{label}</label>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-field"
                rows={3}
                style={{ resize: "none", fontFamily: "inherit", marginBottom: "0.75rem" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span className="input-label" style={{ color }}>Hash SHA-256</span>
                <button onClick={() => copy(hash, setCopied)} style={{ background: "none", border: "none", color: copied ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.68rem" }}>
                  {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copié" : "Copier"}
                </button>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)", padding: "0.75rem", border: `1px solid ${color}22` }}>
                <DiffHash a={hash} b={diffHash} />
              </div>
            </div>
          ))}
        </div>

        {/* Avalanche meter */}
        {hashA && hashB && (
          <motion.div layout style={{ padding: "1rem 1.25rem", background: "rgba(10,14,26,0.4)", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Effet Avalanche — {diffCount}/64 hex chars différents
              </span>
              <span style={{ fontWeight: 900, color: diffPct > 30 ? "var(--accent-red)" : "var(--accent-yellow)", fontSize: "1rem" }}>
                {diffPct}%
              </span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${diffPct}%` }}
                transition={{ type: "spring", stiffness: 100 }}
                style={{
                  height: "100%",
                  background: diffPct > 30
                    ? "linear-gradient(90deg,#f59e0b,#ef4444)"
                    : "linear-gradient(90deg,#6366f1,#a855f7)",
                  borderRadius: 999,
                }}
              />
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
