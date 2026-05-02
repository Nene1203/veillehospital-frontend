import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ACTION_LABELS = {
  login_success: { label: "Connexion", color: "#059669", bg: "#f0fdf4", icon: "🔓" },
  login_failed: { label: "Échec connexion", color: "#dc2626", bg: "#fef2f2", icon: "🚫" },
  logout: { label: "Déconnexion", color: "#6b7280", bg: "#f9fafb", icon: "🔒" },
  user_created: { label: "Utilisateur créé", color: "#0369a1", bg: "#f0f9ff", icon: "👤" },
  user_updated: { label: "Utilisateur modifié", color: "#7c3aed", bg: "#f5f3ff", icon: "✏️" },
  user_deactivated: { label: "Compte désactivé", color: "#dc2626", bg: "#fef2f2", icon: "⛔" },
  user_reactivated: { label: "Compte réactivé", color: "#059669", bg: "#f0fdf4", icon: "✅" },
  veille_created: { label: "Veille créée", color: "#0369a1", bg: "#f0f9ff", icon: "📋" },
  veille_updated: { label: "Veille modifiée", color: "#7c3aed", bg: "#f5f3ff", icon: "📝" },
  veille_submitted: { label: "Veille soumise", color: "#059669", bg: "#f0fdf4", icon: "📤" },
  veille_deleted: { label: "Veille supprimée", color: "#dc2626", bg: "#fef2f2", icon: "🗑️" },
  campagne_created: { label: "Campagne créée", color: "#0369a1", bg: "#f0f9ff", icon: "📅" },
  campagne_closed: { label: "Campagne clôturée", color: "#6b7280", bg: "#f9fafb", icon: "🔐" },
  access_denied: { label: "Accès refusé", color: "#dc2626", bg: "#fef2f2", icon: "⛔" },
};

const getActionInfo = (action) => ACTION_LABELS[action] || { label: action, color: "#6b7280", bg: "#f9fafb", icon: "📌" };

// Extrait l'email de la cible depuis les détails du log
const getTargetEmail = (log) => {
  if (!log.details) return null;
  // Pour les actions sur users : avant/après contiennent l'email
  if (log.details.apres?.email) return log.details.apres.email;
  if (log.details.avant?.email) return log.details.avant.email;
  // Pour la création : les détails ont directement l'email
  if (log.details.apres?.email) return log.details.apres.email;
  return null;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR");
};

