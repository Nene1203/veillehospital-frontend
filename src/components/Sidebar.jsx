import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const HexLogo = () => (
  <svg viewBox="0 0 48 48" fill="none" className="sidebar-logo-icon">
    <polygon points="24,3 43,13 43,35 24,45 5,35 5,13" fill="#E6F7F6" />
    <polygon points="24,8 38,16 38,32 24,40 10,32 10,16" fill="#00A89D" opacity="0.3" />
    <polygon points="24,13 36,20 36,32 24,38 12,32 12,20" fill="#00A89D" />
    <polygon points="29,13 36,20 36,26 24,26 24,13" fill="#8DC63F" />
  </svg>
);

const IconHome = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const IconDashboard = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM2 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zm6 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2zm6 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM2 16a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zm6 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2z" />
  </svg>
);

const IconEdit = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const IconClipboard = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
);

const IconLogout = () => (
  <svg className="sidebar-logout" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.prenom && user?.nom
    ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "SA";

  const navItems = [
    { path: "/", label: "Accueil", icon: <IconHome /> },
    { path: "/dashboard", label: "Dashboard", icon: <IconDashboard />, dot: true },
    { path: "/saisie", label: "Nouvelle saisie", icon: <IconEdit /> },
  ];

  const adminItems = [
    { path: "/campagnes", label: "Campagnes", icon: <IconClipboard />, badge: "Admin" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HexLogo />
          <div>
            <div className="sidebar-brand">HévivA</div>
            <div className="sidebar-tagline">Des liens. Des lieux. La vie !</div>
          </div>
        </div>
        <div className="sidebar-platform">Plateforme de veille</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
            {item.dot && location.pathname === item.path && <span className="nav-dot" />}
          </div>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Administration</div>
        {adminItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="sidebar-user-name">
            {user?.prenom ? `${user.prenom} ${user.nom}` : "Super Admin"}
          </div>
          <div className="sidebar-user-role">
            {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
          </div>
        </div>
        <IconLogout onClick={logout} title="Se déconnecter" />
      </div>
    </aside>
  );
}
