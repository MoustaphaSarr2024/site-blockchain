import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet2, RefreshCw, ArrowUpRight, ArrowDownLeft, Search,
  ChevronDown, ChevronRight, Coins, Copy, Check, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiWallet, apiBloc } from "../api";

const truncate = (s, n = 10) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "—";
const COINBASE_REWARD = 6.25;

// Recalcule balance + tx envoyées/reçues depuis la blockchain pour une adresse
function computeWalletHistory(address, blocks) {
  let balance = 0;
  const sent     = [];
  const received = [];

  for (const block of blocks) {
    const body = block.blockBody || block.BlockBody || block.body || {};
    const txs  = body.transactionList || body.TransactionList || body.transactions || block.transactions || [];
    const cb   = body.coinBaseTrans   || body.CoinBaseTrans   || body.coinbase     || block.coinbase || null;
    const ts   = block.blockHeader?.timeStamp || block.blockHeader?.timestamp || block.timestamp || null;

    // Coinbase
    if (cb) {
      const dest   = cb.MinerAddress || cb.minerAddress || cb.destinataire || cb.miner;
      const reward = parseFloat(cb.Recompense ?? cb.recompense ?? cb.reward ?? COINBASE_REWARD);
      if (dest === address) {
        balance += reward;
        received.push({ type: "COINBASE", amount: reward, from: "COINBASE", to: address, timestamp: ts, blockIndex: block.index ?? block.blockHeader?.index ?? "?" });
      }
    }

    // Transactions normales
    for (const tx of txs) {
      const from   = tx.Expediteur   || tx.expediteur   || tx.sender || "";
      const to     = tx.Destinataire || tx.destinataire || tx.recipient || "";
      const amount = parseFloat(tx.Quantite ?? tx.quantite ?? tx.amount ?? 0);
      const fees   = parseFloat(tx.Fees     ?? tx.fees    ?? tx.frais  ?? 0);
      const txid   = tx.txid || tx.txId || null;
      const txTs   = tx.timestamp || ts;

      if (from === address) {
        balance -= (amount + fees);
        sent.push({ type: "SENT", amount, fees, from, to, txid, timestamp: txTs, blockIndex: block.index ?? "?" });
      }
      if (to === address) {
        balance += amount;
        received.push({ type: "RECEIVED", amount, fees: 0, from, to, txid, timestamp: txTs, blockIndex: block.index ?? "?" });
      }
    }
  }

  return { balance, sent, received };
}

