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
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [mempool, setMempool] = useState([]);
  const [stats, setStats] = useState({ blocks: 0, supply: 0, difficulty: 4, avgTime: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [wRes, mRes] = await Promise.all([
        apiWallet.getAll(),
        apiBloc.getMempool(),
      ]);
      setWallets(wRes.data);
      setMempool(mRes.data);

      // Derive simple stats
      const supply = wRes.data.reduce((s, w) => s + (w.balance || 0), 0);
      setStats(prev => ({
        ...prev,
        accounts: wRes.data.length,
        pendingTx: mRes.data.length,
        totalSupply: supply.toFixed(4),
      }));
    } catch (e) {
      console.error(e);
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
    { label: "Comptes créés", value: wallets.length, icon: <Users size={20} />, color: "#6366f1" },
    { label: "Tx en attente", value: mempool.length, icon: <Zap size={20} />, color: "#f59e0b" },
    { label: "Supply totale", value: `${stats.totalSupply || "0.0000"} BTC`, icon: <Coins size={20} />, color: "#10b981" },
    { label: "Difficulté PoW", value: `${stats.difficulty} zéros`, icon: <Shield size={20} />, color: "#a855f7" },
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
        {/* Background grid */}
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

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {statCards.map(({ label, value, icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.2 }}
            className="glass-card"
            style={{ padding: "1.25rem 1.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem", color }}>
              {icon}
              <span className="input-label" style={{ margin: 0 }}>{label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {loading ? "…" : value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Refresh ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button onClick={fetchAll} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* ── Navigation cards ── */}
      <h2 style={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
        Sections de l'Application
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

      {/* ── What is a blockchain ── */}
      <div className="glass-card" style={{ padding: "1.75rem", borderColor: "rgba(99,102,241,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <Layers size={20} style={{ color: "var(--accent-blue-light)" }} />
          <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>
            Comment fonctionne cette simulation ?
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {[
            { step: "1", title: "Créer des comptes", desc: "Chaque compte génère une paire de clés ECDSA (privée/publique). La clé publique identifie l'utilisateur sur la blockchain.", color: "#6366f1" },
            { step: "2", title: "Créer des transactions", desc: "Signer une transaction avec votre clé privée. La transaction est ajoutée au Mempool et attend d'être incluse dans un bloc.", color: "#22d3ee" },
            { step: "3", title: "Miner un bloc", desc: "Le mineur choisit les transactions du mempool, calcule le Merkle Root et trouve un nonce satisfaisant la difficulté PoW.", color: "#10b981" },
            { step: "4", title: "Consensus", desc: "10 nœuds réseau vérifient la validité du bloc (hash, signatures, soldes). Le bloc est ajouté si la majorité l'accepte.", color: "#f97316" },
            { step: "5", title: "Explorer la chaîne", desc: "Visualisez tous les blocs chaînés. Chaque bloc contient le hash du précédent, formant une chaîne immuable.", color: "#818cf8" },
            { step: "6", title: "Calculer les soldes", desc: "Les soldes sont recalculés depuis le début de la chaîne : coinbase + transactions reçues - transactions envoyées.", color: "#a855f7" },
          ].map(({ step, title, desc, color }) => (
            <div key={step} style={{ display: "flex", gap: "0.85rem" }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: `${color}22`, border: `1px solid ${color}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color, fontWeight: 800, fontSize: "0.75rem", flexShrink: 0,
                }}
              >
                {step}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.82rem", marginBottom: "0.3rem" }}>{title}</div>
                <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
