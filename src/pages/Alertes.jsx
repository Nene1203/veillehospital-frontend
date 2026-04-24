import { useState, useEffect } from "react";
import { getEtablissements, getKpis, getParEtablissement, getAnneesDisponibles } from "../data/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Niveaux d'alerte ──────────────────────────────────────────
const LEVELS = {
  critique: { label: "Critique",  color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "🔴" },
  warning:  { label: "Attention", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "🟠" },
  info:     { label: "Info",      color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", icon: "🔵" },
  ok:       { label: "Normal",    color: "#00A89D", bg: "#E6F7F6", border: "#B2E4E1", icon: "🟢" },
};

function AlertCard({ alerte, onNavigate }) {
  const level = LEVELS[alerte.level] || LEVELS.info;
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: level.bg,
      border: `1px solid ${level.border}`,
      borderLeft: `4px solid ${level.color}`,
      borderRadius: 10,
      padding: "14px 16px",
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{level.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2332" }}>
                {alerte.etablissement}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                borderRadius: 10, background: level.color, color: "white",
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                {level.label}
              </span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>{alerte.type}</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
              {alerte.message}
            </div>
            {alerte.detail && expanded && (
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                {alerte.detail}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
          {alerte.valeur != null && (
            <span style={{ fontSize: 16, fontWeight: 800, color: level.color }}>
              {alerte.valeur}{alerte.unite || ""}
            </span>
          )}
          {alerte.detail && (
            <button onClick={() => setExpanded(!expanded)} style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 6,
              border: `1px solid ${level.border}`, background: "white",
              color: level.color, cursor: "pointer", fontWeight: 600,
            }}>
              {expanded ? "Moins" : "Détail"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${color}30`,
      borderRadius: 10, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Alertes({ onNavigate }) {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filterLevel, setFilterLevel] = useState("tous");
  const [annee, setAnnee] = useState("");
  const [annees, setAnnees] = useState([]);

  useEffect(() => {
    getAnneesDisponibles().then((ans) => {
      setAnnees(ans);
      if (ans.length > 0) setAnnee(String(ans[0]));
    });
  }, []);

  useEffect(() => {
    if (!annee) return;
    analyserAlertes();
  }, [annee]);

  const analyserAlertes = async () => {
    setLoading(true);
    try {
      const [etabs, statsEtabs] = await Promise.all([
        getEtablissements(),
        getParEtablissement(annee ? { annee } : {}),
      ]);

      const nouvAlerts = [];

      // ── 1. Taux de remplissage critique ─────────────────────
      statsEtabs.forEach((stat) => {
        if (!stat.taux_remplissage) return;
        if (stat.taux_remplissage >= 95) {
          nouvAlerts.push({
            id: `taux-critique-${stat.etablissement_id}`,
            level: "critique",
            type: "Capacité",
            etablissement: stat.etablissement_nom,
            message: `Taux de remplissage critique — capacité presque atteinte`,
            detail: `Taux actuel : ${stat.taux_remplissage}%. Au-delà de 95%, l'établissement risque de ne plus pouvoir accueillir de nouveaux patients. Une action corrective est recommandée.`,
            valeur: stat.taux_remplissage,
            unite: "%",
          });
        } else if (stat.taux_remplissage >= 85) {
          nouvAlerts.push({
            id: `taux-warning-${stat.etablissement_id}`,
            level: "warning",
            type: "Capacité",
            etablissement: stat.etablissement_nom,
            message: `Taux de remplissage élevé — situation à surveiller`,
            detail: `Taux actuel : ${stat.taux_remplissage}%. Le seuil critique de 95% pourrait être atteint prochainement.`,
            valeur: stat.taux_remplissage,
            unite: "%",
          });
        }
      });

      // ── 2. Durée de séjour anormalement longue ──────────────
      const dureesValides = statsEtabs.filter((s) => s.duree_moyenne).map((s) => s.duree_moyenne);
      if (dureesValides.length > 0) {
        const moyDuree = dureesValides.reduce((a, b) => a + b, 0) / dureesValides.length;
        const seuilDuree = moyDuree * 1.5;
        statsEtabs.forEach((stat) => {
          if (stat.duree_moyenne && stat.duree_moyenne > seuilDuree) {
            nouvAlerts.push({
              id: `duree-${stat.etablissement_id}`,
              level: "warning",
              type: "Durée séjour",
              etablissement: stat.etablissement_nom,
              message: `Durée moyenne de séjour anormalement longue`,
              detail: `Durée actuelle : ${stat.duree_moyenne}j. Moyenne du réseau : ${moyDuree.toFixed(1)}j. Cet établissement dépasse de ${((stat.duree_moyenne - moyDuree) / moyDuree * 100).toFixed(0)}% la moyenne.`,
              valeur: stat.duree_moyenne,
              unite: "j",
            });
          }
        });
      }

      // ── 3. Taux de réhospitalisation élevé ──────────────────
      statsEtabs.forEach((stat) => {
        if (!stat.hospitalisations || stat.hospitalisations === 0) return;
        const tauxRehospit = (stat.rehospitalisations / stat.hospitalisations) * 100;
        if (tauxRehospit >= 15) {
          nouvAlerts.push({
            id: `rehospit-${stat.etablissement_id}`,
            level: tauxRehospit >= 20 ? "critique" : "warning",
            type: "Réhospitalisation",
            etablissement: stat.etablissement_nom,
            message: `Taux de réhospitalisation élevé — qualité des soins à vérifier`,
            detail: `${stat.rehospitalisations} réhospitalisations sur ${stat.hospitalisations} hospitalisations (${tauxRehospit.toFixed(1)}%). Le seuil d'alerte est fixé à 15%.`,
            valeur: tauxRehospit.toFixed(1),
            unite: "%",
          });
        }
      });

      // ── 4. Établissements sans données ──────────────────────
      const sansData = statsEtabs.filter((s) => s.hospitalisations === 0);
      sansData.forEach((stat) => {
        nouvAlerts.push({
          id: `nodata-${stat.etablissement_id}`,
          level: "info",
          type: "Saisie manquante",
          etablissement: stat.etablissement_nom,
          message: `Aucune donnée saisie pour la période sélectionnée`,
          detail: `Cet établissement n'a pas saisi de veille pour ${annee ? `l'année ${annee}` : "la période sélectionnée"}. Vérifiez si la saisie est à jour.`,
          valeur: null,
          unite: "",
        });
      });

      // ── 5. Taux de transferts élevé ─────────────────────────
      statsEtabs.forEach((stat) => {
        if (!stat.hospitalisations || stat.hospitalisations === 0) return;
        const tauxTransferts = (stat.transferts / stat.hospitalisations) * 100;
        if (tauxTransferts >= 10) {
          nouvAlerts.push({
            id: `transfert-${stat.etablissement_id}`,
            level: "info",
            type: "Transferts",
            etablissement: stat.etablissement_nom,
            message: `Taux de transferts inhabituellement élevé`,
            detail: `${stat.transferts} transferts sur ${stat.hospitalisations} hospitalisations (${tauxTransferts.toFixed(1)}%). Cela peut indiquer un manque de capacité ou de compétences spécifiques.`,
            valeur: tauxTransferts.toFixed(1),
            unite: "%",
          });
        }
      });

      // Trier : critique > warning > info
      const order = { critique: 0, warning: 1, info: 2, ok: 3 };
      nouvAlerts.sort((a, b) => order[a.level] - order[b.level]);

      setAlertes(nouvAlerts);
      setLastUpdate(new Date().toLocaleTimeString("fr-CH"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterLevel === "tous"
    ? alertes
    : alertes.filter((a) => a.level === filterLevel);

  const counts = {
    critique: alertes.filter((a) => a.level === "critique").length,
    warning:  alertes.filter((a) => a.level === "warning").length,
    info:     alertes.filter((a) => a.level === "info").length,
  };

  const fStyle = {
    fontSize: 12, padding: "7px 12px",
    border: "1px solid #E2E8F0", borderRadius: 6,
    background: "#FFFFFF", color: "#495057",
    fontFamily: "inherit", outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A2332", margin: "0 0 4px" }}>
            Alertes & Anomalies
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Détection automatique des situations à surveiller sur le réseau HévivA
            {lastUpdate && <span style={{ color: "#ADB5BD" }}> · Mis à jour à {lastUpdate}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select style={fStyle} value={annee} onChange={(e) => setAnnee(e.target.value)}>
            {annees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={analyserAlertes} style={{
            fontSize: 12, padding: "7px 14px", borderRadius: 6,
            border: "none", background: "#00A89D", color: "white",
            fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6,
          }}>
            ↻ Actualiser
          </button>
        </div>
      </div>

      {/* Compteurs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Alertes critiques"  value={counts.critique} color="#EF4444" bg="#FEF2F2" icon="🔴" />
        <StatCard label="Avertissements"     value={counts.warning}  color="#F59E0B" bg="#FFFBEB" icon="🟠" />
        <StatCard label="Informations"       value={counts.info}     color="#6366F1" bg="#EEF2FF" icon="🔵" />
        <StatCard label="Total alertes"      value={alertes.length}  color="#64748B" bg="#F8F9FA" icon="📋" />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "tous",     label: `Toutes (${alertes.length})`,         color: "#64748B" },
          { key: "critique", label: `Critiques (${counts.critique})`,     color: "#EF4444" },
          { key: "warning",  label: `Avertissements (${counts.warning})`, color: "#F59E0B" },
          { key: "info",     label: `Informations (${counts.info})`,      color: "#6366F1" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilterLevel(f.key)} style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 20,
            border: filterLevel === f.key ? "none" : "1px solid #E2E8F0",
            background: filterLevel === f.key ? f.color : "white",
            color: filterLevel === f.key ? "white" : "#64748B",
            fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste des alertes */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          padding: "60px 0", gap: 10, color: "#ADB5BD", fontSize: 13 }}>
          <div className="spinner" />
          Analyse du réseau en cours…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          border: "2px dashed #E2E8F0", borderRadius: 12,
          color: "#ADB5BD",
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
            {filterLevel === "tous" ? "Aucune alerte détectée" : "Aucune alerte de ce niveau"}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Tous les établissements sont dans les normes pour cette période
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((alerte) => (
            <AlertCard key={alerte.id} alerte={alerte} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
