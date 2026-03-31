import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Key, Copy, Check, Shield, CheckCircle, XCircle,
  RefreshCw, ChevronDown, Eye, EyeOff, FileSignature, Droplets
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiWallet } from "../api";

const truncate = (str, len = 14) => {
  if (!str) return "";
  if (str.length <= len * 2) return str;
  return str.substring(0, len) + "…" + str.substring(str.length - len);
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedAddr, setExpandedAddr] = useState(null);
  const [showPrivKey, setShowPrivKey] = useState({});
  const [copied, setCopied] = useState(null);

  // Sign tab
  const [signAddr, setSignAddr] = useState("");
  const [signDest, setSignDest] = useState("");
  const [signQty, setSignQty] = useState("0.5");
  const [signResult, setSignResult] = useState(null);
  const [signLoading, setSignLoading] = useState(false);

  // Verify tab
  const [vPubKey, setVPubKey] = useState("");
  const [vExpe, setVExpe] = useState("");
  const [vDest, setVDest] = useState("");
  const [vQty, setVQty] = useState("0.5");
  const [vSig, setVSig] = useState("");
  const [vResult, setVResult] = useState(null);
  const [vLoading, setVLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("accounts"); // accounts | sign | verify

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    showToast("Copié !");
  };

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await apiWallet.getAll();
      setAccounts(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // Create account
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return showToast("Entrez un nom", "error");
    setLoading(true);
    try {
      await apiWallet.create(newName.trim());
      showToast(`Compte "${newName}" créé !`);
      setNewName("");
      setShowCreate(false);
      await fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur création", "error");
    } finally {
      setLoading(false);
    }
  };

  // Faucet
  const handleFaucet = async (address) => {
    try {
      const res = await apiWallet.faucet(address, 1.0);
      showToast(res.data.message || "+1 BTC crédité !");
      await fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur faucet", "error");
    }
  };

  // Sign
  const handleSign = async () => {
    if (!signAddr) return showToast("Sélectionnez un compte", "error");
    setSignLoading(true);
    try {
      const res = await apiWallet.sign(signAddr, signDest || "self", parseFloat(signQty) || 0);
      setSignResult(res.data);
      showToast("Transaction signée !");
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur signature", "error");
    } finally {
      setSignLoading(false);
    }
  };

  // Auto-fill verify from sign result
  const autofillVerify = () => {
    if (!signResult) return;
    const acct = accounts.find(a => a.address === signAddr);
    setVPubKey(acct?.publicKey || acct?.clefPublique || "");
    setVExpe(signAddr);
    setVDest(signDest || "self");
    setVQty(signQty);
    setVSig(signResult.signature || "");
    setActiveTab("verify");
  };

  // Verify
  const handleVerify = async () => {
    if (!vPubKey || !vSig) return showToast("Remplissez clé publique et signature", "error");
    setVLoading(true);
    try {
      const res = await apiWallet.verify(vPubKey, vExpe, vDest, parseFloat(vQty) || 0, vSig);
      setVResult(res.data?.valide ?? res.data?.valid ?? res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur vérification", "error");
    } finally {
      setVLoading(false);
    }
  };

  const TABS = [
    { key: "accounts", label: "👤 Comptes", icon: Users },
    { key: "sign",     label: "✍️ Signer",   icon: FileSignature },
    { key: "verify",   label: "🔍 Vérifier", icon: Shield },
  ];

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
            <Users size={26} color="white" />
          </div>
          <div>
            <h1 className="page-title">Accounts</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Gestion des comptes & signatures ECDSA</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button className="btn-secondary" onClick={fetchAccounts}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={15} /> Nouveau Compte
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Comptes", value: accounts.length, color: "var(--gradient-primary)" },
          { label: "Balance Totale (BTC)", value: accounts.reduce((s, a) => s + (a.balance || 0), 0).toFixed(4), color: "var(--accent-green)" },
          { label: "Algorithme", value: "ECDSA secp256r1", color: "var(--accent-purple)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <span className="stat-label">{label}</span>
            <span className="stat-value" style={{ fontSize: "1.2rem", background: typeof color === "string" && color.includes("gradient") ? color : undefined, WebkitBackgroundClip: typeof color === "string" && color.includes("gradient") ? "text" : undefined, WebkitTextFillColor: typeof color === "string" && color.includes("gradient") ? "transparent" : undefined, color: !color.includes("gradient") ? color : undefined }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Create form (inline collapsible) */}
      <AnimatePresence>
        {showCreate && (
          <motion.form
            key="create"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="glass-card"
            style={{ padding: "1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "center", overflow: "hidden", borderColor: "rgba(99,102,241,0.3)" }}
          >
            <Users size={16} style={{ color: "var(--accent-blue-light)", flexShrink: 0 }} />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input-field"
              placeholder="Nom du compte (ex: Alice, Bob…)"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={loading} className="btn-primary" style={{ flexShrink: 0 }}>
              {loading ? "Création…" : "Créer"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flexShrink: 0 }}>✕</button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", background: "rgba(10,14,26,0.5)", padding: "0.3rem", borderRadius: "var(--radius-md)", width: "fit-content" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "calc(var(--radius-md) - 0.15rem)",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.8rem",
              transition: "all 0.2s ease",
              background: activeTab === key ? "var(--gradient-primary)" : "transparent",
              color: activeTab === key ? "white" : "var(--text-muted)",
              boxShadow: activeTab === key ? "0 3px 12px rgba(99,102,241,0.3)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── ACCOUNTS TAB ── */}
        {activeTab === "accounts" && (
          <motion.div key="accounts-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {accounts.length === 0 ? (
              <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Users size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                <p style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem" }}>Aucun compte créé</p>
                <p style={{ fontSize: "0.82rem" }}>Cliquez sur "Nouveau Compte" pour commencer</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem" }}>
                  <thead>
                    <tr>
                      {["Nom", "Adresse", "Clé Publique", "Clé Privée", "Balance", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "0.5rem 1rem", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acct, idx) => (
                      <React.Fragment key={acct.address}>
                        <motion.tr
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          style={{ cursor: "pointer" }}
                          onClick={() => setExpandedAddr(expandedAddr === acct.address ? null : acct.address)}
                        >
                          {/* Nom */}
                          <td style={{ padding: "0.85rem 1rem", background: "var(--bg-card)", borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)", borderLeft: `3px solid hsl(${idx * 47 % 360},70%,55%)` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `hsl(${idx * 47 % 360},70%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "white" }}>
                                {(acct.label || acct.nom || "?")[0].toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{acct.label || acct.nom || "Inconnu"}</span>
                            </div>
                          </td>
                          {/* Adresse */}
                          <td style={{ padding: "0.85rem 1rem", background: "var(--bg-card)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span className="mono" style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{truncate(acct.address, 12)}</span>
                              <button onClick={e => { e.stopPropagation(); copyToClipboard(acct.address, `addr-${acct.address}`); }} style={{ background: "none", border: "none", color: copied === `addr-${acct.address}` ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                                {copied === `addr-${acct.address}` ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          {/* Clé Publique */}
                          <td style={{ padding: "0.85rem 1rem", background: "var(--bg-card)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <Key size={12} style={{ color: "var(--accent-blue-light)", flexShrink: 0 }} />
                              <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{truncate(acct.publicKey || "", 10)}</span>
                              <button onClick={e => { e.stopPropagation(); copyToClipboard(acct.publicKey || "", `pk-${acct.address}`); }} style={{ background: "none", border: "none", color: copied === `pk-${acct.address}` ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                                {copied === `pk-${acct.address}` ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          {/* Clé Privée */}
                          <td style={{ padding: "0.85rem 1rem", background: "var(--bg-card)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <button
                                onClick={e => { e.stopPropagation(); setShowPrivKey(prev => ({ ...prev, [acct.address]: !prev[acct.address] })); }}
                                style={{ background: "none", border: "none", color: showPrivKey[acct.address] ? "var(--accent-yellow)" : "var(--text-muted)", cursor: "pointer", padding: 0, flexShrink: 0 }}
                                title={showPrivKey[acct.address] ? "Masquer la clé privée" : "Révéler la clé privée"}
                              >
                                {showPrivKey[acct.address] ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              {showPrivKey[acct.address] ? (
                                <>
                                  <span className="mono" style={{ fontSize: "0.58rem", color: "var(--accent-yellow)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {acct.privateKey || "—"}
                                  </span>
                                  <button
                                    onClick={e => { e.stopPropagation(); copyToClipboard(acct.privateKey || "", `priv-${acct.address}`); }}
                                    style={{ background: "none", border: "none", color: copied === `priv-${acct.address}` ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", padding: 0 }}
                                  >
                                    {copied === `priv-${acct.address}` ? <Check size={11} /> : <Copy size={11} />}
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>••••••••</span>
                              )}
                            </div>
                          </td>
                          {/* Balance */}
                          <td style={{ padding: "0.85rem 1rem", background: "var(--bg-card)" }}>
                            <span style={{ fontWeight: 800, color: "var(--accent-green)", fontSize: "0.95rem" }}>
                              {(acct.balance || 0).toFixed(4)} <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>BTC</span>
                            </span>
                          </td>
                          {/* Actions */}
                          <td style={{ padding: "0.85rem 1rem", background: "var(--bg-card)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}>
                            <div style={{ display: "flex", gap: "0.4rem" }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleFaucet(acct.address)}
                                className="btn-secondary"
                                style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem", color: "var(--accent-orange)", borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)" }}
                                title="Obtenir 1 BTC de test"
                              >
                                <Droplets size={11} /> Faucet
                              </button>
                              <button
                                onClick={() => { setSignAddr(acct.address); setActiveTab("sign"); }}
                                className="btn-secondary"
                                style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem" }}
                                title="Signer une transaction"
                              >
                                <FileSignature size={11} /> Signer
                              </button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expanded row */}
                        <AnimatePresence>
                          {expandedAddr === acct.address && (
                            <tr key={`expanded-${acct.address}`}>
                              <td colSpan={5} style={{ padding: "0 0.5rem 0.5rem" }}>
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div style={{ padding: "1rem", background: "rgba(10,14,26,0.5)", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                    {[
                                      { label: "Adresse complète", value: acct.address, key: `full-addr-${acct.address}` },
                                      { label: "Clé publique complète", value: acct.publicKey, key: `full-pk-${acct.address}` },
                                      { label: "🔑 Clé privée complète", value: acct.privateKey, key: `full-priv-${acct.address}`, sensitive: true },
                                    ].map(({ label, value, key, sensitive }) => (
                                      <div key={key}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                                          <span className="input-label">{label}</span>
                                          <button onClick={() => copyToClipboard(value || "", key)} style={{ background: "none", border: "none", color: copied === key ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.68rem" }}>
                                            {copied === key ? <Check size={11} /> : <Copy size={11} />}
                                          </button>
                                        </div>
                                        <div className="mono" style={{ fontSize: "0.6rem", wordBreak: "break-all", color: sensitive ? "var(--accent-yellow)" : "var(--text-secondary)", background: sensitive ? "rgba(245,158,11,0.05)" : "rgba(0,0,0,0.2)", padding: "0.6rem", borderRadius: "var(--radius-sm)", border: sensitive ? "1px solid rgba(245,158,11,0.2)" : "none" }}>
                                          {value || "—"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ── SIGN TAB ── */}
        {activeTab === "sign" && (
          <motion.div key="sign-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                ✍️ Signer une Transaction
              </h2>
              <div>
                <label className="input-label">Compte expéditeur</label>
                <div style={{ position: "relative", marginTop: "0.5rem" }}>
                  <select className="input-field" value={signAddr} onChange={e => setSignAddr(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: "2.5rem" }}>
                    <option value="">Choisir un compte…</option>
                    {accounts.map(a => <option key={a.address} value={a.address}>{a.label || a.nom} — {(a.balance || 0).toFixed(4)} BTC</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                </div>
              </div>
              <div>
                <label className="input-label">Destinataire (adresse)</label>
                <div style={{ position: "relative", marginTop: "0.5rem" }}>
                  <select className="input-field" value={signDest} onChange={e => setSignDest(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: "2.5rem", marginBottom: "0.4rem" }}>
                    <option value="">— Sélectionner depuis les comptes —</option>
                    {accounts.filter(a => a.address !== signAddr).map(a => <option key={a.address} value={a.address}>{a.label || a.nom}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: "absolute", right: "0.9rem", top: "1rem", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                </div>
                <input value={signDest} onChange={e => setSignDest(e.target.value)} className="input-field mono" style={{ fontSize: "0.75rem" }} placeholder="ou entrez une adresse manuellement…" />
              </div>
              <div>
                <label className="input-label">Montant (BTC)</label>
                <input type="number" step="0.0001" min="0" value={signQty} onChange={e => setSignQty(e.target.value)} className="input-field" style={{ marginTop: "0.5rem" }} />
              </div>
              <button onClick={handleSign} disabled={signLoading || !signAddr} className="btn-primary">
                <FileSignature size={15} /> {signLoading ? "Signature…" : "Signer la Transaction"}
              </button>
            </div>

            <div>
              {signResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "1.5rem", borderColor: "rgba(16,185,129,0.4)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle size={20} style={{ color: "var(--accent-green)" }} />
                    <h3 style={{ fontWeight: 800, color: "var(--accent-green)" }}>Transaction Signée !</h3>
                  </div>
                  <div style={{ background: "rgba(10,14,26,0.5)", borderRadius: "var(--radius-sm)", padding: "1rem", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span className="input-label" style={{ color: "var(--accent-green)" }}>Signature ECDSA</span>
                      <button onClick={() => copyToClipboard(signResult.signature, "sig")} style={{ background: "none", border: "none", color: copied === "sig" ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.68rem" }}>
                        {copied === "sig" ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                    <div className="mono" style={{ fontSize: "0.6rem", wordBreak: "break-all", color: "var(--accent-green)", lineHeight: 1.8 }}>{signResult.signature}</div>
                  </div>
                  <button onClick={autofillVerify} className="btn-secondary" style={{ fontSize: "0.78rem" }}>
                    <Shield size={13} /> Vérifier cette signature →
                  </button>
                </motion.div>
              ) : (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <FileSignature size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p style={{ fontSize: "0.85rem" }}>La signature apparaîtra ici</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── VERIFY TAB ── */}
        {activeTab === "verify" && (
          <motion.div key="verify-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>🔍 Vérifier une Signature</h2>
              {[
                { label: "Clé Publique", value: vPubKey, set: setVPubKey, placeholder: "Clé publique ECDSA (hex)…", rows: 2 },
                { label: "Expéditeur", value: vExpe, set: setVExpe, placeholder: "Adresse expéditeur…", rows: 1 },
                { label: "Destinataire", value: vDest, set: setVDest, placeholder: "Adresse destinataire…", rows: 1 },
              ].map(({ label, value, set, placeholder, rows }) => (
                <div key={label}>
                  <label className="input-label">{label}</label>
                  <textarea value={value} onChange={e => set(e.target.value)} className="input-field mono" rows={rows} style={{ resize: "none", fontSize: "0.72rem", marginTop: "0.4rem" }} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="input-label">Montant (BTC)</label>
                <input type="number" step="0.0001" value={vQty} onChange={e => setVQty(e.target.value)} className="input-field" style={{ marginTop: "0.4rem" }} />
              </div>
              <div>
                <label className="input-label">Signature</label>
                <textarea value={vSig} onChange={e => setVSig(e.target.value)} className="input-field mono" rows={3} style={{ resize: "none", fontSize: "0.62rem", marginTop: "0.4rem" }} placeholder="Collez la signature ici…" />
              </div>
              <button onClick={handleVerify} disabled={vLoading} className="btn-primary">
                <Shield size={15} /> {vLoading ? "Vérification…" : "Vérifier la Signature"}
              </button>
            </div>

            <div>
              {vResult !== null ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card"
                  style={{ padding: "3rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", borderColor: vResult ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)", background: vResult ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)" }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    {vResult
                      ? <CheckCircle size={72} style={{ color: "var(--accent-green)" }} />
                      : <XCircle size={72} style={{ color: "var(--accent-red)" }} />}
                  </motion.div>
                  <div>
                    <h2 style={{ fontWeight: 900, color: vResult ? "var(--accent-green)" : "var(--accent-red)", fontSize: "1.5rem" }}>
                      {vResult ? "Signature Valide" : "Signature Invalide"}
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
                      {vResult ? "La signature est authentique et correspond à la clé publique." : "La signature ne correspond pas aux données ou à la clé publique."}
                    </p>
                  </div>
                  <span className={`badge badge-${vResult ? "green" : "red"}`}>
                    {vResult ? "✅ AUTHENTIQUE" : "❌ INVALIDE"}
                  </span>
                  <button onClick={() => setVResult(null)} className="btn-secondary" style={{ fontSize: "0.75rem" }}>
                    <RefreshCw size={12} /> Réinitialiser
                  </button>
                </motion.div>
              ) : (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <Shield size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p style={{ fontSize: "0.85rem" }}>Le résultat de vérification apparaîtra ici</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
