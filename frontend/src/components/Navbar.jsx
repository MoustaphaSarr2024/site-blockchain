import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Hash, Users, Layers, Pickaxe,
  Database, Coins, Network, Server, Activity, Wallet2, Share2
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "#6366f1", end: true },
  { to: "/basics",    icon: Hash,            label: "Basics",    color: "#f59e0b" },
  { to: "/accounts",  icon: Users,           label: "Accounts",  color: "#818cf8" },
  { to: "/mempool",   icon: Layers,          label: "Mempool",   color: "#22d3ee" },
  { to: "/mining",    icon: Pickaxe,         label: "Mining",    color: "#10b981" },
  { to: "/",          icon: Database,        label: "Explorer",  color: "#a855f7", end: true },
  { to: "/balances",  icon: Coins,           label: "Balances",  color: "#f59e0b" },
  { to: "/consensus", icon: Network,         label: "Consensus", color: "#f97316" },
  { to: "/internals",  icon: Server,    label: "Internals", color: "#64748b" },
  { to: "/merkletree", icon: Share2,    label: "Merkle",    color: "#10b981" },
  { to: "/walletuser", icon: Wallet2,   label: "Wallets",   color: "#a855f7" },
];

const Navbar = () => {
  return (
    <nav
      style={{
        width: "76px",
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--glass-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "1.25rem",
        paddingBottom: "1.25rem",
        gap: "0.2rem",
        position: "relative",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "var(--radius-md)",
          background: "var(--gradient-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
          flexShrink: 0,
        }}
      >
        <Activity size={22} color="white" />
      </div>

      {/* Separator label */}
      <div style={{ fontSize: "0.45rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem", opacity: 0.6 }}>
        
      </div>

      {/* Nav Links */}
      {navItems.map(({ to, icon: Icon, label, end, color }, index) => (
        <React.Fragment key={to + label}>
          {/* Divider before Explorer */}
          {index === 5 && (
            <div style={{ width: "40px", height: "1px", background: "var(--glass-border)", margin: "0.4rem 0" }} />
          )}
          <NavLink
            to={to}
            end={end}
            title={label}
            style={({ isActive }) => ({
              width: "58px",
              height: "58px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.15rem",
              textDecoration: "none",
              transition: "all 0.22s ease",
              background: isActive ? `${color}18` : "transparent",
              border: isActive ? `1px solid ${color}44` : "1px solid transparent",
              color: isActive ? color : "var(--text-muted)",
              boxShadow: isActive ? `0 0 14px ${color}1a` : "none",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={isActive ? 21 : 19} />
                <span
                  style={{
                    fontSize: "0.46rem",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    marginTop: "0.05rem",
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Navbar;
