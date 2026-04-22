import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Accueil from "./pages/Accueil";
import Dashboard from "./pages/Dashboard";
import Saisie from "./pages/Saisie";
import Login from "./pages/Login";
import "./styles.css";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState("accueil");

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
    if (page === "accueil") return <Accueil onNavigate={setPage} />;
    if (page === "dashboard") return <Dashboard />;
    if (page === "saisie") return <Saisie />;
    return <Accueil onNavigate={setPage} />;
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={setPage} user={user} onLogout={logout} />
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
