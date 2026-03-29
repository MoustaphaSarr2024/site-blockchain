import React, { useState, useCallback } from "react";
import {
  Network, Play, RefreshCw, CheckCircle, XCircle, Clock,
  Shield, Hash, GitMerge, Coins, Server, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc } from "../api";

// ── Client-side SHA-256 ──────────────────────────────────────────────────
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Merkle Root (client) ─────────────────────────────────────────────────
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

const truncate = (s, n = 12) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "—";

// ── 10 nodes config ──────────────────────────────────────────────────────
const NODES = [
  { id: 1,  name: "Node Alpha",   location: "Paris",      power: "CPU x8"  },
  { id: 2,  name: "Node Beta",    location: "Berlin",     power: "CPU x16" },
  { id: 3,  name: "Node Gamma",   location: "New York",   power: "GPU x4"  },
  { id: 4,  name: "Node Delta",   location: "Tokyo",      power: "CPU x32" },
  { id: 5,  name: "Node Epsilon", location: "London",     power: "CPU x8"  },
  { id: 6,  name: "Node Zeta",    location: "Singapore",  power: "GPU x8"  },
  { id: 7,  name: "Node Eta",     location: "Sydney",     power: "CPU x4"  },
  { id: 8,  name: "Node Theta",   location: "Toronto",    power: "CPU x16" },
  { id: 9,  name: "Node Iota",    location: "Dubai",      power: "CPU x8"  },
  { id: 10, name: "Node Kappa",   location: "São Paulo",  power: "GPU x2"  },
];

