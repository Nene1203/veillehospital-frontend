import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Accueil from "./pages/Accueil";
import Dashboard from "./pages/Dashboard";
import Saisie from "./pages/Saisie";
import Login from "./pages/Login";
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
    return <Accueil onNavigate={navigate} />;
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={navigate} user={user} onLogout={logout} />
      <div className="main-content">
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
