import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ROLES = [
  { value: "admin", label: "Administrateur Héviva", color: "#dc2626", bg: "#fef2f2" },
  { value: "dir-hev", label: "Direction Héviva", color: "#7c3aed", bg: "#f5f3ff" },
  { value: "dir-eta", label: "Direction Établissement", color: "#0369a1", bg: "#f0f9ff" },
  { value: "contrib", label: "Contributeur", color: "#059669", bg: "#f0fdf4" },
];

const getRoleInfo = (role) => ROLES.find((r) => r.value === role) || ROLES[3];

export default function Admin() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchUsers = async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, { headers });
    if (res.ok) setUsers(await res.json());
  };

  const fetchEtablissements = async () => {
    const res = await fetch(`${BASE_URL}/etablissements/`, { headers });
    if (res.ok) setEtablissements(await res.json());
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchEtablissements()]).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditUser({ nom: "", prenom: "", email: "", mot_de_passe: "", role: "contrib", etablissement_ids: [] });
    setError("");
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser({ ...user, mot_de_passe: "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const isNew = !editUser.id;
      const url = isNew ? `${BASE_URL}/auth/users` : `${BASE_URL}/auth/users/${editUser.id}`;
      const method = isNew ? "POST" : "PATCH";
      const body = isNew
        ? { nom: editUser.nom, prenom: editUser.prenom, email: editUser.email, mot_de_passe: editUser.mot_de_passe, role: editUser.role, etablissement_ids: editUser.etablissement_ids }
        : { nom: editUser.nom, prenom: editUser.prenom, email: editUser.email, role: editUser.role, actif: editUser.actif, etablissement_ids: editUser.etablissement_ids };

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erreur lors de la sauvegarde");
      }
      setSuccess(isNew ? "Utilisateur créé avec succès !" : "Utilisateur mis à jour !");
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      await fetchUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActif = async (user) => {
    const res = await fetch(`${BASE_URL}/auth/users/${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ actif: !user.actif }),
    });
    if (res.ok) await fetchUsers();
  };

  const toggleEtab = (etabId) => {
    setEditUser((prev) => {
      const ids = prev.etablissement_ids || [];
      return {
        ...prev,
        etablissement_ids: ids.includes(etabId) ? ids.filter((id) => id !== etabId) : [...ids, etabId],
      };
    });
  };

  const filtered = users.filter((u) => {
    const matchSearch = `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>
            ⚙️ Gestion des utilisateurs
          </h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            {users.length} utilisateur{users.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button onClick={openCreate} style={{
          background: "#1a56db", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          + Nouvel utilisateur
        </button>
      </div>

      {/* Success */}
      {success && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#166534", fontSize: 14 }}>
          ✅ {success}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8,
            border: "1px solid #e5e7eb", fontSize: 14, outline: "none",
          }}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff" }}
        >
          <option value="all">Tous les rôles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Utilisateur", "Email", "Rôle", "Établissements", "Statut", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const roleInfo = getRoleInfo(user.role);
              return (
                <tr key={user.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: roleInfo.bg, color: roleInfo.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>
                        {user.prenom[0]}{user.nom[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{user.prenom} {user.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "#6b7280" }}>{user.email}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: roleInfo.bg, color: roleInfo.color,
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>
                    {user.etablissements?.length > 0
                      ? user.etablissements.map((e) => e.nom).join(", ")
                      : <span style={{ color: "#d1d5db" }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: user.actif ? "#f0fdf4" : "#fef2f2",
                      color: user.actif ? "#059669" : "#dc2626",
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>
                      {user.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(user)} style={{
                        background: "#f3f4f6", border: "none", borderRadius: 6,
                        padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500,
                      }}>
                        Modifier
                      </button>
                      <button onClick={() => handleToggleActif(user)} style={{
                        background: user.actif ? "#fef2f2" : "#f0fdf4",
                        color: user.actif ? "#dc2626" : "#059669",
                        border: "none", borderRadius: 6, padding: "6px 12px",
                        fontSize: 12, cursor: "pointer", fontWeight: 500,
                      }}>
                        {user.actif ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && editUser && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
            maxHeight: "90vh", overflowY: "auto", padding: 32,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 24px", color: "#111827" }}>
              {editUser.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Prénom</label>
                <input value={editUser.prenom} onChange={(e) => setEditUser({ ...editUser, prenom: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nom</label>
                <input value={editUser.nom} onChange={(e) => setEditUser({ ...editUser, nom: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} style={inputStyle} />
            </div>

            {!editUser.id && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Mot de passe</label>
                <input type="password" value={editUser.mot_de_passe} onChange={(e) => setEditUser({ ...editUser, mot_de_passe: e.target.value })} style={inputStyle} placeholder="Minimum 8 caractères" />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Rôle</label>
              <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} style={inputStyle}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Description du rôle */}
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#64748b" }}>
              {editUser.role === "admin" && "✅ Accès complet : utilisateurs, paramètres, exports, toutes les données"}
              {editUser.role === "dir-hev" && "📊 Tableaux de bord globaux et exports — lecture seule"}
              {editUser.role === "dir-eta" && "🏥 Accès limité à ses établissements — lecture seule"}
              {editUser.role === "contrib" && "✏️ Saisie et consultation sur ses établissements + exports"}
            </div>

            {/* Établissements (pour dir-eta et contrib) */}
            {["dir-eta", "contrib"].includes(editUser.role) && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Établissements rattachés</label>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, maxHeight: 160, overflowY: "auto" }}>
                  {etablissements.map((etab) => (
                    <label key={etab.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 14,
                    }}>
                      <input
                        type="checkbox"
                        checked={(editUser.etablissement_ids || []).includes(etab.id)}
                        onChange={() => toggleEtab(etab.id)}
                      />
                      {etab.nom}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Statut (seulement en édition) */}
            {editUser.id && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={editUser.actif} onChange={(e) => setEditUser({ ...editUser, actif: e.target.checked })} />
                  <span>Compte actif</span>
                </label>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{
                background: "#f3f4f6", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 500,
              }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                background: "#1a56db", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Sauvegarde..." : editUser.id ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff",
};
