import React, { useState, useEffect, useCallback } from "react";
import {
  Coins, RefreshCw, TrendingUp, TrendingDown, Users,
  ArrowUpRight, ArrowDownLeft, Search, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc, apiWallet } from "../api";

const truncate = (s, n = 12) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "—";
const COINBASE_REWARD = 6.25;

// ── Recalculate balances from all blocks ──────────────────────────────────
function computeBalances(blocks) {
  const balances = {}; // address → amount

  const ensure = (addr) => { if (addr && !balances[addr]) balances[addr] = 0; };

  for (const block of blocks) {
    const body = block.blockBody || block.BlockBody || block.body || {};

    // Coinbase
    const cb = body.coinBaseTrans || body.CoinBaseTrans || body.coinbase || block.coinbase;
    if (cb) {
      const reward = parseFloat(cb.Recompense ?? cb.recompense ?? cb.reward ?? 6.25);
      const dest = cb.MinerAddress || cb.minerAddress || cb.destinataire || cb.recipient || cb.to || cb.miner;
      if (dest) {
        ensure(dest);
        balances[dest] += reward;
      }
    }

    // Regular transactions
    const txs = body.transactionList || body.TransactionList || body.transactions || block.transactions || [];
    for (const tx of txs) {
      const sender    = tx.Expediteur  || tx.expediteur  || tx.sender || tx.from;
      const recipient = tx.Destinataire || tx.destinataire || tx.recipient || tx.to;
      const amount    = parseFloat(tx.Quantite ?? tx.quantite ?? tx.amount ?? tx.montant ?? 0);
      const fees      = parseFloat(tx.Fees    ?? tx.fees    ?? tx.frais  ?? 0);

      if (sender) { ensure(sender); balances[sender] -= (amount + fees); }
      if (recipient) { ensure(recipient); balances[recipient] += amount; }
    }
  }

  return balances;
}

export default function BalancesPage() {
  const [blocks, setBlocks]     = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, walRes] = await Promise.all([
        apiBloc.getBlockchain(),
        apiWallet.getAll(),
      ]);
      const chain = bRes.data || [];
      setBlocks(chain);
      setAccounts(walRes.data || []);
      setBalances(computeBalances(chain));
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Merge computed balances with known account labels
  const addrToLabel = Object.fromEntries(accounts.map(a => [a.address, a.label || a.nom || a.address]));

  // Build display rows: all addresses with non-zero balances + all known accounts
  const allAddresses = new Set([
    ...Object.keys(balances),
    ...accounts.map(a => a.address),
  ]);

  const rows = Array.from(allAddresses)
    .map(addr => ({
      addr,
      label: addrToLabel[addr] || truncate(addr, 8),
      balance: balances[addr] ?? accounts.find(a => a.address === addr)?.balance ?? 0,
      known: !!addrToLabel[addr],
    }))
    .filter(r => r.balance !== 0 || r.known)
    .sort((a, b) => b.balance - a.balance);

  const filtered = rows.filter(r =>
    r.label.toLowerCase().includes(search.toLowerCase()) ||
    r.addr.toLowerCase().includes(search.toLowerCase())
  );

  const totalSupply = rows.reduce((s, r) => s + Math.max(0, r.balance), 0);
  const txCount = blocks.reduce((s, b) => {
    const body = b.blockBody || b.BlockBody || b.body || {};
    return s + (body.transactionList || body.TransactionList || body.transactions || b.transactions || []).length;
  }, 0);

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #f59e0b 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
            <Coins size={26} color="white" />
          </div>
          <div>
            <h1 className="page-title">Balances</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Soldes recalculés depuis la blockchain — {blocks.length} blocs, {txCount} transactions
            </p>
          </div>
        </div>
        <button onClick={fetchAll} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Blocs analysés", value: blocks.length, icon: <TrendingUp size={18} />, color: "#6366f1" },
          { label: "Transactions", value: txCount, icon: <ArrowUpRight size={18} />, color: "#22d3ee" },
          { label: "Adresses actives", value: rows.length, icon: <Users size={18} />, color: "#a855f7" },
          { label: "Monnaie créée", value: `${totalSupply.toFixed(4)} BTC`, icon: <Coins size={18} />, color: "#f59e0b" },
        ].map(({ label, value, icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "1.1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color, marginBottom: "0.6rem" }}>
              {icon}
              <span className="input-label" style={{ margin: 0, color }}>{label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--text-primary)" }}>{loading ? "…" : value}</div>
          </motion.div>
        ))}
      </div>


      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <Search size={14} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          placeholder="Rechercher un nom ou une adresse…"
          style={{ paddingLeft: "2.4rem" }}
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(10,14,26,0.5)" }}>
              {["#", "Nom / Adresse", "Adresse complète", "Solde (BTC)", "Type"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Chargement depuis la blockchain…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {blocks.length === 0 ? "Aucun bloc dans la blockchain. Minez des blocs d'abord !" : "Aucun résultat pour cette recherche."}
              </td></tr>
            ) : (
              <>
                {filtered.map(({ addr, label, balance, known }, idx) => (
                  <motion.tr
                    key={addr}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{ borderBottom: "1px solid var(--glass-border)" }}
                  >
                    {/* Rank */}
                    <td style={{ padding: "0.9rem 1.25rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      {idx + 1}
                    </td>
                    {/* Name */}
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${idx * 47 % 360},60%,50%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "white", flexShrink: 0 }}>
                          {label[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{label}</span>
                      </div>
                    </td>
                    {/* Address */}
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{truncate(addr, 11)}</span>
                    </td>
                    {/* Balance */}
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {balance >= 0
                          ? <TrendingUp size={14} style={{ color: "var(--accent-green)" }} />
                          : <TrendingDown size={14} style={{ color: "var(--accent-red)" }} />}
                        <span style={{ fontWeight: 900, fontSize: "1rem", color: balance >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                          {balance >= 0 ? "+" : ""}{balance.toFixed(4)}
                        </span>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>BTC</span>
                      </div>
                    </td>
                    {/* Type */}
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      <span className={`badge ${known ? "badge-blue" : "badge-yellow"}`} style={{ fontSize: "0.6rem" }}>
                        {known ? "Compte" : "Externe"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </>
            )}
          </tbody>
        </table>
        {lastUpdate && (
          <div style={{ padding: "0.6rem 1.25rem", fontSize: "0.65rem", color: "var(--text-muted)", borderTop: "1px solid var(--glass-border)" }}>
            Dernière mise à jour : {lastUpdate.toLocaleTimeString("fr-FR")}
          </div>
        )}
      </div>
    </div>
  );
}
