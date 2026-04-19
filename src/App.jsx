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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ fontSize: 14, color: "var(--text-hint)" }}>Chargement…</div>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderPage = () => {
    if (page === "accueil") return <Accueil onNavigate={setPage} />;
    if (page === "dashboard") return <Dashboard />;
    if (page === "saisie") return <Saisie />;
  };

  return (
    <div className="app-root">
      <Sidebar currentPage={page} onNavigate={setPage} user={user} onLogout={logout} />
      <main className="app-main">{renderPage()}</main>
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
