import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Cpu,
  Search,
  X,
  Coins,
  Shield,
  Clock,
  Hash,
  RefreshCw,
  Pickaxe,
  Layers,
  Zap,
  Trash2,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc, apiWallet } from "../api";

// --- ANIMATION VARIANTS ---
const blockVariants = {
  center: { x: 0, scale: 1, opacity: 1, zIndex: 10, filter: "blur(0px)" },
  left: { x: -320, scale: 0.8, opacity: 0.3, zIndex: 5, filter: "blur(1px)" },
  right: { x: 320, scale: 0.8, opacity: 0.3, zIndex: 5, filter: "blur(1px)" },
  hiddenLeft: { x: -500, scale: 0.5, opacity: 0, zIndex: 0 },
  hiddenRight: { x: 500, scale: 0.5, opacity: 0, zIndex: 0 },
};

const BlockchainExplorer = () => {
  const [blocks, setBlocks] = useState([
    {
      index: 0,
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      merkleRoot: "GENESIS_ROOT",
      timestamp: new Date().toISOString(),
      nonce: 0,
      data: "Genesis Block",
      target: 3,
      transactions: [],
    },
  ]);

  const [mempool, setMempool] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };



  // --- FETCH MEMPOOL FROM BACKEND ---
  const fetchMempool = useCallback(async () => {
    try {
      const res = await apiBloc.getMempool();
      setMempool(res.data);
    } catch (err) {
      console.error("Fetch mempool error:", err);
    }
  }, []);

  // --- FETCH WALLETS ---
  const fetchWallets = useCallback(async () => {
    try {
      const res = await apiWallet.getAll();
      setWallets(res.data);
    } catch (err) {
      console.error("Fetch wallets error:", err);
    }
  }, []);

  // --- FETCH BLOCKCHAIN FROM BACKEND ---
  const fetchBlockchain = useCallback(async () => {
    try {
      const res = await apiBloc.getBlockchain();
      if (res.data && res.data.length > 0) {
        const parsedBlocks = res.data.map(javaBlock => ({
          index: javaBlock.index ?? (javaBlock.blockHeader?.index || 0),
          hash: javaBlock.hash || javaBlock.blockHeader?.hashPre || "HASH",
          prevHash: javaBlock.prevHash || javaBlock.blockHeader?.hashPre || "GENESIS_ROOT",
          merkleRoot: javaBlock.merkleRoot || javaBlock.blockHeader?.merkleRoot || "N/A",
          timestamp: javaBlock.timestamp || javaBlock.blockHeader?.timeStamp || new Date().toISOString(),
          nonce: javaBlock.nonce || javaBlock.blockHeader?.nonce || 0,
          target: javaBlock.target || javaBlock.blockHeader?.target || 4,
          data: `${(javaBlock.transactions || javaBlock.blockBody?.transactionList || []).length} Transactions`,
          transactions: javaBlock.transactions || javaBlock.blockBody?.transactionList || [],
          coinbase: javaBlock.coinbase || javaBlock.blockBody?.coinBaseTrans || null,
        }));
        
        // Only update state if the chain has grown/changed to prevent reset of carousel index
        setBlocks(prev => {
          if (parsedBlocks.length > prev.length) {
            // Auto-scroll to latest block if we were at the end
            if (currentIndex === prev.length - 1 || prev.length === 1) {
               setCurrentIndex(parsedBlocks.length - 1);
            }
            return parsedBlocks;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Fetch blockchain error:", err);
    }
  }, [currentIndex]);

  useEffect(() => {
    fetchBlockchain();
    fetchMempool();
    fetchWallets();
    const interval = setInterval(() => {
      fetchBlockchain();
      fetchMempool();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBlockchain, fetchMempool, fetchWallets]);

  // --- DELETE FROM MEMPOOL ---
  const handleDeleteFromMempool = async (index) => {
    try {
      await apiBloc.deleteFromMempool(index);
      showToast("Transaction supprimée du mempool");
      fetchMempool();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur suppression", "error");
    }
  };

  // --- CLEAR MEMPOOL ---
  const handleClearMempool = async () => {
    try {
      await apiBloc.clearMempool();
      showToast("Mempool vidé");
      setMempool([]);
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur", "error");
    }
  };

  const moveNext = () =>
    currentIndex < blocks.length - 1 && setCurrentIndex(currentIndex + 1);
  const movePrev = () =>
    currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    const foundIndex =
      term.length < 8
        ? blocks.findIndex((b) => b.index.toString() === term)
        : blocks.findIndex(
            (b) => b.hash && b.hash.toLowerCase().includes(term.toLowerCase())
          );
    if (foundIndex !== -1) {
      setCurrentIndex(foundIndex);
      setSearchTerm("");
    } else {
      showToast("Bloc introuvable !", "error");
    }
  };

  const getBlockPosition = (index) => {
    if (index === currentIndex) return "center";
    if (index === currentIndex - 1) return "left";
    if (index === currentIndex + 1) return "right";
    return index < currentIndex ? "hiddenLeft" : "hiddenRight";
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ========== MEMPOOL SIDEBAR ========== */}
      <aside
        style={{
          width: "320px",
          minWidth: "320px",
          borderRight: "1px solid var(--glass-border)",
          background: "var(--bg-secondary)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--gradient-warm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={16} color="white" />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Mempool
                </h2>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--accent-yellow)",
                    fontWeight: 600,
                  }}
                >
                  {mempool.length} pending
                </span>
              </div>
            </div>
            {mempool.length > 0 && (
              <button
                onClick={handleClearMempool}
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "var(--accent-red)",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Trash2 size={10} /> Vider
              </button>
            )}
          </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            paddingRight: "0.25rem",
          }}
        >
          <AnimatePresence initial={false}>
            {mempool.map((tx, idx) => (
              <motion.div
                key={`mempool-${idx}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => setSelectedTx({
                  id: `tx_${idx}`,
                  from: tx.expediteur,
                  to: tx.destinataire,
                  amount: tx.quantite?.toFixed(4) || "0",
                  fees: tx.fees?.toFixed(6) || "0",
                })}
                className="glass-card"
                style={{
                  padding: "0.85rem",
                  cursor: "pointer",
                  borderRadius: "var(--radius-md)",
                  position: "relative",
                }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFromMempool(idx);
                  }}
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "0.15rem",
                  }}
                  title="Supprimer du mempool"
                >
                  <Trash2 size={12} />
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span className="badge badge-yellow mono" style={{ fontSize: "0.55rem" }}>
                    {tx.signature ? "Signée" : "FAUCET"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                    }}
                  >
                    {tx.quantite?.toFixed(4) || "0"}{" "}
                    <span style={{ fontSize: "0.65rem", color: "var(--accent-yellow)" }}>
                      BTC
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        width: "28px",
                      }}
                    >
                      FROM
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tx.expediteur?.substring(0, 16)}...
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        width: "28px",
                      }}
                    >
                      TO
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tx.destinataire?.substring(0, 16)}...
                    </span>
                  </div>
                  {tx.fees > 0 && (
                    <div style={{ fontSize: "0.55rem", color: "var(--accent-orange)", fontWeight: 600, marginTop: "0.2rem" }}>
                      Fees: {tx.fees?.toFixed(4)} BTC
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbits */}
        <div
          className="orbit-ring"
          style={{
            width: "600px",
            height: "600px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="orbit-ring"
          style={{
            width: "800px",
            height: "800px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* HEADER */}
        <div style={{ zIndex: 20, textAlign: "center", marginBottom: "1.5rem", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <Database size={32} style={{ color: "var(--accent-blue-light)" }} />
            <h1 className="page-title" style={{ fontSize: "2.25rem" }}>
              Blockchain Explorer
            </h1>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              maxWidth: "480px",
              margin: "0 auto 1.25rem auto",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Rechercher par index ou hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: "2.75rem",
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                padding: "0 1.5rem",
              }}
            >
              Find
            </button>
          </form>
        </div>

        {/* ========== BLOCK CAROUSEL ========== */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "340px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {blocks.map((block, i) => {
              const pos = getBlockPosition(i);
              if (pos.includes("hidden") && Math.abs(i - currentIndex) > 1)
                return null;

              return (
                <motion.div
                  key={`block-${block.index}`}
                  variants={blockVariants}
                  animate={pos}
                  initial={pos.includes("Left") ? "hiddenLeft" : "hiddenRight"}
                  exit={pos.includes("Left") ? "hiddenLeft" : "hiddenRight"}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  onClick={() => pos === "center" && setSelectedBlock(block)}
                  style={{
                    position: "absolute",
                    width: "340px",
                    padding: "2rem",
                    borderRadius: "var(--radius-xl)",
                    border:
                      pos === "center"
                        ? "1px solid rgba(99, 102, 241, 0.4)"
                        : "1px solid var(--glass-border)",
                    background:
                      pos === "center"
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)"
                        : "var(--bg-card)",
                    cursor: pos === "center" ? "pointer" : "default",
                    boxShadow:
                      pos === "center"
                        ? "0 0 60px rgba(99, 102, 241, 0.2)"
                        : "var(--shadow-card)",
                  }}
                >
                  {/* Block Index */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Layers
                      size={14}
                      style={{
                        color:
                          pos === "center"
                            ? "var(--accent-blue-light)"
                            : "var(--text-muted)",
                      }}
                    />
                    <span
                      className="mono"
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color:
                          pos === "center"
                            ? "var(--accent-blue-light)"
                            : "var(--text-muted)",
                      }}
                    >
                      BLOCK #{block.index}
                    </span>
                  </div>

                  {/* Hash */}
                  <div
                    className="mono"
                    style={{
                      fontSize: "0.6rem",
                      padding: "0.5rem 0.75rem",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "1.25rem",
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {block.hash}
                  </div>

                  {/* Block Data */}
                  <div
                    style={{
                      fontSize: pos === "center" ? "1.5rem" : "0.85rem",
                      fontWeight: 900,
                      color: pos === "center" ? "var(--text-primary)" : "var(--text-muted)",
                      letterSpacing: "-0.02em",
                      transition: "all 0.4s ease",
                    }}
                  >
                    {block.data}
                  </div>

                  {/* Center: Inspect Label */}
                  {pos === "center" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        marginTop: "1.5rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        className="badge badge-blue"
                        style={{ animation: "pulse-glow 2s infinite" }}
                      >
                        <Shield size={12} /> Inspect Header
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}
                      >
                        Nonce: {block.nonce}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* NAVIGATION */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: "1.5rem",
            zIndex: 20,
            alignItems: "center",
          }}
        >
          <button
            onClick={movePrev}
            disabled={currentIndex === 0}
            className="btn-secondary"
            style={{ width: "52px", height: "52px", padding: 0, justifyContent: "center" }}
          >
            <ArrowLeft size={22} />
          </button>
          <span
            className="mono"
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {currentIndex + 1} / {blocks.length}
          </span>
          <button
            onClick={moveNext}
            disabled={currentIndex === blocks.length - 1}
            className="btn-secondary"
            style={{ width: "52px", height: "52px", padding: 0, justifyContent: "center" }}
          >
            <ArrowRight size={22} />
          </button>
        </div>
      </main>

      {/* ========== TRANSACTION MODAL ========== */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="modal-content"
              style={{ maxWidth: "680px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--gradient-warm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Coins size={24} color="white" />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 900,
                      color: "var(--accent-yellow)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Transaction Details
                  </h3>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Mempool Transaction
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Hash ID */}
                <div style={{ background: "rgba(10,14,26,0.5)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                  <span className="input-label">Hash ID</span>
                  <div className="mono" style={{ fontSize: "0.85rem", wordBreak: "break-all", color: "var(--text-primary)", marginTop: "0.35rem" }}>
                    {selectedTx.id}
                  </div>
                </div>

                {/* Sender */}
                <div style={{ background: "rgba(10,14,26,0.5)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                  <span className="input-label" style={{ color: "var(--accent-blue-light)" }}>
                    Sender (Expéditeur)
                  </span>
                  <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", wordBreak: "break-all", marginTop: "0.35rem", lineHeight: 1.6 }}>
                    {selectedTx.from}
                  </div>
                </div>

                {/* Receiver */}
                <div style={{ background: "rgba(10,14,26,0.5)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                  <span className="input-label" style={{ color: "var(--accent-green)" }}>
                    Receiver (Destinataire)
                  </span>
                  <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", wordBreak: "break-all", marginTop: "0.35rem", lineHeight: 1.6 }}>
                    {selectedTx.to}
                  </div>
                </div>

                {/* Amount & Fees */}
                <div
                  style={{
                    background: "rgba(245,158,11,0.05)",
                    padding: "1.5rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <span className="input-label" style={{ color: "var(--accent-yellow)" }}>Amount</span>
                    <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.25rem" }}>
                      {selectedTx.amount}{" "}
                      <span style={{ fontSize: "1rem", color: "var(--accent-yellow)" }}>BTC</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="input-label">Fees</span>
                    <div className="mono" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-orange)", marginTop: "0.25rem" }}>
                      {selectedTx.fees} BTC
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== BLOCK HEADER MODAL ========== */}
      <AnimatePresence>
        {selectedBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedBlock(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85 }}
              className="modal-content"
              style={{ maxWidth: "640px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedBlock(null)}
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--gradient-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={22} color="white" />
                </div>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    background: "var(--gradient-secondary)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Block Header #{selectedBlock.index}
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Block Hash */}
                <div
                  style={{
                    background: "rgba(99,102,241,0.05)",
                    padding: "1.15rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  <span className="input-label" style={{ color: "var(--accent-blue-light)" }}>
                    <Hash size={12} style={{ display: "inline", marginRight: "0.35rem", verticalAlign: "middle" }} />
                    Current Block Hash
                  </span>
                  <div
                    className="mono"
                    style={{ fontSize: "0.75rem", wordBreak: "break-all", lineHeight: 1.6, color: "var(--text-primary)" }}
                  >
                    {selectedBlock.hash}
                  </div>
                </div>

                {/* Grid: MerkleRoot + PrevHash */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ background: "rgba(10,14,26,0.5)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                    <span className="input-label">Merkle Root</span>
                    <div className="mono" style={{ fontSize: "0.6rem", wordBreak: "break-all", color: "var(--text-secondary)" }}>
                      {selectedBlock.merkleRoot}
                    </div>
                  </div>
                  <div style={{ background: "rgba(10,14,26,0.5)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                    <span className="input-label">Previous Hash</span>
                    <div className="mono" style={{ fontSize: "0.6rem", wordBreak: "break-all", color: "var(--text-muted)" }}>
                      {selectedBlock.prevHash}
                    </div>
                  </div>
                </div>

                {/* Grid: Time + Nonce + Target */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ background: "rgba(10,14,26,0.5)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <span className="input-label"><Clock size={11} style={{ display: "inline", marginRight: "0.3rem", verticalAlign: "middle" }} />Timestamp</span>
                    <span className="mono" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {typeof selectedBlock.timestamp === "string"
                        ? selectedBlock.timestamp
                        : new Date(selectedBlock.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ background: "rgba(10,14,26,0.5)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <span className="input-label"><Cpu size={11} style={{ display: "inline", marginRight: "0.3rem", verticalAlign: "middle" }} />Nonce</span>
                    <span className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-yellow)" }}>
                      {selectedBlock.nonce}
                    </span>
                  </div>
                  <div style={{ background: "rgba(10,14,26,0.5)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <span className="input-label">Target</span>
                    <span className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-purple)" }}>
                      {selectedBlock.target || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Block Data */}
                <div
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    padding: "1.15rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  <span className="input-label" style={{ color: "var(--accent-blue-light)" }}>Block Data</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    "{selectedBlock.data}"
                  </div>
                </div>

                {/* Transactions List */}
                {selectedBlock.transactions && selectedBlock.transactions.length > 0 && (
                  <div>
                    <span className="input-label" style={{ marginBottom: "0.75rem", display: "block" }}>
                      Transactions ({selectedBlock.transactions.length})
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                      {selectedBlock.transactions.map((tx, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "rgba(10,14,26,0.5)",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--glass-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div className="mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                            {tx.Expediteur || tx.expediteur} → {tx.Destinataire || tx.destinataire}
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-green)" }}>
                            {(tx.Quantite || tx.quantite || 0).toFixed(4)} BTC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== TOAST ========== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}
          >
            {toast.type === "error" ? <X size={16} /> : <Shield size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockchainExplorer;
