import React, { useState, useEffect } from "react";
import { PenLine, ShieldCheck, ShieldX, Copy, Check, ChevronDown, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiWallet } from "../api";

export default function SignaturePage() {
  const [tab, setTab] = useState("sign"); // "sign" | "verify"
  const [wallets, setWallets] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [message, setMessage] = useState("Je transfère 0.5 BTC à Alice le 2026-03-04");
  const [destinataire, setDestinataire] = useState("");
  const [quantite, setQuantite] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [signResult, setSignResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(null); // "sig" | "pk"

  // Verify tab
  const [verifyPubKey, setVerifyPubKey] = useState("");
  const [verifyExpéditeur, setVerifyExpéditeur] = useState("");
  const [verifyDestinataire, setVerifyDestinataire] = useState("");
  const [verifyQuantite, setVerifyQuantite] = useState(0.5);
  const [verifySignature, setVerifySignature] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // true | false | null

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    apiWallet.getAll().then((r) => {
      setWallets(r.data);
      if (r.data.length > 0) setSelectedAddress(r.data[0].address);
    }).catch(() => {});
  }, []);

  const handleSign = async () => {
    if (!selectedAddress) return showToast("Sélectionnez un wallet", "error");
    setLoading(true);
    try {
      const res = await apiWallet.sign(selectedAddress, destinataire || "self", quantite);
      setSignResult(res.data);
      showToast("Transaction signée avec succès !");
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur de signature", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifySignature || !verifyPubKey) return showToast("Remplissez tous les champs", "error");
    setVerifyLoading(true);
    try {
      const res = await apiWallet.verify(verifyPubKey, verifyExpéditeur, verifyDestinataire, verifyQuantite, verifySignature);
      setVerifyResult(res.data?.valid ?? res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur de vérification", "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  const autofillVerify = () => {
    if (!signResult) return;
    const wallet = wallets.find((w) => w.address === selectedAddress);
    setVerifyPubKey(wallet?.publicKey || wallet?.clefPublique || "");
    setVerifyExpéditeur(selectedAddress);
    setVerifyDestinataire(destinataire || "self");
    setVerifyQuantite(quantite);
    setVerifySignature(signResult.signature || "");
    setTab("verify");
  };

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="page-container" style={{ overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(168, 85, 247, 0.4)",
          }}
        >
          <PenLine size={26} color="white" />
        </div>
        <div>
          <h1 className="page-title">Signature Numérique</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Signer et vérifier des messages avec ECDSA
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "rgba(10,14,26,0.5)",
          padding: "0.35rem",
          borderRadius: "var(--radius-md)",
          width: "fit-content",
        }}
      >
        {[
          { key: "sign", label: "✍️ Signer", icon: PenLine },
          { key: "verify", label: "🔍 Vérifier", icon: ShieldCheck },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "calc(var(--radius-md) - 0.2rem)",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.83rem",
              transition: "all 0.25s ease",
              background: tab === key ? "var(--gradient-primary)" : "transparent",
              color: tab === key ? "white" : "var(--text-muted)",
              boxShadow: tab === key ? "0 4px 15px rgba(99,102,241,0.3)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── SIGN TAB ── */}
        {tab === "sign" && (
          <motion.div
            key="sign"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
          >
            {/* Form */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                Données de la Transaction
              </h2>

              {/* Wallet selector */}
              <div>
                <label className="input-label">Wallet Signataire (Expéditeur)</label>
                <div style={{ position: "relative", marginTop: "0.5rem" }}>
                  <select
                    className="input-field"
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    style={{ cursor: "pointer", paddingRight: "2.5rem", appearance: "none" }}
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
              </div>

              {/* Destinataire */}
              <div>
                <label className="input-label">Destinataire (adresse ou label)</label>
                <input
                  value={destinataire}
                  onChange={(e) => setDestinataire(e.target.value)}
                  className="input-field mono"
                  style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                  placeholder="Adresse Bitcoin du destinataire..."
                />
              </div>

              {/* Montant */}
              <div>
                <label className="input-label">Montant (BTC)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={quantite}
                  onChange={(e) => setQuantite(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  style={{ marginTop: "0.5rem" }}
                />
              </div>

              <button
                onClick={handleSign}
                disabled={loading || !selectedAddress}
                className="btn-primary"
                style={{ marginTop: "0.5rem" }}
              >
                <PenLine size={16} />
                {loading ? "Signature…" : "Signer la Transaction"}
              </button>
            </div>

            {/* Result */}
            <div>
              <AnimatePresence>
                {signResult ? (
                  <motion.div
                    key="sig-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{
                      padding: "1.5rem",
                      borderColor: "rgba(16,185,129,0.4)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <ShieldCheck size={22} style={{ color: "var(--accent-green)" }} />
                      <h2 style={{ fontWeight: 800, color: "var(--accent-green)", fontSize: "0.95rem" }}>
                        Transaction Signée !
                      </h2>
                    </div>

                    {/* Signature */}
                    <div style={{ background: "rgba(10,14,26,0.5)", borderRadius: "var(--radius-sm)", padding: "1rem", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span className="input-label" style={{ color: "var(--accent-green)" }}>Signature</span>
                        <button onClick={() => copy(signResult.signature, "sig")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem" }}>
                          {copied === "sig" ? <Check size={12} /> : <Copy size={12} />}
                          {copied === "sig" ? "Copié!" : "Copier"}
                        </button>
                      </div>
                      <div className="mono" style={{ fontSize: "0.62rem", wordBreak: "break-all", color: "var(--accent-green)", lineHeight: 1.8 }}>
                        {signResult.signature}
                      </div>
                    </div>

                    {/* Info */}
                    {[
                      { label: "Expéditeur", value: selectedAddress, color: "var(--accent-blue-light)" },
                      { label: "Destinataire", value: destinataire || "self", color: "var(--text-secondary)" },
                      { label: "Montant", value: `${quantite} BTC`, color: "var(--accent-yellow)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{label}</span>
                        <span className="mono" style={{ color, fontSize: "0.72rem", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                      </div>
                    ))}

                    <button onClick={autofillVerify} className="btn-secondary" style={{ fontSize: "0.78rem" }}>
                      <RefreshCw size={13} /> Vérifier cette signature
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="sig-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card"
                    style={{
                      padding: "3rem 2rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <PenLine size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      La signature apparaîtra ici une fois générée
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── VERIFY TAB ── */}
        {tab === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
          >
            {/* Form */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                Données à Vérifier
              </h2>

              {[
                { label: "Clé Publique", value: verifyPubKey, set: setVerifyPubKey, mono: true, placeholder: "Clé publique ECDSA (hex)..." },
                { label: "Expéditeur", value: verifyExpéditeur, set: setVerifyExpéditeur, mono: true, placeholder: "Adresse de l'expéditeur..." },
                { label: "Destinataire", value: verifyDestinataire, set: setVerifyDestinataire, mono: true, placeholder: "Adresse du destinataire..." },
              ].map(({ label, value, set, mono, placeholder }) => (
                <div key={label}>
                  <label className="input-label">{label}</label>
                  <textarea
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={`input-field ${mono ? "mono" : ""}`}
                    rows={2}
                    style={{ marginTop: "0.5rem", resize: "none", fontSize: "0.72rem" }}
                    placeholder={placeholder}
                  />
                </div>
              ))}

              <div>
                <label className="input-label">Montant (BTC)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={verifyQuantite}
                  onChange={(e) => setVerifyQuantite(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  style={{ marginTop: "0.5rem" }}
                />
              </div>

              <div>
                <label className="input-label">Signature</label>
                <textarea
                  value={verifySignature}
                  onChange={(e) => setVerifySignature(e.target.value)}
                  className="input-field mono"
                  rows={3}
                  style={{ marginTop: "0.5rem", resize: "none", fontSize: "0.65rem" }}
                  placeholder="Collez la signature ici..."
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={verifyLoading}
                className="btn-primary"
              >
                <ShieldCheck size={16} />
                {verifyLoading ? "Vérification…" : "Vérifier la Signature"}
              </button>
            </div>

            {/* Verify result */}
            <div>
              <AnimatePresence>
                {verifyResult !== null ? (
                  <motion.div
                    key={verifyResult ? "valid" : "invalid"}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card"
                    style={{
                      padding: "3rem 2rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1.25rem",
                      borderColor: verifyResult ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
                      background: verifyResult ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                    }}
                  >
                    {verifyResult ? (
                      <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                          <ShieldCheck size={72} style={{ color: "var(--accent-green)" }} />
                        </motion.div>
                        <div>
                          <h2 style={{ fontWeight: 900, color: "var(--accent-green)", fontSize: "1.5rem" }}>Signature Valide</h2>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
                            La signature correspond à la clé publique et aux données.
                          </p>
                        </div>
                        <span className="badge badge-green">✅ AUTHENTIQUE</span>
                      </>
                    ) : (
                      <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                          <ShieldX size={72} style={{ color: "var(--accent-red)" }} />
                        </motion.div>
                        <div>
                          <h2 style={{ fontWeight: 900, color: "var(--accent-red)", fontSize: "1.5rem" }}>Signature Invalide</h2>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
                            La signature ne correspond pas aux données ou à la clé publique.
                          </p>
                        </div>
                        <span className="badge badge-red">❌ INVALIDE</span>
                      </>
                    )}
                    <button onClick={() => setVerifyResult(null)} className="btn-secondary" style={{ fontSize: "0.75rem" }}>
                      <RefreshCw size={13} /> Réinitialiser
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="verify-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card"
                    style={{
                      padding: "3rem 2rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <ShieldCheck size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Le résultat de la vérification apparaîtra ici
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
