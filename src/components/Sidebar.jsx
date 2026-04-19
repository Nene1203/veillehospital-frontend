const NAV_ICON = {
  accueil: (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"/></svg>),
  dashboard: (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>),
  saisie: (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12.5V14h1.5l7-7L9 5.5l-7 7zM13.5 4.5l-2-2-1 1 2 2 1-1z"/></svg>),
  campagne: (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="14" height="11" rx="1.5"/><path d="M5 3V2a1 1 0 012 0v1M9 3V2a1 1 0 012 0v1"/></svg>),
  logout: (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/></svg>),
};

export default function Sidebar({ currentPage, onNavigate, user, onLogout }) {
  const initials = user ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase() : "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">VeilleHospital</div>
        <div className="sidebar-logo-sub">Suivi des hospitalisations</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Navigation</div>
        {[
          { id: "accueil", label: "Accueil" },
          { id: "dashboard", label: "Dashboard" },
          { id: "saisie", label: "Nouvelle saisie" },
        ].map((item) => (
          <div
            key={item.id}
            className={`sidebar-item${currentPage === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            {NAV_ICON[item.id]}
            {item.label}
          </div>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="sidebar-section" style={{ marginTop: 10 }}>Administration</div>
            <div className="sidebar-item">
              {NAV_ICON.campagne}
              Campagnes
              <span className="sidebar-badge amber" style={{ marginLeft: "auto" }}>Admin</span>
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{user?.prenom} {user?.nom}</div>
          <div className="sidebar-user-role" style={{ textTransform: "capitalize" }}>{user?.role}</div>
        </div>
        <button
          onClick={onLogout}
          title="Se déconnecter"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-hint)", padding: "4px", display: "flex" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-hint)"}
        >
          {NAV_ICON.logout}
        </button>
      </div>
    </aside>
  );
}
