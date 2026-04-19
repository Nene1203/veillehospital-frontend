const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() { return localStorage.getItem("vh_token"); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  });
  if (res.status === 401) { localStorage.removeItem("vh_token"); window.location.reload(); return; }
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || "Erreur API"); }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Établissements ──────────────────────────────────────────
export const getEtablissements = () => request("/etablissements/");

// ─── Campagnes ───────────────────────────────────────────────
export const getCampagnes = () => request("/campagnes/");
export const createCampagne = (data) => request("/campagnes/", { method: "POST", body: JSON.stringify(data) });
export const cloturerCampagne = (id) => request(`/campagnes/${id}/cloturer`, { method: "PATCH" });

// ─── Veilles ─────────────────────────────────────────────────
export const getVeilles = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/veilles/${qs ? "?" + qs : ""}`); };
export const getVeille = (id) => request(`/veilles/${id}`);
export const createVeille = (data) => request("/veilles/", { method: "POST", body: JSON.stringify(data) });
export const updateVeille = (id, data) => request(`/veilles/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const soumettreVeille = (id) => request(`/veilles/${id}/soumettre`, { method: "PATCH" });
export const deleteVeille = (id) => request(`/veilles/${id}`, { method: "DELETE" });

// ─── Filtres en cascade ──────────────────────────────────────
export const getAnneesDisponibles = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/filtres/annees${qs ? "?" + qs : ""}`); };
export const getMoisDisponibles = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/filtres/mois?${qs}`); };
export const getSemainesDisponibles = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/filtres/semaines?${qs}`); };
export const getJoursDisponibles = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/filtres/jours?${qs}`); };

// ─── Dashboard ───────────────────────────────────────────────
export const getKpis = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/kpis${qs ? "?" + qs : ""}`); };
export const getParEtablissement = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/par-etablissement${qs ? "?" + qs : ""}`); };
export const getParPathologie = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/par-pathologie${qs ? "?" + qs : ""}`); };
export const getEvolution = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/dashboard/evolution${qs ? "?" + qs : ""}`); };
