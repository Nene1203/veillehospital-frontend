import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Coordonnées GPS pré-géocodées pour le canton de Vaud ──────
const COORDS_MAP = {
  "EMS Bléchérette":                              [46.5350, 6.6330],
  "EMS Bru":                                      [46.8100, 6.6450],
  "Fondation Les Châteaux site de Goumoens-La-Ville": [46.6630, 6.6120],
  "Fondation Les Châteaux site d'Echallens":      [46.6380, 6.6380],
  "CAT Au Fil du Talent":                         [46.7280, 6.6760],
  "CAT Bellevue":                                 [46.4350, 6.2200],
  "CAT La Combaz":                                [46.4180, 6.2660],
  "CAT Le Verney":                                [46.4500, 6.3320],
  "CAT Noumea":                                   [46.6380, 6.6390],
  "CAT RSBJ":                                     [46.8200, 6.4980],
  "CAT de Lavaux":                                [46.4950, 6.7270],
  "CAT – Logements protégés Bléchérette":         [46.5355, 6.6335],
  "EMS Bellevue":                                 [46.4360, 6.2210],
  "EMS Le Pavillon":                              [46.4940, 6.7280],
  "EMS Le Signal":                                [46.5850, 6.7550],
  "EMS Le Tilleul":                               [46.5520, 6.6430],
  "EMS Les Lusiades – Résidence Les Preyades":    [46.5070, 6.4920],
  "EMS et CAT Plein-Soleil":                      [46.5510, 6.6420],
  "EPSM Le Rôtillon":                             [46.5190, 6.6290],
  "Fondation EMS La Venoge":                      [46.6750, 6.5680],
  "Fondation Morija":                             [46.7780, 6.6410],
  "La Cité des Inventions":                       [46.5230, 6.5620],
  "Logement Protégés Maupas":                     [46.4570, 6.3400],
  "Logements protégés La Combaz":                 [46.4190, 6.2670],
  "Logements protégés Les Falaises, Fondation Clémence": [46.5210, 6.6350],
  "Résidence Les Dyades / Les Myriades / Les Thyades": [46.7790, 6.6420],
  "Résidence Praz-Joret":                         [46.5870, 6.7490],
  "Résidence Pré de la Tour":                     [46.5680, 6.5850],
  "CAT L'étoile":                                 [46.5220, 6.6300],
  "EMS L'arbre de vie":                           [46.8210, 6.4990],
  "Pôle Santé Pays d'En Haut – CAT Les Papillons":[46.4730, 7.1350],
  "Pôle Santé du Pays-d'Enhaut – EMS Résidence Les Gentianes": [46.4740, 7.1360],
};

// Trouver les coordonnées par correspondance approximative du nom
function findCoords(nom) {
  // Correspondance exacte
  if (COORDS_MAP[nom]) return COORDS_MAP[nom];
  // Correspondance partielle (nettoyage des caractères spéciaux)
  const nomNorm = nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const [key, val] of Object.entries(COORDS_MAP)) {
    const keyNorm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (keyNorm === nomNorm) return val;
    if (nomNorm.includes(keyNorm.substring(0, 12)) || keyNorm.includes(nomNorm.substring(0, 12))) {
      return val;
    }
  }
  // Fallback centre Vaud
  return [46.5700, 6.5200];
}

// Couleur selon taux de remplissage simulé
function getTauxColor(taux) {
  if (taux >= 95) return { color: "#EF4444", label: "Tension critique", bg: "#FEF2F2" };
  if (taux >= 85) return { color: "#F59E0B", label: "Quasi plein", bg: "#FFFBEB" };
  if (taux >= 70) return { color: "#00A89D", label: "Normal", bg: "#E6F7F6" };
  return { color: "#8DC63F", label: "Capacité disponible", bg: "#F2F9E8" };
}

// Type d'établissement
function getType(nom) {
  const n = nom.toUpperCase();
  if (n.includes("EMS")) return "EMS";
  if (n.includes("CAT")) return "CAT";
  if (n.includes("EPSM")) return "EPSM";
  if (n.includes("LOGEMENT") || n.includes("LOG")) return "LOG";
  if (n.includes("RÉSIDENCE") || n.includes("RESIDENCE")) return "RES";
  if (n.includes("FONDATION")) return "FON";
  return "AUT";
}

