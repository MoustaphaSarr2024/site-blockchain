import React, { useState, useEffect, useCallback } from "react";
import { Server, RefreshCw, Copy, Check, Search, ChevronDown, ChevronRight, Trash2, Save, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc } from "../api";

const truncate = (s, n = 14) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "—";

export default function InternalsPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState(null);

  const fetchChain = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiBloc.getBlockchain();
      setBlocks(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChain(); }, [fetchChain]);

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  // Extract fields from different possible block structures
  const parseBlock = (block, fallbackIdx) => {
    const hdr = block.blockHeader || block.BlockHeader || block.header || {};
    const body = block.blockBody   || block.BlockBody   || block.body  || {};
    const txs = body.transactionList || body.TransactionList || body.transactions || block.transactions || [];
    const cb  = body.coinBaseTrans    || body.CoinBaseTrans   || body.coinbase    || block.coinbase || null;

    return {
      index:     block.index ?? hdr.index ?? fallbackIdx,
      prevHash:  hdr.hashPre || hdr.HashPre || hdr.prevHash || block.prevHash || "0".repeat(64),
      hash:      hdr.hash    || hdr.Hash    || block.hash   || "—",
      merkleRoot: hdr.merkleRoot || hdr.MerkleRoot || block.merkleRoot || "—",
      nonce:     hdr.nonce   || hdr.Nonce   || block.nonce  || 0,
      timestamp: hdr.timeStamp || hdr.TimeStamp || block.timestamp || "—",
      target:    hdr.target  || hdr.Target  || block.target || "—",
      txCount:   txs.length + (cb ? 1 : 0),
      transactions: txs,
      coinbase: cb,
      raw: block,
    };
  };

  const filtered = blocks
    .map((b, i) => parseBlock(b, i))
    .filter(b => {
      const q = search.toLowerCase();
      return !q || String(b.index).includes(q) || (b.hash || "").toLowerCase().includes(q) || (b.prevHash || "").toLowerCase().includes(q);
    });

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #64748b 0%, #334155 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(100,116,139,0.3)" }}>
            <Server size={26} color="white" />
          </div>
          <div>
            <h1 className="page-title">Chain Internals</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Données brutes complètes de chaque bloc</p>
          </div>
        </div>
        <button onClick={fetchChain} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <Search size={14} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input-field" placeholder="Rechercher par index, hash…" style={{ paddingLeft: "2.4rem" }} />
      </div>

      {/* Stats */}
      <div className="glass-card" style={{ padding: "0.9rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "2rem" }}>
        <div><span className="input-label">Longueur de la chaîne</span> <strong style={{ color: "var(--text-primary)" }}>{blocks.length} blocs</strong></div>
        <div><span className="input-label">Transactions totales</span> <strong style={{ color: "var(--text-primary)" }}>{filtered.reduce((s, b) => s + (b.transactions?.length || 0), 0)}</strong></div>
        <div><span className="input-label">Blocs affichés</span> <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong></div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Chargement de la blockchain…</div>
      ) : blocks.length === 0 ? (
        <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          <Server size={48} style={{ margin: "0 auto 1rem", opacity: 0.25 }} />
          <p style={{ fontWeight: 700, marginBottom: "0.4rem" }}>Aucun bloc dans la chaîne</p>
          <p style={{ fontSize: "0.78rem" }}>Minez des blocs dans l'onglet Mining pour les voir apparaître ici.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((block, displayIdx) => (
            <motion.div key={block.index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: displayIdx * 0.04 }} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Block header row */}
              <div
                onClick={() => toggleExpand(block.index)}
                style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: block.index === 0 ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontWeight: 900, fontSize: "0.75rem", color: block.index === 0 ? "white" : "var(--accent-blue-light)" }}>#{block.index}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: "0.68rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {truncate(block.hash, 16)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {block.txCount} transaction{block.txCount !== 1 ? "s" : ""} &nbsp;·&nbsp; nonce: {block.nonce}
                    {block.index === 0 && <span className="badge badge-yellow" style={{ marginLeft: "0.5rem", fontSize: "0.58rem" }}>GENESIS</span>}
                  </div>
                </div>
                <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  {expanded[block.index] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>

              {/* Expanded raw data */}
              <AnimatePresence>
                {expanded[block.index] && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ borderTop: "1px solid var(--glass-border)", padding: "1.25rem" }}>
                      {/* Fields table */}
                      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "0.5rem 1rem", marginBottom: "1rem" }}>
                        {[
                          { key: "Index",        value: block.index     },
                          { key: "Timestamp",    value: block.timestamp },
                          { key: "Nonce",        value: block.nonce     },
                          { key: "Target",       value: block.target    },
                          { key: "Hash",         value: block.hash, mono: true, copyKey: `hash-${block.index}` },
                          { key: "Previous Hash",value: block.prevHash, mono: true, copyKey: `prev-${block.index}` },
                          { key: "Merkle Root",  value: block.merkleRoot, mono: true, copyKey: `mr-${block.index}` },
                        ].map(({ key, value, mono, copyKey }) => (
                          <React.Fragment key={key}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", alignSelf: "start", paddingTop: "0.15rem" }}>{key}</span>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                              <span className={mono ? "mono" : ""} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", wordBreak: "break-all", lineHeight: 1.7 }}>
                                {String(value ?? "—")}
                              </span>
                              {copyKey && value && value !== "—" && (
                                <button onClick={() => copy(String(value), copyKey)} style={{ background: "none", border: "none", color: copied === copyKey ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                                  {copied === copyKey ? <Check size={11} /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Coinbase */}
                      {block.coinbase && (
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-yellow)", marginBottom: "0.4rem" }}>Coinbase Transaction</div>
                          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-sm)", padding: "0.65rem 0.85rem" }}>
                            <pre style={{ margin: 0, fontSize: "0.6rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                              {JSON.stringify(block.coinbase, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Transactions */}
                      {block.transactions && block.transactions.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-blue-light)", marginBottom: "0.4rem" }}>
                            Transactions ({block.transactions.length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {block.transactions.map((tx, ti) => (
                              <div key={ti} style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius-sm)", padding: "0.65rem 0.85rem" }}>
                                <pre style={{ margin: 0, fontSize: "0.6rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                  {JSON.stringify(tx, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Persistence Zone */}
      <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <p style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 700, textAlign: "center" }}>
          Persistance des données
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", maxWidth: "400px", lineHeight: "1.5" }}>
          Vous pouvez sauvegarder l'état actuel de la blockchain dans un fichier local sur le serveur, et le recharger plus tard.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button 
            onClick={async () => {
               try {
                 await apiBloc.saveBlockchain();
                 alert("Blockchain sauvegardée avec succès sur le serveur !");
               } catch (err) {
                 alert("Erreur lors de la sauvegarde : " + (err.response?.data?.error || err.message));
               }
            }}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem" }}
          >
            <Save size={16} />
            Sauvegarder
          </button>

          <button 
            onClick={async () => {
              if(window.confirm("Ceci remplacera la blockchain actuelle par la dernière sauvegarde. Continuer ?")) {
                 try {
                   await apiBloc.loadBlockchain();
                   alert("Blockchain chargée avec succès depuis le serveur !");
                   fetchChain();
                 } catch (err) {
                   alert("Erreur lors du chargement (le fichier n'existe peut-être pas) : " + (err.response?.data?.error || err.message));
                 }
              }
            }}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem" }}
          >
            <Download size={16} />
            Charger
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Button at the bottom */}
      <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
          Zone de danger : Cette action supprimera tous les blocs et transactions de la mémoire du serveur.
        </p>
        <button 
          onClick={async () => {
            if(window.confirm("Voulez-vous vraiment vider toute la blockchain et le mempool ? Cette action est irréversible.")) {
               try {
                 await apiBloc.resetBlockchain();
                 alert("Blockchain réinitialisée avec succès !");
                 fetchChain();
               } catch (err) {
                 alert("Erreur lors de la réinitialisation : " + err.message);
               }
            }
          }}
          className="btn-primary"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--accent-red)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <Trash2 size={16} />
          Vider la Blockchain
        </button>
      </div>
    </div>
  );
}
