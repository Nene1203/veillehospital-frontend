import { useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Accueil from "./pages/Accueil";
import Dashboard from "./pages/Dashboard";
import Saisie from "./pages/Saisie";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AuditPage from "./pages/AuditPage";
import "./styles.css";
import CarteVaud from "./pages/CarteVaud";
import ComparaisonEtabs from "./pages/ComparaisonEtabs";
import Alertes from "./pages/Alertes";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState(() => {
    const path = window.location.pathname.replace("/", "").trim();
    return path || "accueil";
  });
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const menuRef = useRef(null);

  const navigate = (p) => {
    window.history.pushState({}, "", `/${p}`);
    setPage(p);
    setShowAdminMenu(false);
  };

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FA" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="spinner" />
          <div style={{ fontSize: 13, color: "#ADB5BD" }}>Chargement…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderPage = () => {
    if (page === "accueil") return <Accueil onNavigate={navigate} />;
    if (page === "dashboard") return <Dashboard />;
    if (page === "saisie") return <Saisie />;
    if (page === "carte") return <CarteVaud />;
    if (page === "comparaison") return <ComparaisonEtabs />;
    if (page === "alertes") return <Alertes onNavigate={navigate} />;
    if (page === "admin" && user.role === "admin") return <Admin />;
    if (page === "audit" && user.role === "admin") return <AuditPage />;
    return <Accueil onNavigate={navigate} />;
  };

  const isAdminPage = page === "admin" || page === "audit";

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={navigate} user={user} onLogout={logout} />
      <div className="main-content" style={{ position: "relative", paddingRight: "60px" }}>

        {/* Roue admin avec menu déroulant */}
        {user.role === "admin" && (
          <div ref={menuRef} style={{ position: "fixed", top: 16, right: 20, zIndex: 200 }}>
            {/* Bouton roue */}
            <button
              onClick={() => setShowAdminMenu((v) => !v)}
              title="Administration"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: isAdminPage || showAdminMenu ? "#1a56db" : "#f3f4f6",
                color: isAdminPage || showAdminMenu ? "#fff" : "#6b7280",
                border: "none", cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                transition: "all 0.2s",
              }}
            >
              ⚙️
            </button>

            {/* Menu déroulant */}
            {showAdminMenu && (
              <div style={{
                position: "absolute", top: 48, right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "1px solid #e5e7eb",
                minWidth: 220, overflow: "hidden",
                animation: "fadeIn 0.15s ease",
              }}>
                {/* Header menu */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Administration
                  </div>
                </div>

                {/* Lien Gestion utilisateurs */}
                <button
                  onClick={() => navigate("admin")}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", background: page === "admin" ? "#eff6ff" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    borderLeft: page === "admin" ? "3px solid #1a56db" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (page !== "admin") e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={(e) => { if (page !== "admin") e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 18 }}>👤</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: page === "admin" ? "#1a56db" : "#111827" }}>
                      Gestion des utilisateurs
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      Créer, modifier, désactiver
                    </div>
                  </div>
                </button>

                {/* Lien Audit */}
                <button
                  onClick={() => navigate("audit")}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", background: page === "audit" ? "#eff6ff" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    borderLeft: page === "audit" ? "3px solid #1a56db" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (page !== "audit") e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={(e) => { if (page !== "audit") e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 18 }}>🔍</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: page === "audit" ? "#1a56db" : "#111827" }}>
                      Audit & Logs
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      Activité et erreurs plateforme
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {renderPage()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