export default function CarteVaud() {
  const { token } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [etablissements, setEtablissements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("TOUS");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rouge: 0, orange: 0, vert: 0, lime: 0 });

  // Charger les établissements
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/etablissements/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        // Enrichir avec coords et taux simulé
        const enriched = data.map((e) => {
          const taux = Math.floor(60 + Math.random() * 40);
          const coords = findCoords(e.nom);
          return { ...e, taux, coords, type: getType(e.nom) };
        });
        setEtablissements(enriched);

        // Stats
        const s = { rouge: 0, orange: 0, vert: 0, lime: 0 };
        enriched.forEach((e) => {
          if (e.taux >= 95) s.rouge++;
          else if (e.taux >= 85) s.orange++;
          else if (e.taux >= 70) s.vert++;
          else s.lime++;
        });
        setStats(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Initialiser la carte Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Charger Leaflet dynamiquement
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => {
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [46.6, 6.6],
        zoom: 9,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapRef.current]);

  // Mettre à jour les marqueurs quand les données changent
  useEffect(() => {
    if (!mapInstanceRef.current || etablissements.length === 0) return;
    const L = window.L;
    if (!L) return;

    // Nettoyer anciens marqueurs
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = filter === "TOUS"
      ? etablissements
      : etablissements.filter((e) => e.type === filter);

    filtered.forEach((etab) => {
      const { color } = getTauxColor(etab.taux);

      // Marqueur SVG personnalisé
      const svgIcon = L.divIcon({
        html: `
          <div style="position:relative">
            <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
                fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="18" cy="18" r="8" fill="white" opacity="0.9"/>
              <text x="18" y="22" text-anchor="middle" font-size="9" font-weight="bold"
                fill="${color}" font-family="sans-serif">${etab.type}</text>
            </svg>
          </div>
        `,
        className: "",
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44],
      });

      const marker = L.marker(etab.coords, { icon: svgIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <div style="background:${color};color:white;padding:8px 12px;margin:-14px -20px 10px;border-radius:4px 4px 0 0">
              <strong style="font-size:13px">${etab.nom}</strong>
            </div>
            <div style="padding:0 4px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="color:#64748B;font-size:12px">Taux de remplissage</span>
                <strong style="color:${color};font-size:14px">${etab.taux}%</strong>
              </div>
              <div style="background:#F1F5F9;border-radius:6px;height:8px;margin-bottom:8px">
                <div style="background:${color};width:${etab.taux}%;height:8px;border-radius:6px"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748B">
                <span>🛏 ${etab.nb_lits} lits</span>
                <span>📞 ${etab.telephone}</span>
              </div>
              <div style="margin-top:8px;padding:4px 8px;background:${getTauxColor(etab.taux).bg};
                border-radius:4px;font-size:11px;color:${color};font-weight:600;text-align:center">
                ${getTauxColor(etab.taux).label}
              </div>
            </div>
          </div>
        `, { maxWidth: 260 })
        .on("click", () => setSelected(etab));

      markersRef.current.push(marker);
    });
  }, [etablissements, filter, mapInstanceRef.current]);

  const types = ["TOUS", "EMS", "CAT", "EPSM", "LOG", "RES", "FON"];

  return (
    <div style={{ padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A2332", margin: "0 0 4px" }}>
          Carte du réseau HévivA
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Vue géographique des {etablissements.length} établissements — Canton de Vaud
        </p>
      </div>

      {/* Statuts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Tension critique", count: stats.rouge, color: "#EF4444", bg: "#FEF2F2" },
          { label: "Quasi plein", count: stats.orange, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Normal", count: stats.vert, color: "#00A89D", bg: "#E6F7F6" },
          { label: "Capacité dispo.", count: stats.lime, color: "#8DC63F", bg: "#F2F9E8" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.color}30`,
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: s.color, flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.count}
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres par type */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: filter === t ? "none" : "1px solid #E2E8F0",
              background: filter === t ? "#00A89D" : "white",
              color: filter === t ? "white" : "#64748B",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t === "TOUS" ? "Tous les établissements" : t}
            {t !== "TOUS" && (
              <span style={{ marginLeft: 5, opacity: 0.8 }}>
                ({etablissements.filter((e) => e.type === t).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Layout carte + panneau latéral */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Carte */}
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden",
          border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {loading && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, fontSize: 14, color: "#64748B",
            }}>
              Chargement de la carte…
            </div>
          )}
          <div ref={mapRef} style={{ height: 520, width: "100%" }} />
        </div>

        {/* Panneau latéral */}
        <div style={{
          background: "white", borderRadius: 12, border: "1px solid #E2E8F0",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          {/* Légende */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2332", marginBottom: 10,
              textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Légende
            </div>
            {[
              { color: "#EF4444", label: "≥ 95% — Tension critique" },
              { color: "#F59E0B", label: "85–94% — Quasi plein" },
              { color: "#00A89D", label: "70–84% — Normal" },
              { color: "#8DC63F", label: "< 70% — Capacité disponible" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center",
                gap: 8, marginBottom: 6 }}>
                <svg width="16" height="20" viewBox="0 0 36 44">
                  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
                    fill={l.color} stroke="white" strokeWidth="2"/>
                </svg>
                <span style={{ fontSize: 11, color: "#64748B" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Établissement sélectionné ou liste */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
            {selected ? (
              <div style={{ padding: "0 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2332",
                    lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
                    {selected.nom}
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "#94A3B8", fontSize: 16, padding: 0 }}>✕</button>
                </div>

                {/* Taux de remplissage */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>Taux de remplissage</span>
                    <strong style={{ color: getTauxColor(selected.taux).color, fontSize: 16 }}>
                      {selected.taux}%
                    </strong>
                  </div>
                  <div style={{ background: "#F1F5F9", borderRadius: 6, height: 10 }}>
                    <div style={{
                      background: getTauxColor(selected.taux).color,
                      width: `${selected.taux}%`, height: 10, borderRadius: 6,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{
                    marginTop: 6, padding: "3px 8px",
                    background: getTauxColor(selected.taux).bg,
                    borderRadius: 4, fontSize: 11,
                    color: getTauxColor(selected.taux).color, fontWeight: 600,
                    display: "inline-block",
                  }}>
                    {getTauxColor(selected.taux).label}
                  </div>
                </div>

                {/* Infos */}
                {[
                  { icon: "🛏", label: "Lits", val: selected.nb_lits },
                  { icon: "🏷", label: "Type", val: selected.type },
                  { icon: "📞", label: "Tél.", val: selected.telephone },
                ].map((info) => (
                  <div key={info.label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "7px 0", borderBottom: "1px solid #F1F5F9",
                    fontSize: 12,
                  }}>
                    <span style={{ color: "#64748B" }}>{info.icon} {info.label}</span>
                    <span style={{ fontWeight: 600, color: "#1A2332" }}>{info.val}</span>
                  </div>
                ))}

                {/* Lits occupés simulés */}
                <div style={{ marginTop: 12, padding: 10,
                  background: "#F8F9FA", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>
                    Occupation estimée
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1A2332" }}>
                    {Math.round(selected.nb_lits * selected.taux / 100)}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "#64748B" }}>
                      /{selected.nb_lits} lits
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Liste compacte */
              (filter === "TOUS" ? etablissements : etablissements.filter(e => e.type === filter))
                .sort((a, b) => b.taux - a.taux)
                .map((e) => {
                  const { color } = getTauxColor(e.taux);
                  return (
                    <div key={e.id}
                      onClick={() => {
                        setSelected(e);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView(e.coords, 13);
                        }
                      }}
                      style={{
                        padding: "8px 16px", cursor: "pointer",
                        borderBottom: "1px solid #F8F9FA",
                        display: "flex", alignItems: "center", gap: 10,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = "#F8F9FA"}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = "white"}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: color, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#1A2332",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.nom}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>
                          {e.type} · {e.nb_lits} lits
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
                        {e.taux}%
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