export default function WalletUserPage() {
  const [accounts,  setAccounts]  = useState([]);
  const [blocks,    setBlocks]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [expanded,  setExpanded]  = useState({});
  const [activeTab, setActiveTab] = useState({}); // addr → "sent" | "received"
  const [copied,    setCopied]    = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, bRes] = await Promise.all([apiWallet.getAll(), apiBloc.getBlockchain()]);
      setAccounts(wRes.data || []);
      setBlocks(bRes.data   || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggle = (addr) => setExpanded(prev => ({ ...prev, [addr]: !prev[addr] }));
  const tab    = (addr) => activeTab[addr] || "received";
  const setTab = (addr, t) => setActiveTab(prev => ({ ...prev, [addr]: t }));

  const filtered = accounts.filter(a =>
    !search ||
    (a.label || a.nom || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.address || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts) => {
    if (!ts) return "—";
    try { return new Date(ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }); }
    catch { return ts; }
  };

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
            <Wallet2 size={26} color="white" />
          </div>
          <div>
            <h1 className="page-title">Wallets Utilisateurs</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Solde recalculé depuis la blockchain · Transactions envoyées et reçues
            </p>
          </div>
        </div>
        <button onClick={fetchAll} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <Search size={14} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input-field" placeholder="Rechercher un compte…" style={{ paddingLeft: "2.4rem" }} />
      </div>

      {/* Accounts list */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          <Wallet2 size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
          <p style={{ fontWeight: 700 }}>Aucun compte trouvé</p>
          <p style={{ fontSize: "0.78rem", marginTop: "0.4rem" }}>Créez des comptes dans l'onglet Accounts.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {filtered.map((account, ai) => {
            const addr  = account.address;
            const label = account.label || account.nom || addr;
            const { balance, sent, received } = computeWalletHistory(addr, blocks);
            const isOpen = !!expanded[addr];
            const currentTab = tab(addr);
            const txList = currentTab === "sent" ? sent : received;

            return (
              <motion.div key={addr} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ai * 0.04 }} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>

                {/* Account header row */}
                <div onClick={() => toggle(addr)} style={{ padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", userSelect: "none" }}>
                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `hsl(${(ai * 67) % 360},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 900, color: "white", flexShrink: 0 }}>
                    {label[0]?.toUpperCase()}
                  </div>

                  {/* Name + address */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.15rem" }}>
                      <span className="mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr}</span>
                      <button onClick={e => { e.stopPropagation(); copy(addr, `addr-${addr}`); }} style={{ background: "none", border: "none", color: copied === `addr-${addr}` ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                        {copied === `addr-${addr}` ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div style={{ textAlign: "right", flexShrink: 0, marginRight: "0.75rem" }}>
                    <div style={{ fontWeight: 900, fontSize: "1.1rem", color: balance >= 0 ? "var(--accent-yellow)" : "var(--accent-red)" }}>
                      {balance.toFixed(4)} BTC
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {sent.length} envoyée{sent.length > 1 ? "s" : ""} · {received.length} reçue{received.length > 1 ? "s" : ""}
                    </div>
                  </div>

                  {isOpen ? <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                </div>

                {/* Expanded panel */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ borderTop: "1px solid var(--glass-border)", padding: "1rem 1.4rem" }}>

                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                          {[
                            { label: "Solde", value: `${balance.toFixed(4)} BTC`, color: balance >= 0 ? "var(--accent-yellow)" : "var(--accent-red)" },
                            { label: "Transactions envoyées", value: sent.length, color: "var(--accent-red)" },
                            { label: "Transactions reçues",  value: received.length, color: "var(--accent-green)" },
                          ].map(({ label: l, value, color }) => (
                            <div key={l} style={{ background: "rgba(10,14,26,0.4)", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", border: "1px solid var(--glass-border)" }}>
                              <div className="input-label" style={{ color: "var(--text-muted)" }}>{l}</div>
                              <div style={{ fontWeight: 900, fontSize: "1rem", color, marginTop: "0.25rem" }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Tab selector */}
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
                          {[
                            { key: "received", label: `Reçues (${received.length})`, icon: <ArrowDownLeft size={13} />, color: "var(--accent-green)" },
                            { key: "sent",     label: `Envoyées (${sent.length})`,   icon: <ArrowUpRight  size={13} />, color: "var(--accent-red)"   },
                          ].map(({ key, label: l, icon, color }) => (
                            <button key={key} onClick={() => setTab(addr, key)} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: "var(--radius-sm)", border: `1px solid ${currentTab === key ? color : "var(--glass-border)"}`, background: currentTab === key ? `${color}18` : "transparent", color: currentTab === key ? color : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: "0.72rem", transition: "all 0.2s" }}>
                              {icon} {l}
                            </button>
                          ))}
                        </div>

                        {/* Transaction list */}
                        {txList.length === 0 ? (
                          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            Aucune transaction {currentTab === "sent" ? "envoyée" : "reçue"}.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", maxHeight: "280px", overflowY: "auto" }}>
                            {txList.map((tx, ti) => (
                              <div key={ti} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-sm)", background: "rgba(10,14,26,0.3)", border: "1px solid var(--glass-border)" }}>
                                {/* Icon */}
                                <div style={{ flexShrink: 0 }}>
                                  {tx.type === "RECEIVED" || tx.type === "COINBASE"
                                    ? <ArrowDownLeft size={16} style={{ color: "var(--accent-green)" }} />
                                    : <ArrowUpRight  size={16} style={{ color: "var(--accent-red)"   }} />}
                                </div>

                                {/* From / To / Type */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {tx.type === "COINBASE" ? (
                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-yellow)" }}>⛏️ Récompense Coinbase — Bloc #{tx.blockIndex}</div>
                                  ) : (
                                    <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                                      {currentTab === "sent"
                                        ? <><span style={{ color: "var(--text-muted)" }}>→</span> {truncate(tx.to, 8)}</>
                                        : <><span style={{ color: "var(--text-muted)" }}>←</span> {truncate(tx.from, 8)}</>}
                                      <span style={{ marginLeft: "0.5rem", fontSize: "0.58rem", color: "var(--text-muted)" }}>Bloc #{tx.blockIndex}</span>
                                    </div>
                                  )}
                                  {tx.txid && (
                                    <div className="mono" style={{ fontSize: "0.57rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                                      txid: {truncate(tx.txid, 10)}
                                    </div>
                                  )}
                                  {tx.timestamp && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.57rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                                      <Clock size={9} /> {formatDate(tx.timestamp)}
                                    </div>
                                  )}
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ fontWeight: 900, fontSize: "0.88rem", color: tx.type === "SENT" ? "var(--accent-red)" : "var(--accent-green)" }}>
                                    {tx.type === "SENT" ? "-" : "+"}{(tx.amount || 0).toFixed(4)} BTC
                                  </div>
                                  {tx.fees > 0 && (
                                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>frais: {tx.fees.toFixed(4)}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
