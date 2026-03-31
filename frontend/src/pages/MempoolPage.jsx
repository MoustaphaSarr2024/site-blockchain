import React, { useState, useEffect, useCallback } from "react";
import {
  Layers, Plus, Trash2, Send, RefreshCw, ArrowUpDown,
  CheckSquare, Square, Hash, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc, apiWallet } from "../api";

// ── Client-side SHA-256 ───────────────────────────────────────────────────
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Simple Merkle Root from list of data strings ──────────────────────────
async function buildMerkleRoot(items) {
  if (!items.length) return "0".repeat(64);
  let layer = await Promise.all(items.map((item) => sha256(JSON.stringify(item))));
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left  = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
      next.push(await sha256(left + right));
    }
    layer = next;
  }
  return layer[0];
}

const truncate = (s, n = 10) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "";

export default function MempoolPage() {
  const [mempool, setMempool]     = useState([]);
  const [accounts, setAccounts]   = useState([]);
  const [selected, setSelected]   = useState(new Set());
  const [merkleRoot, setMerkleRoot] = useState("");
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);

  // Create tx form
  const [sender, setSender]       = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount]       = useState("0.5");
  const [fees, setFees]           = useState("0.01");
  const [showForm, setShowForm]   = useState(true);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch data ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [mRes, wRes] = await Promise.all([
        apiBloc.getMempool(),
        apiWallet.getAll(),
      ]);
      // Sort by fees descending — Fees field may be capitalized (Java PascalCase) or lowercased (Jackson getter)
      const sorted = (mRes.data || []).sort((a, b) => (b.Fees ?? b.fees ?? b.frais ?? 0) - (a.Fees ?? a.fees ?? a.frais ?? 0));
      setMempool(sorted);
      setAccounts(wRes.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Recompute Merkle Root when selection changes ───────────────────────
  useEffect(() => {
    const selectedTxs = mempool.filter((_, i) => selected.has(i));
    if (!selectedTxs.length) { setMerkleRoot(""); return; }
    buildMerkleRoot(selectedTxs).then(setMerkleRoot);
  }, [selected, mempool]);

  // ── Toggle selection ──────────────────────────────────────────────────
  const toggleSelect = (i) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(mempool.map((_, i) => i)));
  const clearSelection = () => setSelected(new Set());

  // ── Create transaction ────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!sender || !recipient || !amount) return showToast("Remplissez tous les champs", "error");
    setLoading(true);
    try {
      await apiWallet.send(sender, recipient, parseFloat(amount), parseFloat(fees) || 0);
      showToast("Transaction ajoutée au mempool !");
      setSender(""); setRecipient(""); setAmount("0.5"); setFees("0.01");
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur envoi", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete transaction ─────────────────────────────────────────────────
  const handleDelete = async (tx, idx) => {
    try {
      await apiBloc.deleteFromMempool(tx.id || tx.txId || idx);
      showToast("Transaction supprimée");
      setSelected((prev) => { const n = new Set(prev); n.delete(idx); return n; });
      await fetchAll();
    } catch (err) {
      // Fallback: clear all then re-add if no individual delete
      showToast(err.response?.data?.error || "Erreur suppression", "error");
    }
  };

  // ── Clear mempool ──────────────────────────────────────────────────────
  const handleClear = async () => {
    try {
      await apiBloc.clearMempool();
      clearSelection();
      await fetchAll();
      showToast("Mempool vidé");
    } catch (err) {
      showToast("Erreur suppression", "error");
    }
  };

  const feeColor = (f) => f >= 0.05 ? "var(--accent-green)" : f >= 0.01 ? "var(--accent-yellow)" : "var(--text-muted)";

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(34,211,238,0.35)" }}>
            <Layers size={26} color="white" />
          </div>
          <div>
            <h1 className="page-title">Mempool</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Transactions en attente — triées par frais décroissants</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={fetchAll} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
            <RefreshCw size={13} /> Actualiser
          </button>
          {mempool.length > 0 && (
            <button onClick={handleClear} className="btn-secondary" style={{ color: "var(--accent-red)", borderColor: "rgba(239,68,68,0.3)", padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
              <Trash2 size={13} /> Vider
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem" }}>
        {/* ── Left: Create tx form ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem", cursor: "pointer" }} onClick={() => setShowForm(!showForm)}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus size={16} style={{ color: "var(--accent-cyan)" }} /> Créer une Transaction
              </h2>
              <ChevronDown size={16} style={{ transform: showForm ? "rotate(180deg)" : "none", transition: "0.2s", color: "var(--text-muted)" }} />
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }} onSubmit={handleCreate}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    {/* Sender */}
                    <div>
                      <label className="input-label">Expéditeur</label>
                      <div style={{ position: "relative", marginTop: "0.4rem" }}>
                        <select className="input-field" value={sender} onChange={e => setSender(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: "2rem" }}>
                          <option value="">— Sélectionner un compte —</option>
                          {accounts.map(a => <option key={a.address} value={a.address}>{a.label || a.nom} ({(a.balance || 0).toFixed(4)} BTC)</option>)}
                        </select>
                        <ChevronDown size={12} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                      </div>
                      <input value={sender} onChange={e => setSender(e.target.value)} className="input-field mono" style={{ marginTop: "0.4rem", fontSize: "0.7rem" }} placeholder="ou adresse manuelle…" />
                    </div>

                    {/* Recipient */}
                    <div>
                      <label className="input-label">Destinataire</label>
                      <div style={{ position: "relative", marginTop: "0.4rem" }}>
                        <select className="input-field" value={recipient} onChange={e => setRecipient(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: "2rem" }}>
                          <option value="">— Sélectionner un compte —</option>
                          {accounts.filter(a => a.address !== sender).map(a => <option key={a.address} value={a.address}>{a.label || a.nom}</option>)}
                        </select>
                        <ChevronDown size={12} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                      </div>
                      <input value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field mono" style={{ marginTop: "0.4rem", fontSize: "0.7rem" }} placeholder="ou adresse manuelle…" />
                    </div>

                    {/* Amount + Fees */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label className="input-label">Montant (BTC)</label>
                        <input type="number" step="0.0001" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" style={{ marginTop: "0.4rem" }} />
                      </div>
                      <div>
                        <label className="input-label">Frais (BTC)</label>
                        <input type="number" step="0.0001" min="0" value={fees} onChange={e => setFees(e.target.value)} className="input-field" style={{ marginTop: "0.4rem" }} />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%" }}>
                      <Send size={14} /> {loading ? "Envoi…" : "Ajouter au Mempool"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Merkle Root preview */}
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "1.25rem", borderColor: "rgba(99,102,241,0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Hash size={15} style={{ color: "var(--accent-blue-light)" }} />
                <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>Merkle Root</span>
                <span className="badge badge-blue" style={{ fontSize: "0.6rem" }}>{selected.size} tx sélectionnées</span>
              </div>
              <div className="mono" style={{ fontSize: "0.6rem", wordBreak: "break-all", color: "var(--accent-blue-light)", lineHeight: 1.9, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", padding: "0.6rem" }}>
                {merkleRoot || "Calcul…"}
              </div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.6rem", lineHeight: 1.5 }}>
                Ce Merkle Root résume les {selected.size} transaction(s) sélectionnée(s). Il sera inclus dans le bloc candidat lors du minage.
              </p>
            </motion.div>
          )}
        </div>

        {/* ── Right: Mempool list ── */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                Transactions en attente
                {mempool.length > 0 && <span className="badge badge-blue" style={{ marginLeft: "0.5rem", fontSize: "0.65rem" }}>{mempool.length}</span>}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                <ArrowUpDown size={11} /> Triées par frais
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={selectAll} className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem" }}>
                <CheckSquare size={11} /> Tout sélectionner
              </button>
              {selected.size > 0 && (
                <button onClick={clearSelection} className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem" }}>
                  <Square size={11} /> Désélectionner
                </button>
              )}
            </div>
          </div>

          {mempool.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Layers size={48} style={{ margin: "0 auto 1rem", opacity: 0.25 }} />
              <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.4rem" }}>Mempool vide</p>
              <p style={{ fontSize: "0.78rem" }}>Créez une transaction pour la voir apparaître ici.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(10,14,26,0.4)" }}>
                    {["", "#", "Expéditeur", "Destinataire", "Montant", "Frais", ""].map((h, i) => (
                      <th key={i} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {mempool.map((tx, idx) => {
                      const isSelected = selected.has(idx);
                      const txFees   = tx.Fees   ?? tx.fees   ?? tx.frais   ?? 0;
                      const txAmount = tx.Quantite ?? tx.quantite ?? tx.amount ?? tx.montant ?? 0;
                      const txFrom   = tx.Expediteur || tx.expediteur || tx.sender || tx.from || "";
                      const txTo     = tx.Destinataire || tx.destinataire || tx.recipient || tx.to || "";
                      return (
                        <motion.tr
                          key={tx.id || tx.txId || idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => toggleSelect(idx)}
                          style={{
                            cursor: "pointer",
                            borderBottom: "1px solid var(--glass-border)",
                            background: isSelected ? "rgba(99,102,241,0.07)" : "transparent",
                            transition: "background 0.2s ease",
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "0.75rem 0.75rem 0.75rem 1.25rem", width: 20 }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSelected ? "var(--accent-blue)" : "var(--glass-border)"}`, background: isSelected ? "var(--accent-blue)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isSelected && <span style={{ color: "white", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                            </div>
                          </td>
                          {/* Index */}
                          <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700 }}>
                            #{idx + 1}
                          </td>
                          {/* Sender */}
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <div className="mono" style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{truncate(txFrom, 8)}</div>
                          </td>
                          {/* Recipient */}
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <div className="mono" style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{truncate(txTo, 8)}</div>
                          </td>
                          {/* Amount */}
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.82rem" }}>{parseFloat(txAmount).toFixed(4)}</span>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>BTC</span>
                          </td>
                          {/* Fees */}
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={{ fontWeight: 700, color: feeColor(txFees), fontSize: "0.8rem" }}>{parseFloat(txFees).toFixed(4)}</span>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>BTC</span>
                          </td>
                          {/* Delete */}
                          <td style={{ padding: "0.75rem 1rem" }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleDelete(tx, idx)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.3rem" }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
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