export default function AuditPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState("logs");
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filtres
  const [filterAction, setFilterAction] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [filterErrorCode, setFilterErrorCode] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    const res = await fetch(`${BASE_URL}/audit/stats`, { headers });
    if (res.ok) setStats(await res.json());
  };

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (filterAction) params.append("action", filterAction);
    if (filterEmail) params.append("user_email", filterEmail);
    if (filterDateDebut) params.append("date_debut", filterDateDebut);
    if (filterDateFin) params.append("date_fin", filterDateFin);

    const res = await fetch(`${BASE_URL}/audit/logs?${params}`, { headers });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pages);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const fetchErrors = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (filterErrorCode) params.append("error_code", filterErrorCode);
    if (filterDateDebut) params.append("date_debut", filterDateDebut);
    if (filterDateFin) params.append("date_fin", filterDateFin);

    const res = await fetch(`${BASE_URL}/audit/errors?${params}`, { headers });
    if (res.ok) {
      const data = await res.json();
      setErrors(data.errors);
      setTotalPages(data.pages);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (tab === "logs") fetchLogs();
    else if (tab === "errors") fetchErrors();
  }, [tab, page, filterAction, filterEmail, filterDateDebut, filterDateFin, filterErrorCode]);

  const handleExport = async () => {
    const endpoint = tab === "logs" ? "/audit/logs/export-csv" : "/audit/errors/export-csv";
    const params = new URLSearchParams();
    if (filterDateDebut) params.append("date_debut", filterDateDebut);
    if (filterDateFin) params.append("date_fin", filterDateFin);
    if (filterAction && tab === "logs") params.append("action", filterAction);

    const res = await fetch(`${BASE_URL}${endpoint}?${params}`, { headers });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tab === "logs" ? "audit.csv" : "erreurs.csv";
      a.click();
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>🔍 Audit & Logs</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>Historique complet des activités de la plateforme</p>
        </div>
        <button onClick={handleExport} style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          ⬇️ Exporter CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total logs", value: stats.total_logs, color: "#1a56db", bg: "#eff6ff", icon: "📊" },
            { label: "Connexions aujourd'hui", value: stats.logins_today, color: "#059669", bg: "#f0fdf4", icon: "🔓" },
            { label: "Échecs connexion", value: stats.failed_logins, color: "#dc2626", bg: "#fef2f2", icon: "🚫" },
            { label: "Total erreurs", value: stats.total_errors, color: "#f59e0b", bg: "#fffbeb", icon: "⚠️" },
            { label: "Erreurs serveur", value: stats.errors_500, color: "#dc2626", bg: "#fef2f2", icon: "💥" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${s.color}20` }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { key: "logs", label: "📋 Logs d'audit" },
          { key: "errors", label: "⚠️ Erreurs" },
        ].map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} style={{
            background: tab === t.key ? "#fff" : "transparent",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontWeight: tab === t.key ? 600 : 400, fontSize: 14,
            color: tab === t.key ? "#111827" : "#6b7280", cursor: "pointer",
            boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {tab === "logs" && (
          <>
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
              <option value="">Toutes les actions</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input placeholder="Email utilisateur..." value={filterEmail} onChange={(e) => { setFilterEmail(e.target.value); setPage(1); }}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, minWidth: 200 }} />
          </>
        )}
        {tab === "errors" && (
          <select value={filterErrorCode} onChange={(e) => { setFilterErrorCode(e.target.value); setPage(1); }}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
            <option value="">Tous les codes</option>
            {[401, 403, 404, 422, 500].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <input type="date" value={filterDateDebut} onChange={(e) => { setFilterDateDebut(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
        <input type="date" value={filterDateFin} onChange={(e) => { setFilterDateFin(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
        <button onClick={() => { setFilterAction(""); setFilterEmail(""); setFilterDateDebut(""); setFilterDateFin(""); setFilterErrorCode(""); setPage(1); }}
          style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff", cursor: "pointer", color: "#6b7280" }}>
          Réinitialiser
        </button>
      </div>

      {/* Compteur */}
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
        {total} résultat{total > 1 ? "s" : ""} — Page {page}/{totalPages}
      </div>

      {/* Table Logs */}
      {tab === "logs" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Date/Heure", "Utilisateur", "Action", "Cible", "IP", "Statut", "Détails"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chargement...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Aucun log trouvé</td></tr>
              ) : logs.map((log, i) => {
                const info = getActionInfo(log.action);
                return (
                  <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid #f3f4f6" : "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(log.timestamp)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{log.user_email || <span style={{ color: "#d1d5db" }}>—</span>}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: info.bg, color: info.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {info.icon} {info.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                      {getTargetEmail(log)
                        ? <span style={{ fontStyle: "italic" }}>{getTargetEmail(log)}</span>
                        : <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{log.ip_address || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: log.statut === "success" ? "#f0fdf4" : "#fef2f2", color: log.statut === "success" ? "#059669" : "#dc2626", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {log.statut}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {log.details && (
                        <button onClick={() => setSelectedLog(log)} style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#374151" }}>
                          Voir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Errors */}
      {tab === "errors" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Date/Heure", "Utilisateur", "Code", "Type", "Endpoint", "IP"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chargement...</td></tr>
              ) : errors.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Aucune erreur trouvée</td></tr>
              ) : errors.map((err, i) => (
                <tr key={err.id} style={{ borderBottom: i < errors.length - 1 ? "1px solid #f3f4f6" : "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(err.timestamp)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{err.user_email || <span style={{ color: "#d1d5db" }}>—</span>}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: err.error_code >= 500 ? "#fef2f2" : "#fffbeb", color: err.error_code >= 500 ? "#dc2626" : "#b45309", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                      {err.error_code}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>{err.error_type || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{err.endpoint || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{err.ip_address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}>
            ← Précédent
          </button>
          <span style={{ padding: "8px 16px", fontSize: 14, color: "#374151" }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1 }}>
            Suivant →
          </button>
        </div>
      )}

      {/* Modal détails */}
      {selectedLog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Détails de l'événement</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["Date", formatDate(selectedLog.timestamp)],
                ["Utilisateur", selectedLog.user_email],
                ["Rôle", selectedLog.user_role],
                ["Action", selectedLog.action],
                ["Ressource", selectedLog.resource],
                ["ID Ressource", selectedLog.resource_id],
                ["IP", selectedLog.ip_address],
                ["Statut", selectedLog.statut],
              ].map(([label, value]) => value && (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{label}</span>
                  <span style={{ fontSize: 14, color: "#111827" }}>{value}</span>
                </div>
              ))}
              {selectedLog.details && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>Avant / Après</div>
                  <pre style={{ background: "#f8fafc", borderRadius: 8, padding: 16, fontSize: 12, overflow: "auto", margin: 0, color: "#374151" }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
