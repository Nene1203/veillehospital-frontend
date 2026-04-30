import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Accueil from "./pages/Accueil";
import Dashboard from "./pages/Dashboard";
import Saisie from "./pages/Saisie";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
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

  const navigate = (p) => {
    window.history.pushState({}, "", `/${p}`);
    setPage(p);
  };

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
    return <Accueil onNavigate={navigate} />;
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={navigate} user={user} onLogout={logout} />
      <div className="main-content" style={{ position: "relative" }}>
        {/* Roue admin en haut à droite */}
        {user.role === "admin" && (
          <button
            onClick={() => navigate("admin")}
            title="Administration"
            style={{
              position: "fixed",
              top: 16,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: page === "admin" ? "#1a56db" : "#f3f4f6",
              color: page === "admin" ? "#fff" : "#6b7280",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (page !== "admin") {
                e.currentTarget.style.background = "#e5e7eb";
                e.currentTarget.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (page !== "admin") {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            ⚙️
          </button>
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
