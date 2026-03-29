import React, { useState, useEffect, useCallback } from "react";
import { Hash, RefreshCw, Copy, Check, Zap, AlertTriangle } from "lucide-react";
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
  if (!a || !b) return <span className="mono">{a || b}</span>;
  return (
    <span className="mono" style={{ fontSize: "0.72rem", wordBreak: "break-all", lineHeight: 2 }}>
      {a.split("").map((char, i) => (
        <span
          key={i}
          style={{
            color: char !== b[i] ? "var(--accent-yellow)" : "var(--text-secondary)",
            transition: "color 0.3s ease",
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export default function HashPage() {
  const [inputA, setInputA] = useState("Bonjour Blockchain!");
  const [inputB, setInputB] = useState("Bonjour Blockchain?");
  const [hashA, setHashA] = useState("");
  const [hashB, setHashB] = useState("");
  const [timeA, setTimeA] = useState(0);
  const [timeB, setTimeB] = useState(0);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [mode, setMode] = useState("double"); // "single" | "double"

  const computeHash = useCallback(async (text, setter, timeSetter) => {
    const start = performance.now();
    const h = await sha256(text);
    const end = performance.now();
    setter(h);
    timeSetter(Math.round((end - start) * 1000)); // µs
  }, []);

  useEffect(() => {
    computeHash(inputA, setHashA, setTimeA);
  }, [inputA, computeHash]);

  useEffect(() => {
    computeHash(inputB, setHashB, setTimeB);
  }, [inputB, computeHash]);

  const copy = async (text, setCopied) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Nombre de caractères différents entre les deux hashes
  const diffCount = hashA && hashB
    ? hashA.split("").filter((c, i) => c !== hashB[i]).length
    : 0;
  const diffPct = Math.round((diffCount / 64) * 100);

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
          }}
        >
          <Hash size={26} color="white" />
        </div>
        <div>
          <h1 className="page-title">Hachage SHA-256</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Fonction de hachage cryptographique — effet avalanche
          </p>
        </div>
        {/* Mode toggle */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          {["single", "double"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={mode === m ? "btn-primary" : "btn-secondary"}
              style={{ padding: "0.5rem 1.1rem", fontSize: "0.75rem" }}
            >
              {m === "single" ? "Simple" : "Comparaison"}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <motion.div
        layout
        className="glass-card"
        style={{
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "rgba(245, 158, 11, 0.05)",
          borderColor: "rgba(245, 158, 11, 0.2)",
        }}
      >
        <Zap size={18} style={{ color: "var(--accent-yellow)", flexShrink: 0 }} />
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--accent-yellow)" }}>Effet Avalanche :</strong> même une
          toute petite modification dans le texte (un seul caractère) produit un hash complètement
          différent. C'est ce qui rend SHA-256 irréversible et utilisé dans Bitcoin.
        </p>
      </motion.div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mode === "double" ? "1fr 1fr" : "1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Panel A */}
        <HashPanel
          label={mode === "double" ? "Texte A" : "Votre texte"}
          value={inputA}
          onChange={setInputA}
          hash={hashA}
          diffHash={mode === "double" ? hashB : null}
          time={timeA}
          copied={copiedA}
          onCopy={() => copy(hashA, setCopiedA)}
          accentColor="#f59e0b"
        />

        {/* Panel B — only in double mode */}
        <AnimatePresence>
          {mode === "double" && (
            <motion.div
              key="panel-b"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
            >
              <HashPanel
                label="Texte B"
                value={inputB}
                onChange={setInputB}
                hash={hashB}
                diffHash={hashA}
                time={timeB}
                copied={copiedB}
                onCopy={() => copy(hashB, setCopiedB)}
                accentColor="#a855f7"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avalanche indicator — only in double mode */}
      <AnimatePresence>
        {mode === "double" && hashA && hashB && (
          <motion.div
            key="avalanche"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card"
            style={{ padding: "1.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <AlertTriangle size={18} style={{ color: "var(--accent-yellow)" }} />
              <h3 style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Effet Avalanche — {diffCount}/64 caractères différents ({diffPct}%)
              </h3>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: "8px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "1.25rem",
              }}
            >
              <motion.div
                animate={{ width: `${diffPct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                style={{
                  height: "100%",
                  background: diffPct > 30 ? "var(--gradient-warm)" : "linear-gradient(90deg,#6366f1,#a855f7)",
                  borderRadius: "999px",
                }}
              />
            </div>

            {/* Diff hash display */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div
                style={{
                  background: "rgba(10,14,26,0.5)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  border: "1px solid rgba(245, 158, 11, 0.15)",
                }}
              >
                <span className="input-label" style={{ color: "#f59e0b" }}>Hash A</span>
                <div style={{ marginTop: "0.5rem" }}>
                  <DiffHash a={hashA} b={hashB} />
                </div>
              </div>
              <div
                style={{
                  background: "rgba(10,14,26,0.5)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  border: "1px solid rgba(168, 85, 247, 0.15)",
                }}
              >
                <span className="input-label" style={{ color: "#a855f7" }}>Hash B</span>
                <div style={{ marginTop: "0.5rem" }}>
                  <DiffHash a={hashB} b={hashA} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── HashPanel component ─────────────────────────────────────────────────────
function HashPanel({ label, value, onChange, hash, diffHash, time, copied, onCopy, accentColor }) {
  return (
    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label className="input-label" style={{ color: accentColor }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        rows={4}
        style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
        placeholder="Entrez votre texte ici..."
      />

      {/* Stats row */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div
          style={{
            flex: 1,
            background: "rgba(10,14,26,0.4)",
            borderRadius: "var(--radius-sm)",
            padding: "0.6rem 0.9rem",
            border: `1px solid ${accentColor}22`,
          }}
        >
          <div className="input-label">Longueur</div>
          <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{value.length} chars</div>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(10,14,26,0.4)",
            borderRadius: "var(--radius-sm)",
            padding: "0.6rem 0.9rem",
            border: `1px solid ${accentColor}22`,
          }}
        >
          <div className="input-label">Temps</div>
          <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{time} µs</div>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(10,14,26,0.4)",
            borderRadius: "var(--radius-sm)",
            padding: "0.6rem 0.9rem",
            border: `1px solid ${accentColor}22`,
          }}
        >
          <div className="input-label">Taille hash</div>
          <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>256 bits</div>
        </div>
      </div>

      {/* Hash output */}
      <div
        style={{
          background: "rgba(10,14,26,0.6)",
          borderRadius: "var(--radius-sm)",
          padding: "1rem",
          border: `1px solid ${accentColor}33`,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span className="input-label" style={{ color: accentColor }}>SHA-256 Hash</span>
          <button
            onClick={onCopy}
            style={{
              background: "none",
              border: "none",
              color: copied ? "var(--accent-green)" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copié!" : "Copier"}
          </button>
        </div>
        <div className="mono" style={{ fontSize: "0.72rem", wordBreak: "break-all", color: accentColor, lineHeight: 1.8 }}>
          {hash || "…"}
        </div>
      </div>

      {/* Quick randomize */}
      <button
        onClick={() => onChange(value + " " + Math.random().toString(36).slice(2, 6))}
        className="btn-secondary"
        style={{ alignSelf: "flex-start", fontSize: "0.75rem", padding: "0.5rem 1rem" }}
      >
        <RefreshCw size={13} /> Modifier aléatoirement
      </button>
    </div>
  );
}
