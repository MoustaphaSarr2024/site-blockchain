import React, { useState, useEffect, useCallback } from "react";
import { Send, Zap, Trash2, ArrowRight, RefreshCw, ChevronDown, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiWallet, apiBloc } from "../api";

export default function TransactionPage() {
  const [wallets, setWallets] = useState([]);
  const [mempool, setMempool] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [montant, setMontant] = useState("");
  const [fees, setFees] = useState("0.0001");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [wRes, mRes] = await Promise.all([apiWallet.getAll(), apiBloc.getMempool()]);
      setWallets(wRes.data);
      if (wRes.data.length > 0 && !selectedAddress) setSelectedAddress(wRes.data[0].address);
      setMempool(mRes.data);
    } catch (e) {
      console.error(e);
    }
  }, [selectedAddress]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => apiBloc.getMempool().then((r) => setMempool(r.data)).catch(() => {}), 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedAddress) return showToast("Sélectionnez un wallet", "error");
    if (!destinataire.trim()) return showToast("Entrez une adresse destinataire", "error");
    if (!montant || parseFloat(montant) <= 0) return showToast("Entrez un montant valide", "error");

    setLoading(true);
    try {
      await apiWallet.send(selectedAddress, destinataire.trim(), parseFloat(montant), parseFloat(fees) || 0);
      showToast(`Transaction envoyée au mempool : ${montant} BTC`);
      setMontant("");
      setDestinataire("");
      await apiBloc.getMempool().then((r) => setMempool(r.data)).catch(() => {});
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur d'envoi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTx = async (idx) => {
    try {
      await apiBloc.deleteFromMempool(idx);
      showToast("Transaction supprimée");
      setMempool((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      showToast("Erreur suppression", "error");
    }
  };

  const handleClearMempool = async () => {
    try {
      await apiBloc.clearMempool();
      setMempool([]);
      showToast("Mempool vidé");
    } catch (err) {
      showToast("Erreur", "error");
    }
  };

  const selectedWallet = wallets.find((w) => w.address === selectedAddress);
  const totalFees = mempool.reduce((sum, tx) => sum + (tx.fees || 0), 0);

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(34, 211, 238, 0.4)",
          }}
        >
          <Send size={24} color="white" />
        </div>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Créer, signer et envoyer des transactions au mempool
          </p>
        </div>

        {/* Mempool stats */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "1rem",
          }}
        >
          {[
            { label: "Mempool", value: `${mempool.length} tx` },
            { label: "Fees totaux", value: `${totalFees.toFixed(4)} BTC` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "0.5rem 1rem",
                textAlign: "center",
              }}
            >
              <div className="input-label">{label}</div>
              <div style={{ fontWeight: 800, color: "var(--accent-cyan)", fontSize: "0.95rem" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "1.5rem" }}>
        {/* ── Left: Form ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <form className="glass-card" onSubmit={handleSend} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
              <PlusCircle size={16} style={{ display: "inline", marginRight: "0.5rem", color: "var(--accent-cyan)" }} />
              Nouvelle Transaction
            </h2>

            {/* Sender */}
            <div>
              <label className="input-label">Expéditeur</label>
              <div style={{ position: "relative", marginTop: "0.5rem" }}>
                <select
                  className="input-field"
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  style={{ cursor: "pointer", appearance: "none", paddingRight: "2.5rem" }}
                >
                  <option value="">Choisir un wallet...</option>
                  {wallets.map((w) => (
                    <option key={w.address} value={w.address}>
                      {w.label} — {(w.balance || 0).toFixed(4)} BTC
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              </div>

              {/* Wallet balance */}
              {selectedWallet && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.6rem 0.9rem",
                    background: "rgba(10,14,26,0.4)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Solde disponible</span>
                  <span style={{ fontWeight: 800, color: "var(--accent-yellow)", fontSize: "0.95rem" }}>
                    {(selectedWallet.balance || 0).toFixed(4)} BTC
                  </span>
                </motion.div>
              )}
            </div>

            {/* Destinataire */}
            <div>
              <label className="input-label">Destinataire</label>
              <div style={{ position: "relative", marginTop: "0.5rem" }}>
                <select
                  className="input-field"
                  value={destinataire}
                  onChange={(e) => setDestinataire(e.target.value)}
                  style={{ cursor: "pointer", appearance: "none", paddingRight: "2.5rem", marginBottom: "0.5rem" }}
                >
                  <option value="">— Choisir dans mes wallets —</option>
                  {wallets.filter((w) => w.address !== selectedAddress).map((w) => (
                    <option key={w.address} value={w.address}>
                      {w.label} — {(w.balance || 0).toFixed(4)} BTC
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: "0.9rem", top: "1.1rem", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              </div>
              <input
                value={destinataire}
                onChange={(e) => setDestinataire(e.target.value)}
                className="input-field mono"
                style={{ fontSize: "0.75rem" }}
                placeholder="ou entrez une adresse manuellement..."
              />
            </div>

            {/* Montant + Fees */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="input-label">Montant (BTC)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="input-field"
                  style={{ marginTop: "0.5rem" }}
                  placeholder="0.0000"
                  required
                />
              </div>
              <div>
                <label className="input-label">Frais (BTC)</label>
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="input-field"
                  style={{ marginTop: "0.5rem" }}
                  placeholder="0.0001"
                />
              </div>
            </div>

            {/* Summary */}
            {montant && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  padding: "0.85rem 1rem",
                  background: "rgba(34,211,238,0.06)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.78rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Montant</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{parseFloat(montant).toFixed(4)} BTC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Frais</span>
                  <span style={{ color: "var(--accent-orange)", fontWeight: 700 }}>{parseFloat(fees || 0).toFixed(5)} BTC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--glass-border)", paddingTop: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>Total déduit</span>
                  <span style={{ color: "var(--accent-cyan)", fontWeight: 800 }}>
                    {(parseFloat(montant) + parseFloat(fees || 0)).toFixed(5)} BTC
                  </span>
                </div>
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              <Send size={16} />
              {loading ? "Envoi en cours…" : "Envoyer au Mempool"}
            </button>
          </form>

          {/* Refresh button */}
          <button onClick={fetchData} className="btn-secondary" style={{ alignSelf: "flex-start" }}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {/* ── Right: Mempool ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Zap size={18} style={{ color: "var(--accent-yellow)" }} />
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                Mempool
              </h2>
              <span className="badge badge-yellow">{mempool.length}</span>
            </div>
            {mempool.length > 0 && (
              <button
                onClick={handleClearMempool}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "var(--accent-red)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.35rem 0.85rem",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Trash2 size={12} /> Vider
              </button>
            )}
          </div>

          {mempool.length === 0 ? (
            <div
              className="glass-card"
              style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}
            >
              <Zap size={40} style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p style={{ fontSize: "0.85rem" }}>Aucune transaction en attente</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflow: "auto" }}>
              <AnimatePresence initial={false}>
                {mempool.map((tx, idx) => (
                  <motion.div
                    key={`tx-${idx}`}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                    className="glass-card"
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", borderRadius: "var(--radius-md)" }}
                    onClick={() => setSelectedTx(selectedTx === idx ? null : idx)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "0.3rem", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className="badge badge-yellow" style={{ fontSize: "0.55rem" }}>
                            {tx.signature ? "Signée" : "FAUCET"}
                          </span>
                          <span style={{ fontWeight: 800, color: "var(--accent-yellow)" }}>
                            {(tx.quantite || 0).toFixed(4)} BTC
                          </span>
                          {tx.fees > 0 && (
                            <span style={{ fontSize: "0.65rem", color: "var(--accent-orange)" }}>
                              +{(tx.fees || 0).toFixed(4)} fees
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          <span className="mono">{tx.expediteur?.substring(0, 12)}…</span>
                          <ArrowRight size={10} />
                          <span className="mono">{tx.destinataire?.substring(0, 12)}…</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTx(idx); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", marginLeft: "0.5rem" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {selectedTx === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--glass-border)" }}
                        >
                          {[
                            { label: "FROM", value: tx.expediteur, color: "var(--accent-blue-light)" },
                            { label: "TO", value: tx.destinataire, color: "var(--accent-green)" },
                            { label: "Montant", value: `${(tx.quantite || 0).toFixed(8)} BTC`, color: "var(--accent-yellow)" },
                            { label: "Frais", value: `${(tx.fees || 0).toFixed(8)} BTC`, color: "var(--accent-orange)" },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.4rem", fontSize: "0.72rem", alignItems: "flex-start" }}>
                              <span style={{ color: "var(--text-muted)", fontWeight: 700, width: "60px", flexShrink: 0 }}>{label}</span>
                              <span className="mono" style={{ color, wordBreak: "break-all" }}>{value}</span>
                            </div>
                          ))}
                          {tx.signature && (
                            <div style={{ marginTop: "0.5rem" }}>
                              <span className="input-label">Signature</span>
                              <div className="mono" style={{ fontSize: "0.58rem", wordBreak: "break-all", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: 1.7 }}>
                                {tx.signature}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`toast toast-${toast.type}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
