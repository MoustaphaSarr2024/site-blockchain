import React, { useState, useEffect, useCallback } from "react";
import {
  Activity, Database, Zap, Coins, TrendingUp, Clock,
  Layers, Shield, Users, RefreshCw, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { apiBloc, apiWallet } from "../api";
import { useNavigate } from "react-router-dom";

const PHASES = [
  { key: "basics",      label: "Basics",          desc: "Hachage SHA-256",           path: "/basics",      color: "#f59e0b" },
  { key: "accounts",    label: "Accounts",         desc: "Clés & signatures",          path: "/accounts",    color: "#6366f1" },
  { key: "mempool",     label: "Mempool",          desc: "Transactions en attente",    path: "/mempool",     color: "#22d3ee" },
  { key: "mining",      label: "Mining",           desc: "Proof-of-Work",              path: "/mining",      color: "#10b981" },
  { key: "explorer",   label: "Explorer",         desc: "Visualiser la chaîne",       path: "/",            color: "#818cf8" },
  { key: "balances",    label: "Balances",         desc: "Soldes recalculés",          path: "/balances",    color: "#a855f7" },
  { key: "consensus",  label: "Consensus",        desc: "Validation réseau",          path: "/consensus",   color: "#f97316" },
  { key: "internals",  label: "Chain Internals",  desc: "Données brutes",             path: "/internals",   color: "#64748b" },
  { key: "wallet",     label: "Wallet User",           desc: "Affichage complète du wallet d'un utilisateur",           path: "/walletuser",      color: "#6366f1" },
  { key: "merkle",     label: "Merkle Tree",      desc: "Arbre de Merkle",            path: "/merkletree",  color: "#6366f1" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [wallets, setWallets]   = useState([]);
  const [mempool, setMempool]   = useState([]);
  const [stats, setStats]       = useState({
    blockCount: 0,
    difficulty: "—",
    avgTime: "—",
    totalSupply: "0.0000",
    pendingTx: 0,
    accounts: 0,
  });
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [wRes, mRes, bRes] = await Promise.all([
        apiWallet.getAll(),
        apiBloc.getMempool(),
        apiBloc.getBlockchain(),
      ]);

      const walletList   = wRes.data  || [];
      const mempoolList  = mRes.data  || [];
      const blockchain   = bRes.data  || [];

      setWallets(walletList);
      setMempool(mempoolList);

      // ── Nombre total de blocs ──────────────────────────
      const blockCount = blockchain.length;

      // ── Difficulté actuelle (du dernier bloc) ──────────
      let difficulty = "—";
      if (blockCount > 0) {
        const lastBloc = blockchain[blockCount - 1];
        const hdr = lastBloc.blockHeader || lastBloc.BlockHeader || lastBloc.header || {};
        const target = hdr.Target ?? hdr.target ?? hdr.difficulty ?? null;
        if (target !== null) difficulty = target.toString();
      }

      // ── Temps moyen de création des blocs ─────────────
      let avgTime = "—";
      if (blockCount >= 2) {
        // Tente de récupérer un timestamp précis via la première Tx, sinon le Header (qui n'a qu'un LocalDate)
        const timestamps = blockchain.map(b => {
          let tsStr = null;
          const body = b.blockBody || b.BlockBody || b.body || {};
          if (body.transactionList && body.transactionList.length > 0) {
             const firstTx = body.transactionList[0];
             tsStr = firstTx.timestamp || firstTx.TimeStamp || firstTx.date;
          }
          if (!tsStr) {
             const hdr = b.blockHeader || b.BlockHeader || b.header || {};
             tsStr  = hdr.TimeStamp || hdr.timeStamp || hdr.timestamp || null;
          }
          return tsStr ? new Date(tsStr).getTime() : null;
        }).filter(Boolean);

        // Filter out same-time timestamps if they purely fall on LocalDate bounds (happens if no TX timestamps)
        let totalMs = 0;
        let validIntervals = 0;
        for (let i = 1; i < timestamps.length; i++) {
          const diff = Math.abs(timestamps[i] - timestamps[i - 1]);
          if (diff > 0) {
            totalMs += diff;
            validIntervals++;
          }
        }
        
        if (validIntervals > 0) {
          const avgMs  = totalMs / validIntervals;
          const avgSec = avgMs / 1000;
          if (avgSec < 60)        avgTime = `${avgSec.toFixed(1)} s`;
          else if (avgSec < 3600) avgTime = `${(avgSec / 60).toFixed(1)} min`;
          else                    avgTime = `${(avgSec / 3600).toFixed(1)} h`;
        } else {
          avgTime = "< 1 s";
        }
      } else if (blockCount === 1) {
        avgTime = "1 bloc";
      }

      // ── Total Supply = somme des récompenses coinbase ──
      let totalSupply = 0;
      blockchain.forEach(b => {
        const body     = b.blockBody || b.BlockBody || b.body || {};
        const coinbase = body.coinBaseTrans || body.CoinBaseTrans || body.coinBase || body.CoinBase || body.coinbase || null;
        if (coinbase) {
          const reward = coinbase.Recompense ?? coinbase.recompense ?? coinbase.reward ?? 0;
          totalSupply += reward;
        }
      });


      setStats({
        blockCount,
        difficulty,
        avgTime,
        totalSupply: totalSupply.toFixed(4),
        pendingTx:   mempoolList.length,
        accounts:    walletList.length,
      });

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 8000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const statCards = [
    {
      label: "Nombre de blocs",
      value: loading ? "…" : stats.blockCount,
      icon: <Database size={20} />,
      color: "#6366f1",
      sub: "blocs minés",
    },
    {
      label: "Difficulté actuelle",
      value: loading ? "…" : stats.difficulty,
      icon: <Shield size={20} />,
      color: "#a855f7",
      sub: "Proof-of-Work target",
    },
    {
      label: "Temps moyen / bloc",
      value: loading ? "…" : stats.avgTime,
      icon: <Clock size={20} />,
      color: "#22d3ee",
      sub: "entre deux blocs",
    },
    {
      label: "Total Supply",
      value: loading ? "…" : `${stats.totalSupply} BTC`,
      icon: <Coins size={20} />,
      color: "#10b981",
      sub: "monnaie créée (coinbase)",
    },
  ];

  const infoCards = [
    { label: "Comptes", value: loading ? "…" : stats.accounts, icon: <Users size={16} />, color: "#818cf8" },
    { label: "Tx en attente", value: loading ? "…" : stats.pendingTx, icon: <Zap size={16} />, color: "#f59e0b" },
  ];

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* ── Hero ── */}
      <div
        style={{
          textAlign: "center",
          padding: "3rem 2rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{
              width: 80, height: 80,
              borderRadius: "var(--radius-lg)",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
              boxShadow: "0 8px 40px rgba(99,102,241,0.4)",
            }}
          >
            <Activity size={40} color="white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em",
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.75rem",
            }}
          >
            Blockchain Studio
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "520px", margin: "0 auto 0.5rem" }}
          >
            Simulation interactive d'une blockchain Proof-of-Work
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}
          >
            {["ECDSA", "SHA-256", "Merkle Tree", "PoW", "Consensus"].map(tag => (
              <span key={tag} className="badge badge-blue" style={{ fontSize: "0.65rem" }}>{tag}</span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Header row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Indicateurs blockchain
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {lastUpdate && (
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              Mis à jour : {lastUpdate}
            </span>
          )}
          <button onClick={fetchAll} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
            <RefreshCw size={13} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── 4 Main Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
        {statCards.map(({ label, value, icon, color, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.2 }}
            className="glass-card"
            style={{ padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: color, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem", color }}>
              {icon}
              <span className="input-label" style={{ margin: 0, color: "var(--text-muted)" }}>{label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
              {value}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── 2 secondary stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {infoCards.map(({ label, value, icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.4 }}
            className="glass-card"
            style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: `${color}18`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>{value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Navigation cards ── */}
      <h2 style={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
        Fonctionnalités de l'Application
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {PHASES.map(({ label, desc, path, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 + 0.3 }}
            className="glass-card"
            onClick={() => navigate(path)}
            style={{
              padding: "1.25rem",
              cursor: "pointer",
              borderColor: `${color}22`,
            }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: "var(--radius-sm)",
                background: `${color}18`,
                border: `1px solid ${color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              <Database size={16} style={{ color }} />
            </div>
            <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.88rem", marginBottom: "0.25rem" }}>
              {label}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{desc}</div>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color }}>
              Ouvrir <ArrowRight size={12} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
