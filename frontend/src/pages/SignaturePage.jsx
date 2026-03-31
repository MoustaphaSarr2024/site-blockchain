import React, { useState, useEffect } from "react";
import { PenLine, ShieldCheck, ShieldX, Copy, Check, ChevronDown, RefreshCw, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiWallet } from "../api";

export default function SignaturePage() {
  const [tab, setTab]       = useState("sign");
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState(null);
  const [copied, setCopied] = useState(null);

  // ── Sign tab ──────────────────────────────────────────────────
  const [signAddress, setSignAddress] = useState("");
  const [signMessage, setSignMessage] = useState("Bonjour ! Je suis bien le propriétaire de ce wallet.");
  const [signResult, setSignResult]   = useState(null);

  // ── Verify tab ────────────────────────────────────────────────
  const [verifyPubKey,   setVerifyPubKey]   = useState("");
  const [verifyMessage,  setVerifyMessage]  = useState("");
  const [verifySignature,setVerifySignature]= useState("");
  const [verifyLoading,  setVerifyLoading]  = useState(false);
  const [verifyResult,   setVerifyResult]   = useState(null); // true | false | null

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    apiWallet.getAll().then(r => {
      setWallets(r.data);
      if (r.data.length > 0) setSignAddress(r.data[0].address);
    }).catch(() => {});
  }, []);

  // ── Signer le message ─────────────────────────────────────────
  const handleSign = async () => {
    if (!signAddress)      return showToast("Sélectionnez un compte", "error");
    if (!signMessage.trim()) return showToast("Entrez un message à signer", "error");
    setLoading(true);
    try {
      const res = await apiWallet.signMessage(signAddress, signMessage);
      setSignResult(res.data);
      showToast("Message signé avec succès !");
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur de signature", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Pré-remplir la vérification depuis le résultat de signature ──
  const autofillVerify = () => {
    if (!signResult) return;
    const wallet = wallets.find(w => w.address === signAddress);
    setVerifyPubKey(wallet?.publicKey || "");
    setVerifyMessage(signMessage);
    setVerifySignature(signResult.signature || "");
    setVerifyResult(null);
    setTab("verify");
  };

  // ── Vérifier la signature ──────────────────────────────────────
  const handleVerify = async () => {
    if (!verifyPubKey || !verifyMessage || !verifySignature)
      return showToast("Remplissez tous les champs", "error");
    setVerifyLoading(true);
    try {
      const res = await apiWallet.verifyMessage(verifyPubKey, verifyMessage, verifySignature);
      setVerifyResult(res.data?.valide ?? false);
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur de vérification", "error");
    } finally {
      setVerifyLoading(false);
    }
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
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(168,85,247,0.4)" }}>
          <PenLine size={26} color="white" />
        </div>
        <div>
          <h1 className="page-title">Signature Numérique</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Signer et vérifier des messages avec ECDSA (SHA256withECDSA)
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="glass-card" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", background: "rgba(168,85,247,0.05)", borderColor: "rgba(168,85,247,0.2)" }}>
        <MessageSquare size={18} style={{ color: "var(--accent-purple)", flexShrink: 0 }} />
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--accent-purple)" }}>Comment ça marche :</strong>{" "}
          Choisissez un compte, écrivez un message libre, puis générez une signature ECDSA.
          La signature prouve que vous controllez la clé privée associée à ce compte,{" "}
          <em>sans révéler la clé privée elle-même</em>.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "rgba(10,14,26,0.5)", padding: "0.35rem", borderRadius: "var(--radius-md)", width: "fit-content" }}>
        {[
          { key: "sign",   label: "✍️ Signer"   },
          { key: "verify", label: "🔍 Vérifier" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ padding: "0.6rem 1.5rem", borderRadius: "calc(var(--radius-md) - 0.2rem)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.83rem", transition: "all 0.25s ease", background: tab === key ? "var(--gradient-primary)" : "transparent", color: tab === key ? "white" : "var(--text-muted)", boxShadow: tab === key ? "0 4px 15px rgba(99,102,241,0.3)" : "none" }}
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
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                ✍️ Signer un Message
              </h2>

              {/* Sélection du compte */}
              <div>
                <label className="input-label">1. Choisir un compte (expéditeur)</label>
                <div style={{ position: "relative", marginTop: "0.5rem" }}>
                  <select
                    className="input-field"
                    value={signAddress}
                    onChange={e => setSignAddress(e.target.value)}
                    style={{ cursor: "pointer", paddingRight: "2.5rem", appearance: "none" }}
                  >
                    <option value="">Choisir un compte...</option>
                    {wallets.map(w => (
                      <option key={w.address} value={w.address}>
                        {w.label} — {w.address?.slice(0, 16)}…
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                </div>
                {signAddress && (
                  <div className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.35rem", padding: "0.4rem 0.6rem", background: "rgba(10,14,26,0.3)", borderRadius: "var(--radius-sm)" }}>
                    {wallets.find(w => w.address === signAddress)?.publicKey?.slice(0, 40)}…
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="input-label">2. Écrire le message à signer</label>
                <textarea
                  value={signMessage}
                  onChange={e => setSignMessage(e.target.value)}
                  className="input-field"
                  rows={5}
                  style={{ marginTop: "0.5rem", resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, fontSize: "0.88rem" }}
                  placeholder="Entrez votre message ici..."
                />
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  {signMessage.length} caractère{signMessage.length > 1 ? "s" : ""}
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={loading || !signAddress || !signMessage.trim()}
                className="btn-primary"
              >
                <PenLine size={16} />
                {loading ? "Signature en cours…" : "3. Générer la Signature"}
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
                    style={{ padding: "1.5rem", borderColor: "rgba(16,185,129,0.4)", display: "flex", flexDirection: "column", gap: "1rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <ShieldCheck size={22} style={{ color: "var(--accent-green)" }} />
                      <h2 style={{ fontWeight: 800, color: "var(--accent-green)", fontSize: "0.95rem" }}>Message Signé !</h2>
                    </div>

                    {/* Message signé */}
                    <div style={{ background: "rgba(10,14,26,0.4)", borderRadius: "var(--radius-sm)", padding: "0.75rem", border: "1px solid var(--glass-border)" }}>
                      <span className="input-label">Message</span>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginTop: "0.3rem", lineHeight: 1.6 }}>
                        {signMessage}
                      </div>
                    </div>

                    {/* Signature */}
                    <div style={{ background: "rgba(10,14,26,0.5)", borderRadius: "var(--radius-sm)", padding: "1rem", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span className="input-label" style={{ color: "var(--accent-green)" }}>Signature ECDSA (hex)</span>
                        <button onClick={() => copy(signResult.signature, "sig")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem" }}>
                          {copied === "sig" ? <Check size={12} /> : <Copy size={12} />}
                          {copied === "sig" ? "Copié!" : "Copier"}
                        </button>
                      </div>
                      <div className="mono" style={{ fontSize: "0.6rem", wordBreak: "break-all", color: "var(--accent-green)", lineHeight: 1.8 }}>
                        {signResult.signature}
                      </div>
                    </div>

                    <button onClick={autofillVerify} className="btn-secondary" style={{ fontSize: "0.78rem" }}>
                      <RefreshCw size={13} /> Vérifier cette signature →
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="sig-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-card" style={{ padding: "3rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
                  >
                    <PenLine size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      La signature apparaîtra ici après avoir cliqué sur "Générer la Signature"
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
                🔍 Vérifier une Signature
              </h2>

              <div>
                <label className="input-label">Clé Publique (hex)</label>
                <textarea
                  value={verifyPubKey}
                  onChange={e => setVerifyPubKey(e.target.value)}
                  className="input-field mono"
                  rows={3}
                  style={{ marginTop: "0.5rem", resize: "none", fontSize: "0.65rem" }}
                  placeholder="Clé publique ECDSA en hexadécimal..."
                />
              </div>

              <div>
                <label className="input-label">Message original</label>
                <textarea
                  value={verifyMessage}
                  onChange={e => setVerifyMessage(e.target.value)}
                  className="input-field"
                  rows={4}
                  style={{ marginTop: "0.5rem", resize: "vertical", fontFamily: "inherit", fontSize: "0.88rem", lineHeight: 1.6 }}
                  placeholder="Le message qui a été signé..."
                />
              </div>

              <div>
                <label className="input-label">Signature (hex)</label>
                <textarea
                  value={verifySignature}
                  onChange={e => setVerifySignature(e.target.value)}
                  className="input-field mono"
                  rows={3}
                  style={{ marginTop: "0.5rem", resize: "none", fontSize: "0.62rem" }}
                  placeholder="Signature ECDSA en hexadécimal..."
                />
              </div>

              <button onClick={handleVerify} disabled={verifyLoading} className="btn-primary">
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
                    style={{ padding: "3rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", borderColor: verifyResult ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)", background: verifyResult ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)" }}
                  >
                    {verifyResult ? (
                      <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                          <ShieldCheck size={72} style={{ color: "var(--accent-green)" }} />
                        </motion.div>
                        <div>
                          <h2 style={{ fontWeight: 900, color: "var(--accent-green)", fontSize: "1.5rem" }}>Signature Valide</h2>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
                            La signature correspond bien à ce message et à cette clé publique.
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
                            La signature ne correspond pas au message ou à la clé publique fournie.
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
                  <motion.div key="verify-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-card" style={{ padding: "3rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
                  >
                    <ShieldCheck size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Le résultat de la vérification apparaîtra ici
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      💡 Astuce : après avoir signé, cliquez sur "Vérifier cette signature" pour pré-remplir automatiquement ce formulaire.
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`toast toast-${toast.type}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
