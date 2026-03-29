import React, { useState } from "react";
import { Lock, Mail, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { apiAuth } from "../api";

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = isRegistering
        ? await apiAuth.register(email, password)
        : await apiAuth.login(email, password);

      const data = res.data;

      if (data.success) {
        if (isRegistering) {
          setMessage("✅ Compte créé ! Connectez-vous maintenant.");
          setIsRegistering(false);
          setPassword("");
        } else {
          onLogin({ user: data.user, wallet: data.wallet });
        }
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      console.error("Auth error:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (serverMsg) {
        setMessage("❌ " + serverMsg);
      } else if (err.code === "ERR_NETWORK") {
        setMessage("❌ Le serveur backend n'est pas accessible. Vérifiez qu'il est lancé.");
      } else {
        setMessage("❌ Erreur: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-main)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", zIndex: 10, marginBottom: "2rem" }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "var(--radius-lg)",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem auto",
            boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
          }}
        >
          <ShieldCheck size={36} color="white" />
        </div>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #fff 0%, #a5b4fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          THE MOST
        </h1>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.15em", fontWeight: 500 }}>
          Blockchain Student Platform
        </p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{ zIndex: 10, width: "100%", maxWidth: "420px", padding: "0 1.5rem" }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            padding: "2.5rem",
            boxShadow: "0 25px 80px rgba(0,0,0,0.4), 0 0 60px rgba(99,102,241,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "var(--gradient-primary)",
              borderRadius: "3px 3px 0 0",
            }}
          />

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "0.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            {isRegistering ? "Créer un compte" : "Connexion"}
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              marginBottom: "2rem",
            }}
          >
            {isRegistering ? "Rejoignez la blockchain étudiante" : "Accédez à votre wallet sécurisé"}
          </p>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textAlign: "center",
                marginBottom: "1.5rem",
                background: message.includes("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                border: message.includes("✅") ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
                color: message.includes("✅") ? "var(--accent-green)" : "var(--accent-red)",
              }}
            >
              {message}
            </motion.div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                placeholder="prenom@universite.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                style={{
                  width: "100%",
                  paddingLeft: "44px",
                  paddingRight: "1rem",
                  paddingTop: "0.85rem",
                  paddingBottom: "0.85rem",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                style={{
                  width: "100%",
                  paddingLeft: "44px",
                  paddingRight: "1rem",
                  paddingTop: "0.85rem",
                  paddingBottom: "0.85rem",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "0.9rem",
              fontSize: "0.85rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {loading ? (
              "Chargement..."
            ) : isRegistering ? (
              <>
                <UserPlus size={18} /> S'inscrire
              </>
            ) : (
              <>
                <LogIn size={18} /> Entrer
              </>
            )}
          </button>

          {/* Toggle Link */}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {isRegistering ? "Déjà membre ? " : "Pas encore de wallet ? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMessage("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-blue-light)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {isRegistering ? "Se connecter" : "Créer un compte"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;