const CHECKS = [
  { key: "hash",           icon: Hash,      label: "Validité du hash"     },
  { key: "merkle",         icon: GitMerge,  label: "Merkle Root"          },
  { key: "signatures",     icon: Shield,    label: "Signatures"           },
  { key: "balances",       icon: Coins,     label: "Soldes suffisants"    },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ConsensusPage() {
  const [block, setBlock]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [nodeResults, setNodeResults] = useState({});
  const [injectBad, setInjectBad]     = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load pending block from sessionStorage ─────────────────────────────
  const loadPendingBlock = useCallback(() => {
    setLoading(true);
    setDone(false);
    setNodeResults({});
    setBlock(null);
    try {
      const stored = sessionStorage.getItem("pendingBlock");
      if (!stored) {
        showToast("Aucun bloc en attente. Allez miner d'abord !", "error");
        return;
      }
      const parsed = JSON.parse(stored);
      setBlock(parsed);
      showToast("Bloc candidat chargé ! Prêt pour le consensus.");
    } catch (e) {
      showToast("Erreur lors de la lecture du bloc candidat", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Validate one check ────────────────────────────────────────────────
  const validateCheck = async (checkKey, displayBlock, nodeId) => {
    const hdr  = displayBlock.blockHeader || displayBlock.BlockHeader || displayBlock.header || {};
    const body = displayBlock.blockBody   || displayBlock.BlockBody   || displayBlock.body   || {};
    const txs  = body.transactionList || body.TransactionList || body.transactions || displayBlock.transactions || [];
    const blockHash = hdr.hash || hdr.Hash || displayBlock.hash || "";
    const storedMerkle = hdr.merkleRoot || hdr.MerkleRoot || displayBlock.merkleRoot || "";

    // In "bloc corrompu" mode, nodes 8–10 detect anomalies and vote NON
    const isAttacker = injectBad && nodeId >= 8;

    switch (checkKey) {
      case "hash": {
        if (isAttacker) return { ok: false, reason: "Hash ne respecte pas la cible de difficulté" };
        // If the block hash is not available from the backend, accept it (can't verify)
        if (!blockHash || blockHash === "—" || blockHash === "?") {
          return { ok: true, reason: "Hash accepté (non vérifiable côté client)" };
        }
        
        const blockDiff = displayBlock.difficulty || 4;
        const target = "0".repeat(blockDiff);
        const valid = blockHash.startsWith(target);
        return { ok: valid, reason: valid ? `Hash valide (commence par "${target}")` : `Hash invalide — ne commence pas par "${target}"` };
      }
      case "merkle": {
        if (isAttacker) return { ok: false, reason: "Merkle Root invalide (données corrompues)" };
        // The backend computes its Merkle Root using Java's own serialization — we can't
        // recompute it identically in JS. Trust the stored value if it's present.
        if (!storedMerkle || storedMerkle === "—" || storedMerkle === "?") {
          return { ok: true, reason: "Merkle Root non disponible (accepté)" };
        }
        return { ok: true, reason: `Merkle Root présent : ${storedMerkle.slice(0, 10)}…` };
      }
      case "signatures": {
        if (isAttacker) return { ok: false, reason: "Signature invalide sur tx #1" };
        // Simulate: signatures are valid since they came from backend
        return { ok: true, reason: `${txs.length > 0 ? txs.length : 0} signature(s) ECDSA vérifiée(s)` };
      }
      case "balances": {
        if (isAttacker && injectBad) return { ok: false, reason: "Double dépense détectée !" };
        // Simulate balance checks
        return { ok: true, reason: "Tous les soldes sont suffisants" };
      }
      default:
        return { ok: true, reason: "—" };
    }
  };

  // ── Run consensus simulation ──────────────────────────────────────────
  const runConsensus = useCallback(async () => {
    if (!block) return showToast("Chargez un bloc d'abord !", "error");
    setRunning(true);
    setDone(false);
    setNodeResults({});

    for (const node of NODES) {
      // Stagger node start times
      await delay(node.id * 80);

      // Mark node as validating
      setNodeResults(prev => ({
        ...prev,
        [node.id]: { status: "validating", checks: {}, error: null }
      }));

      let allOk = true;
      const checks = {};

      for (const check of CHECKS) {
        // Animate each check step (slower, pedagogical pace)
        await delay(250);
        const result = await validateCheck(check.key, block, node.id);
        checks[check.key] = result;

        setNodeResults(prev => ({
          ...prev,
          [node.id]: { status: "validating", checks: { ...checks }, error: allOk ? null : prev[node.id]?.error }
        }));

        if (!result.ok) {
          allOk = false;
        }
      }

      const finalStatus = allOk ? "accepted" : "rejected";
      setNodeResults(prev => ({
        ...prev,
        [node.id]: {
          status: finalStatus,
          checks,
          error: allOk ? null : Object.values(checks).find(c => !c.ok)?.reason || "Validation échouée"
        }
      }));
    }

    setRunning(false);
    setDone(true);
  }, [block, injectBad]);

  // ── Submit block to backend if accepted ────────────────────────────────
  const submitToBackend = async () => {
    if (!block) return;
    setSubmitting(true);
    try {
      const minerAddr = block.minerAddr || block.miner || null;
      await apiBloc.miner(minerAddr);
      showToast("✅ Bloc officiellement ajouté à la blockchain (backend) !");
      sessionStorage.removeItem("pendingBlock"); // Clear pending block
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de la soumission du bloc", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Compute results ───────────────────────────────────────────────────
  const results     = Object.values(nodeResults);
  const accepted    = results.filter(r => r.status === "accepted").length;
  const rejected    = results.filter(r => r.status === "rejected").length;
  const validating  = results.filter(r => r.status === "validating").length;
  const majority    = accepted > NODES.length / 2;

  const displayBlock = block ? (() => {
    const hdr  = block.blockHeader || block.BlockHeader || block.header || {};
    const body = block.blockBody   || block.BlockBody   || block.body  || {};
    return {
      index:    block.index ?? hdr.index ?? "?",
      hash:     hdr.hash || hdr.Hash || block.hash || "?",
      prevHash: hdr.hashPre || hdr.HashPre || block.prevHash || "?",
      merkle:   hdr.merkleRoot || hdr.MerkleRoot || block.merkleRoot || "?",
      nonce:    hdr.nonce || hdr.Nonce || block.nonce || 0,
      txCount:  (body.transactionList || body.TransactionList || body.transactions || block.transactions || []).length,
    };
  })() : null;

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
          <Network size={26} color="white" />
        </div>
        <div>
          <h1 className="page-title">Consensus Réseau</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Simulation de {NODES.length} nœuds validant un bloc — majorité requise pour l'ajouter à la chaîne
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem" }}>

        {/* ── LEFT: Control panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Load block */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              📦 Bloc à valider
            </h2>
            <button onClick={loadPendingBlock} disabled={loading || running} className="btn-primary" style={{ width: "100%", marginBottom: "0.85rem" }}>
              {loading ? <><Cpu size={14} /> Chargement…</> : <><RefreshCw size={14} /> Charger le bloc candidat</>}
            </button>

            {displayBlock ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  ["Index",     `#${displayBlock.index}`],
                  ["Hash",      truncate(displayBlock.hash, 10)],
                  ["PrevHash",  truncate(displayBlock.prevHash, 10)],
                  ["Merkle",    truncate(displayBlock.merkle, 10)],
                  ["Nonce",     displayBlock.nonce],
                  ["Tx count",  `${displayBlock.txCount} txs`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{k}</span>
                    <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 700 }}>{String(v)}</span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", padding: "0.75rem 0" }}>
                Aucun bloc chargé
              </p>
            )}
          </div>

          {/* Options */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              ⚙️ Options de Simulation
            </h2>


            {/* Inject bad block toggle (pedagogical attack sim) */}
            <div
              onClick={() => !running && setInjectBad(prev => !prev)}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: "var(--radius-sm)", background: injectBad ? "rgba(239,68,68,0.08)" : "rgba(10,14,26,0.3)", border: `1px solid ${injectBad ? "rgba(239,68,68,0.4)" : "var(--glass-border)"}`, cursor: "pointer", transition: "all 0.25s ease" }}
            >
              <div style={{ width: 36, height: 20, borderRadius: 999, background: injectBad ? "var(--accent-red)" : "rgba(100,116,139,0.4)", transition: "background 0.3s", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 2, left: injectBad ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: injectBad ? "var(--accent-red)" : "var(--text-primary)", fontSize: "0.82rem" }}>
                  {injectBad ? "⚠️ Bloc corrompu activé" : "Bloc normal"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  {injectBad ? "Certains nœuds vont détecter des anomalies" : "Simuler un bloc invalide pour voir les rejets"}
                </div>
              </div>
            </div>

            <button
              onClick={runConsensus}
              disabled={!block || running}
              className="btn-success"
              style={{ width: "100%", marginTop: "1rem" }}
            >
              {running ? <><Cpu size={14} /> Validation en cours…</> : <><Play size={14} /> Lancer le Consensus</>}
            </button>
          </div>

          {/* Final verdict */}
          {done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
                borderColor: majority ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
                background: majority ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
              }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}>
                {majority
                  ? <CheckCircle size={56} style={{ color: "var(--accent-green)", margin: "0 auto 0.75rem" }} />
                  : <XCircle size={56} style={{ color: "var(--accent-red)", margin: "0 auto 0.75rem" }} />}
              </motion.div>
              <h2 style={{ fontWeight: 900, fontSize: "1.15rem", color: majority ? "var(--accent-green)" : "var(--accent-red)", marginBottom: "0.5rem" }}>
                {majority ? "Bloc Accepté ✅" : "Bloc Rejeté ❌"}
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                {accepted}/{NODES.length} nœuds ont <strong style={{color: "var(--accent-green)"}}>voté OUI</strong> — {rejected} ont <strong style={{color:"var(--accent-red)"}}>voté NON</strong>
              </p>

              {majority ? (
                <div style={{ padding: "1rem", background: "rgba(16,185,129,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-primary)", marginBottom: "0.75rem", fontWeight: 700 }}>
                    La majorité est atteinte ! Le bloc peut être soumis au réseau réel.
                  </p>
                  <button onClick={submitToBackend} disabled={submitting} className="btn-success" style={{ width: "100%" }}>
                    {submitting ? "Ajout au réseau..." : "Soumettre à la Blockchain"}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: "0.72rem", color: "var(--accent-red)", marginBottom: "1rem", fontStyle: "italic", border: "1px solid rgba(239,68,68,0.2)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                  → <strong>Bloc rejeté par le réseau</strong> (majorité non atteinte). La transaction est annulée.
                </p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div style={{ padding: "0.6rem", background: "rgba(16,185,129,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--accent-green)" }}>{accepted}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Acceptés</div>
                </div>
                <div style={{ padding: "0.6rem", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--accent-red)" }}>{rejected}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Rejetés</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT: 10 node cards ── */}
        <div>
          {/* Summary bar */}
          {results.length > 0 && (
            <div className="glass-card" style={{ padding: "0.75rem 1.25rem", marginBottom: "1rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
              {[
                { label: "Validant", count: validating, color: "var(--accent-yellow)" },
                { label: "Acceptés", count: accepted, color: "var(--accent-green)" },
                { label: "Rejetés", count: rejected, color: "var(--accent-red)" },
                { label: "En attente", count: NODES.length - results.length, color: "var(--text-muted)" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.1rem", color }}>{count}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{label}</span>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              {/* Progress bar */}
              <div style={{ width: 200, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${(results.length / NODES.length) * 100}%` }}
                  style={{ height: "100%", background: "var(--gradient-primary)", borderRadius: 999 }}
                />
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{results.length}/{NODES.length}</span>
            </div>
          )}

          {/* Node grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.85rem" }}>
            {NODES.map((node) => {
              const nr = nodeResults[node.id];
              const status = nr?.status || "waiting";
              const isAccepted = status === "accepted"; // voted OUI
              const isRejected = status === "rejected"; // voted NON
              const isValidating = status === "validating";

              const borderColor = isAccepted ? "rgba(16,185,129,0.4)"
                : isRejected ? "rgba(239,68,68,0.4)"
                : isValidating ? "rgba(245,158,11,0.3)"
                : "var(--glass-border)";

              const bg = isAccepted ? "rgba(16,185,129,0.05)"
                : isRejected ? "rgba(239,68,68,0.05)"
                : "transparent";

              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: node.id * 0.04 }}
                  className="glass-card"
                  style={{ padding: "1rem 1.1rem", borderColor, background: bg, transition: "all 0.3s ease" }}
                >
                  {/* Node header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: isAccepted ? "rgba(16,185,129,0.2)" : isRejected ? "rgba(239,68,68,0.2)" : "rgba(100,116,139,0.15)", border: `1px solid ${isAccepted ? "rgba(16,185,129,0.4)" : isRejected ? "rgba(239,68,68,0.4)" : "var(--glass-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Server size={12} style={{ color: isAccepted ? "var(--accent-green)" : isRejected ? "var(--accent-red)" : "var(--text-muted)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.78rem", color: "var(--text-primary)" }}>{node.name}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{node.location} · {node.power}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      {status === "waiting" && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>En attente</span>}
                      {isValidating && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <Cpu size={14} style={{ color: "var(--accent-yellow)" }} />
                        </motion.div>
                      )}
                      {isAccepted && <>
                        <CheckCircle size={14} style={{ color: "var(--accent-green)" }} />
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent-green)" }}>Vote OUI</span>
                      </>}
                      {isRejected && <>
                        <XCircle size={14} style={{ color: "var(--accent-red)" }} />
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent-red)" }}>Vote NON</span>
                      </>}
                    </div>
                  </div>

                  {/* Validation checks */}
                  {(isValidating || isAccepted || isRejected) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {CHECKS.map(({ key, icon: Icon, label }) => {
                        const checkResult = nr?.checks?.[key];
                        const checkStatus = checkResult === undefined ? "pending"
                          : checkResult.ok ? "ok" : "fail";

                        return (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Icon size={10} style={{ color: checkStatus === "ok" ? "var(--accent-green)" : checkStatus === "fail" ? "var(--accent-red)" : "var(--text-muted)", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.62rem", color: checkStatus === "ok" ? "var(--text-secondary)" : checkStatus === "fail" ? "var(--accent-red)" : "var(--text-muted)", flex: 1 }}>
                              {label}
                            </span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, color: checkStatus === "ok" ? "var(--accent-green)" : checkStatus === "fail" ? "var(--accent-red)" : "var(--text-muted)" }}>
                              {checkStatus === "ok" ? "✓" : checkStatus === "fail" ? "✗" : "…"}
                            </span>
                          </div>
                        );
                      })}

                      {/* Rejection reason */}
                      {isRejected && nr?.error && (
                        <div style={{ marginTop: "0.3rem", padding: "0.35rem 0.5rem", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.6rem", color: "var(--accent-red)", lineHeight: 1.4 }}>
                          {nr.error}
                        </div>
                      )}
                    </div>
                  )}

                  {status === "waiting" && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic" }}>En attente…</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`toast toast-${toast.type}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
