import React, { useState, useEffect, useCallback } from "react";
import {
  Network, Share2, Layers, Search, RefreshCw, Eye, ArrowDown, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiBloc } from "../api";

// SHA-256 helper for the browser
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const truncate = (s, n = 6) => s && s.length > n * 2 ? s.slice(0, n) + "…" + s.slice(-n) : s || "";

export default function MerkleTreePage() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // The computed tree levels: [ [root], [node, node], [leaf, leaf, leaf, leaf] ] 
  // Stored top-down (index 0 is root) or bottom-up? Let's do bottom-up (0 = leaves) for easier building, then reverse for display.
  const [treeLevels, setTreeLevels] = useState([]);
  const [computing, setComputing] = useState(false);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiBloc.getBlockchain();
      const chain = res.data || [];
      setBlocks(chain);
      if (chain.length > 0 && selectedBlockIdx === null) {
        setSelectedBlockIdx(chain[chain.length - 1].index ?? chain.length - 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedBlockIdx]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  // Compute Merkle tree when block changes
  useEffect(() => {
    if (selectedBlockIdx === null) return;
    const block = blocks.find(b => (b.index ?? b.blockHeader?.index) === selectedBlockIdx);
    if (!block) return;

    buildTree(block);
  }, [selectedBlockIdx, blocks]);

  const buildTree = async (block) => {
    setComputing(true);
    
    const body = block.blockBody || block.BlockBody || block.body || {};
    let txs = body.transactionList || body.TransactionList || body.transactions || block.transactions || [];
    
    if (txs.length === 0) {
      setTreeLevels([]);
      setComputing(false);
      return;
    }

    // Step 1: Create leaves (Hashes of transactions)
    // We'll use txid if available, otherwise hash the stringified tx.
    const leaves = [];
    for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        let hashValue = tx.txid || tx.txId;
        if (!hashValue) {
            // Fallback for educational display if txid missing
            const raw = (tx.Expediteur || tx.expediteur || "") + (tx.Destinataire || tx.destinataire || "") + (tx.Quantite || tx.quantite || 0);
            hashValue = await sha256(raw);
        }
        leaves.push({
            id: `leaf-${i}`,
            hash: hashValue,
            label: `Tx ${i}`
        });
    }

    // Ensure even number of leaves by duplicating the last one if odd (Standard Bitcoin behavior)
    let currentLevel = [...leaves];
    if (currentLevel.length % 2 !== 0 && currentLevel.length > 1) {
        currentLevel.push({ ...currentLevel[currentLevel.length - 1], id: currentLevel[currentLevel.length - 1].id + "-dup", label: "Tx Dup" });
    }

    const levels = [currentLevel];

    // Step 2: Build tree upwards
    while (currentLevel.length > 1) {
        const nextLevel = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || left; // duplicate if odd (though we handle it mostly)
            
            const combined = left.hash + right.hash;
            const newHash = await sha256(combined);
            
            nextLevel.push({
                id: `node-${levels.length}-${i/2}`,
                hash: newHash,
                label: `Hash(${left.label} + ${right.label})`,
                left: left,
                right: right
            });
        }
        
        // If next level is odd and not root, duplicate last node (Bitcoin style)
        if (nextLevel.length % 2 !== 0 && nextLevel.length > 1) {
             nextLevel.push({ ...nextLevel[nextLevel.length - 1], id: nextLevel[nextLevel.length - 1].id + "-dup", label: "Dup" });
        }

        levels.push(nextLevel);
        currentLevel = nextLevel;
    }

    // Levels is bottom-up. Root is levels[levels.length - 1]
    setTreeLevels(levels.reverse());
    setComputing(false);
  };

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}>
            <Share2 size={26} color="white" />
          </div>
          <div>
            <h1 className="page-title">Merkle Tree</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Visualisation graphique du calcul de la racine de Merkle d'un bloc.
            </p>
          </div>
        </div>
        <button onClick={fetchBlocks} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.75rem" }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", zIndex: 10 }}>
          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Sélectionner un bloc :</div>
          <select 
            className="input-field" 
            style={{ width: "300px", padding: "0.5rem 1rem", cursor: "pointer" }}
            value={selectedBlockIdx ?? ""}
            onChange={(e) => setSelectedBlockIdx(Number(e.target.value))}
          >
             {blocks.length === 0 && <option value="">Aucun bloc disponible</option>}
             {blocks.map((b) => {
                 const idx = b.index ?? b.blockHeader?.index;
                 const txCount = (b.blockBody?.transactionList || b.blockBody?.transactions || b.transactions || []).length;
                 return (
                    <option key={idx} value={idx}>
                        Bloc #{idx} — {txCount} transactions
                    </option>
                 );
             })}
          </select>
      </div>

      {computing || loading ? (
           <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
               Calcul de l'arbre en cours...
           </div>
      ) : treeLevels.length === 0 ? (
           <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", flex: 1 }}>
                <Layers size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                <p style={{ fontWeight: 700 }}>Pas de transactions pour générer l'arbre</p>
                <p style={{ fontSize: "0.78rem", marginTop: "0.4rem" }}>Le Merkle Tree nécessite au moins une transaction. Essayez un autre bloc.</p>
           </div>
      ) : (
          <div className="glass-card" style={{ flex: 1, padding: "2rem", overflowX: "auto", overflowY: "auto", background: "rgba(10,14,26,0.3)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "center", minWidth: "max-content" }}>
                  
                  {treeLevels.map((level, levelIdx) => {
                      const isRoot = levelIdx === 0;
                      const isLeaves = levelIdx === treeLevels.length - 1;
                      
                      return (
                          <div key={levelIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                              
                              {/* Level label */}
                              <div style={{ position: "absolute", left: "-120px", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {isRoot ? "Root (Racine)" : isLeaves ? "Tx Hashes (Feuilles)" : `Niveau ${treeLevels.length - 1 - levelIdx}`}
                              </div>

                              <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                                  {level.map((node, i) => (
                                      <motion.div 
                                          key={node.id} 
                                          initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          transition={{ delay: (treeLevels.length - 1 - levelIdx) * 0.15 + i * 0.05 }}
                                          style={{ 
                                              display: "flex", 
                                              flexDirection: "column", 
                                              alignItems: "center", 
                                              background: isRoot ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))" : "rgba(99,102,241,0.05)",
                                              border: isRoot ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(99,102,241,0.2)",
                                              borderRadius: "var(--radius-md)",
                                              padding: "0.75rem 1rem",
                                              minWidth: "120px",
                                              boxShadow: isRoot ? "0 0 20px rgba(245,158,11,0.15)" : "none",
                                              position: "relative"
                                          }}
                                      >
                                          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: isRoot ? "var(--accent-yellow)" : "var(--accent-blue-light)", marginBottom: "0.3rem" }}>
                                              {node.label}
                                          </div>
                                          <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                              <Hash size={10} style={{ opacity: 0.5 }} />
                                              {truncate(node.hash, 8)}
                                          </div>
                                          
                                          {/* Connecting lines conceptually (visual only - simplified as down arrows for parents) */}
                                          {!isLeaves && (
                                              <div style={{ position: "absolute", bottom: "-25px", color: "var(--glass-border)", zIndex: 0 }}>
                                                  <ArrowDown size={16} />
                                              </div>
                                          )}
                                      </motion.div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}
    </div>
  );
}
