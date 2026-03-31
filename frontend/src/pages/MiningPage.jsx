import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Pickaxe, Play, Square, Cpu, Zap, RefreshCw, ChevronDown, ChevronUp,
  Coins, Hash, Database, Users, Check, Copy, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc, apiWallet } from "../api";

// ── SHA-256 client-side ──────────────────────────────────────────────────
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Merkle Root ───────────────────────────────────────────────────────────
async function buildMerkleRoot(items) {
  if (!items.length) return "0".repeat(64);
  let layer = await Promise.all(items.map((item) => sha256(JSON.stringify(item))));
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const l = layer[i];
      const r = i + 1 < layer.length ? layer[i + 1] : layer[i];
      next.push(await sha256(l + r));
    }
    layer = next;
  }
  return layer[0];
}

const truncate = (s, n = 10) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "—";
const REWARD = 6.25;

export default function MiningPage() {
  const [wallets, setWallets]     = useState([]);
  const [mempool, setMempool]     = useState([]);
  const [minerAddr, setMinerAddr] = useState("");
  const [selectedTx, setSelectedTx] = useState(new Set());
  const [difficulty, setDifficulty] = useState(4);

  // Candidate block
  const [blockIndex, setBlockIndex] = useState(1);
  const [prevHash, setPrevHash]     = useState("0".repeat(64));
  const [merkleRoot, setMerkleRoot] = useState("");

  // Mining state
  const [status, setStatus]         = useState("idle"); // idle | mining | found | stopped
  const [nonce, setNonce]           = useState(0);
  const [currentHash, setCurrentHash] = useState("");
  const [elapsed, setElapsed]       = useState(0);
  const [result, setResult]         = useState(null);

  // Backend
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendResult, setBackendResult]   = useState(null);
  const [toast, setToast]     = useState(null);
  const [copied, setCopied]   = useState(null);

  const miningRef   = useRef(false);
  const startRef    = useRef(0);

  // ── Data fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [wRes, mRes] = await Promise.all([apiWallet.getAll(), apiBloc.getMempool()]);
      setWallets(wRes.data || []);
      const sorted = (mRes.data || []).sort((a, b) => (b.fees ?? b.frais ?? 0) - (a.fees ?? a.frais ?? 0));
      setMempool(sorted);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Recompute Merkle Root when selection changes ───────────────────────
  useEffect(() => {
    const txs = mempool.filter((_, i) => selectedTx.has(i));
    if (!txs.length) { setMerkleRoot(""); return; }
    buildMerkleRoot(txs).then(setMerkleRoot);
  }, [selectedTx, mempool]);

  // ── Block data string for hashing ─────────────────────────────────────
  const getBlockString = (n) => {
    const txs = mempool.filter((_, i) => selectedTx.has(i));
    return JSON.stringify({
      index: blockIndex,
      prevHash,
      merkleRoot,
      miner: minerAddr,
      txCount: txs.length + 1, // +1 for coinbase
      nonce: n,
    });
  };

  // ── PoW Simulation ─────────────────────────────────────────────────────
  const startMining = useCallback(async () => {
    miningRef.current = true;
    setStatus("mining");
    setResult(null);
    setBackendResult(null);
    setBackendLoading(false);
    const target = "0".repeat(difficulty);
    let n = 0;
    startRef.current = performance.now();

    const mine = async () => {
      while (miningRef.current) {
        const raw = getBlockString(n);
        const h = await sha256(raw);
        setNonce(n);
        setCurrentHash(h);
        setElapsed(Math.round((performance.now() - startRef.current) / 100) / 10);

        if (h.startsWith(target)) {
          const t = Math.round((performance.now() - startRef.current) / 10) / 100;
          miningRef.current = false;
          setStatus("found");
          const foundResult = { nonce: n, hash: h, elapsed: t, hashRate: Math.round(n / t) };
          setResult(foundResult);

          // Save candidate block to sessionStorage for Consensus page
          const candidateBlock = {
            index:      blockIndex,
            prevHash,
            merkleRoot,
            nonce:      n,
            hash:       h,
            minerAddr,
            difficulty,
            txCount:    selectedTx.size,
            reward:     REWARD,
            timestamp:  new Date().toISOString(),
            // Store selected transactions
            transactions: mempool.filter((_, i) => selectedTx.has(i)),
          };
          sessionStorage.setItem("pendingBlock", JSON.stringify(candidateBlock));
          showToast("⛏️ Nonce trouvé ! Allez dans l'onglet Consensus pour valider le bloc.");
          return;
        }
        n++;
        if (n % 500 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      setStatus("stopped");
    };
    mine();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, blockIndex, prevHash, merkleRoot, minerAddr, selectedTx, mempool]);

  const stopMining = () => { miningRef.current = false; setStatus("stopped"); };
  const reset = () => {
    miningRef.current = false;
    setStatus("idle");
    setNonce(0); setCurrentHash(""); setElapsed(0); setResult(null); setBackendResult(null);
  };



  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyText = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleTx = (i) => setSelectedTx(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const selectAllTx = () => setSelectedTx(new Set(mempool.map((_, i) => i)));

  const selectedTxList = mempool.filter((_, i) => selectedTx.has(i));
  const totalFees = selectedTxList.reduce((s, t) => s + (t.fees ?? t.frais ?? 0), 0);

  const statusStyle = {
    idle:    { color: "var(--text-muted)",    bg: "rgba(100,116,139,0.1)",  border: "rgba(100,116,139,0.3)" },
    mining:  { color: "var(--accent-yellow)", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)"  },
    found:   { color: "var(--accent-green)",  bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)" },
    stopped: { color: "var(--accent-red)",    bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)"  },
  };
  const ss = statusStyle[status];

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #10b981 0%, #22d3ee 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
          <Pickaxe size={26} color="white" />
        </div>
        <div>
          <h1 className="page-title">Mining — Proof of Work</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Construire un bloc candidat, miner le nonce, valider la chaîne</p>
        </div>
        <button onClick={fetchData} className="btn-secondary" style={{ marginLeft: "auto", padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* 1. Coinbase Transaction */}
          <div className="glass-card" style={{ padding: "1.5rem", borderColor: "rgba(245,158,11,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
              <Coins size={16} style={{ color: "var(--accent-yellow)" }} />
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>Transaction Coinbase</h2>
              <span className="badge badge-yellow" style={{ fontSize: "0.6rem" }}>Récompense du Mineur</span>
            </div>

            <div style={{ marginBottom: "0.85rem" }}>
              <label className="input-label">Wallet du Mineur (destinataire de la récompense)</label>
              <div style={{ position: "relative", marginTop: "0.4rem" }}>
                <select className="input-field" value={minerAddr} onChange={e => setMinerAddr(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: "2.5rem" }}>
                  <option value="">— Aucun mineur (pas de récompense) —</option>
                  {wallets.map(w => <option key={w.address} value={w.address}>{w.label || w.nom} — {(w.balance || 0).toFixed(4)} BTC</option>)}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-sm)", padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Récompense bloc</span>
                <span style={{ fontWeight: 800, color: "var(--accent-yellow)" }}>{REWARD} BTC</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Frais des tx incluses</span>
                <span style={{ fontWeight: 700, color: "var(--accent-green)" }}>+{totalFees.toFixed(4)} BTC</span>
              </div>
              <div style={{ height: 1, background: "var(--glass-border)", margin: "0.5rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Total mineur</span>
                <span style={{ fontWeight: 900, color: "var(--accent-yellow)", fontSize: "1rem" }}>{(REWARD + totalFees).toFixed(4)} BTC</span>
              </div>
            </div>
          </div>

          {/* 2. Select transactions from mempool */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Database size={15} style={{ color: "var(--accent-cyan)" }} />
                <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                  Transactions du Mempool
                </h2>
                <span className="badge badge-blue" style={{ fontSize: "0.6rem" }}>{selectedTx.size}/{mempool.length} sélectionnées</span>
              </div>
              {mempool.length > 0 && (
                <button onClick={selectAllTx} className="btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.65rem" }}>
                  <CheckSquare size={11} /> Tout
                </button>
              )}
            </div>

            {mempool.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1.5rem 0" }}>
                Aucune transaction dans le mempool.<br/>Créez-en dans l'onglet Mempool.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "220px", overflowY: "auto" }}>
                {mempool.map((tx, i) => {
                  const isSelected = selectedTx.has(i);
                  const txFees = tx.fees ?? tx.frais ?? 0;
                  return (
                    <div key={i} onClick={() => toggleTx(i)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.85rem", borderRadius: "var(--radius-sm)", cursor: "pointer", background: isSelected ? "rgba(99,102,241,0.1)" : "rgba(10,14,26,0.3)", border: `1px solid ${isSelected ? "rgba(99,102,241,0.35)" : "var(--glass-border)"}`, transition: "all 0.2s" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${isSelected ? "var(--accent-blue)" : "var(--glass-border)"}`, background: isSelected ? "var(--accent-blue)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isSelected && <Check size={9} color="white" strokeWidth={3} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {truncate(tx.expediteur || tx.sender, 8)} → {truncate(tx.destinataire || tx.recipient, 8)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--text-primary)" }}>{parseFloat(tx.Quantite ?? tx.quantite ?? tx.amount ?? tx.montant ?? 0).toFixed(4)} BTC</div>
                        <div style={{ fontSize: "0.62rem", color: txFees >= 0.01 ? "var(--accent-green)" : "var(--text-muted)" }}>frais: {parseFloat(txFees).toFixed(4)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Difficulty & Block Config */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "1rem" }}>Configuration PoW</h2>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label className="input-label">Difficulté (zéros requis)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button onClick={() => setDifficulty(d => Math.max(1, d - 1))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}><ChevronDown size={16} /></button>
                  <span style={{ fontWeight: 900, color: difficulty > 4 ? "var(--accent-red)" : difficulty > 2 ? "var(--accent-yellow)" : "var(--accent-green)", fontSize: "1.2rem", minWidth: "1.5rem", textAlign: "center" }}>{difficulty}</span>
                  <button onClick={() => setDifficulty(d => Math.min(6, d + 1))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}><ChevronUp size={16} /></button>
                </div>
              </div>
              <input type="range" min={1} max={6} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent-blue)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                <span>Facile (1)</span><span>Difficile (6)</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="input-label">Index du Bloc</label>
                <input type="number" value={blockIndex} onChange={e => setBlockIndex(Number(e.target.value))} className="input-field" style={{ marginTop: "0.4rem" }} min={0} />
              </div>
              <div>
                <label className="input-label">Hash Précédent</label>
                <input value={prevHash} onChange={e => setPrevHash(e.target.value)} className="input-field mono" style={{ marginTop: "0.4rem", fontSize: "0.55rem" }} placeholder="Hash bloc précédent…" />
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.1rem" }}>
              {status !== "mining" ? (
                <button onClick={startMining} disabled={status === "mining"} className="btn-success" style={{ flex: 1 }}>
                  <Play size={15} /> Démarrer le Minage
                </button>
              ) : (
                <button onClick={stopMining} className="btn-danger" style={{ flex: 1 }}>
                  <Square size={15} /> Arrêter
                </button>
              )}
              <button onClick={reset} className="btn-secondary"><RefreshCw size={14} /></button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Bloc Candidat */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
              <Hash size={15} style={{ color: "var(--accent-blue-light)" }} />
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>Bloc Candidat</h2>
            </div>

            {[
              { key: "Index",         value: `#${blockIndex}` },
              { key: "Previous Hash", value: truncate(prevHash, 14), full: prevHash },
              { key: "Merkle Root",   value: truncate(merkleRoot || "—", 14), full: merkleRoot },
              { key: "Transactions",  value: `${selectedTx.size} + 1 coinbase = ${selectedTx.size + 1} tx` },
              { key: "Difficulté",    value: `${difficulty} zéros` },
              { key: "Nonce (actuel)", value: nonce.toLocaleString() },
              { key: "Hash (actuel)", value: truncate(currentHash || "—", 14), full: currentHash },
            ].map(({ key, value, full }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--glass-border)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{key}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span className={ full ? "mono" : ""} style={{ fontSize: "0.72rem", color: "var(--text-primary)", fontWeight: 700 }}>{value}</span>
                  {full && full !== "—" && (
                    <button onClick={() => copyText(full, key)} style={{ background: "none", border: "none", color: copied === key ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                      {copied === key ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live mining status */}
          <div className="glass-card" style={{ padding: "1.5rem", borderColor: ss.border, background: ss.bg, transition: "all 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>Statut du Minage</h2>
              <span style={{ padding: "0.3rem 0.85rem", borderRadius: 99, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, fontSize: "0.7rem", fontWeight: 700 }}>
                {{ idle: "En attente", mining: "⛏️ Minage…", found: "✅ Trouvé !", stopped: "⏹ Arrêté" }[status]}
              </span>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.1rem" }}>
              {[
                { label: "Nonce actuel", value: nonce.toLocaleString(), icon: <Cpu size={13} /> },
                { label: "Temps écoulé", value: `${elapsed}s`, icon: <Zap size={13} /> },
                { label: "Hash/s", value: elapsed > 0 ? `${Math.round(nonce / elapsed).toLocaleString()}` : "—", icon: <Zap size={13} /> },
                { label: "Difficulté", value: `${difficulty} zéros`, icon: <Pickaxe size={13} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ background: "rgba(10,14,26,0.4)", borderRadius: "var(--radius-sm)", padding: "0.75rem", border: "1px solid var(--glass-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem", color: "var(--text-muted)", fontSize: "0.62rem" }}>
                    {icon} <span>{label}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Current hash */}
            <div>
              <span className="input-label">Hash Actuel</span>
              <div className="mono" style={{ marginTop: "0.4rem", fontSize: "0.6rem", wordBreak: "break-all", lineHeight: 1.9, color: currentHash.startsWith("0".repeat(difficulty)) ? "var(--accent-green)" : "var(--text-muted)", transition: "color 0.3s ease" }}>
                {currentHash || "0".repeat(64)}
              </div>
            </div>

            {/* Mining animation */}
            {status === "mining" && (
              <motion.div style={{ textAlign: "center", marginTop: "1rem" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block", marginBottom: "0.5rem" }}>
                  <Pickaxe size={32} style={{ color: "var(--accent-yellow)" }} />
                </motion.div>
                <p style={{ fontSize: "0.75rem", color: "var(--accent-yellow)", fontWeight: 700 }}>
                  Essayé {nonce.toLocaleString()} nonces — cible : {"0".repeat(difficulty)}…
                </p>
              </motion.div>
            )}
          </div>

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card"
                style={{ padding: "1.5rem", borderColor: "rgba(16,185,129,0.45)", background: "rgba(16,185,129,0.04)" }}>
                <h2 style={{ fontWeight: 800, color: "var(--accent-green)", marginBottom: "1rem", fontSize: "1.05rem" }}>🎉 Bloc Miné !</h2>
                {[
                  { label: "Nonce trouvé", value: result.nonce.toLocaleString() },
                  { label: "Temps", value: `${result.elapsed}s` },
                  { label: "Hash rate", value: `${result.hashRate?.toLocaleString()} H/s` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{label}</span>
                    <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.78rem" }}>{value}</span>
                  </div>
                ))}
                {/* Instruction for Next Step */}
                <div style={{ marginTop: "1rem", padding: "0.85rem", background: "rgba(99,102,241,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--accent-blue-light)", fontWeight: 700, textAlign: "center" }}>
                    ➡️ Le bloc candidat est prêt ! Allez dans l'onglet Consensus pour le faire valider par le réseau.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`toast toast-${toast.type}`}>{toast.msg}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
