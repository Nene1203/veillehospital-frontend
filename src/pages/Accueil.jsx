import { useState, useEffect } from "react";
import { getCampagnes, getEtablissements, getKpis } from "../data/api";

export default function Accueil({ onNavigate }) {
  const [campagnes, setCampagnes] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [nbEtabs, setNbEtabs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCampagnes(), getEtablissements(), getKpis()])
      .then(([camps, etabs, kpisData]) => {
        setCampagnes(camps);
        setNbEtabs(etabs.length);
        setKpis(kpisData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const campagneEnCours = campagnes.find((c) => c.statut === "ouverte");

  const stats = [
    { label: "Établissements actifs", value: loading ? "…" : nbEtabs },
    { label: "Campagnes ouvertes", value: loading ? "…" : campagnes.filter((c) => c.statut === "ouverte").length },
    { label: "Hospitalisations totales", value: loading ? "…" : kpis?.total_hospitalisations ?? "—" },
    { label: "Durée moy. séjour", value: loading ? "…" : kpis?.duree_moyenne_sejour ? `${kpis.duree_moyenne_sejour}j` : "—" },
  ];

  const statutBadge = (s) => {
    if (s === "ouverte") return { label: "En cours", cls: "amber" };
    if (s === "cloturee") return { label: "Clôturée", cls: "green" };
    return { label: s, cls: "blue" };
  };

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: 6 }}>
          Bonjour 👋
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 560 }}>
          Bienvenue sur la plateforme de suivi des veilles hospitalières. Renseignez les données de votre établissement ou consultez les indicateurs consolidés.
        </p>
      </div>

      {/* Stats rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-hint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Actions principales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 740, marginBottom: 32 }}>
        <div
          onClick={() => onNavigate("saisie")}
          style={{ background: "var(--blue-600)", borderRadius: "var(--radius-xl)", padding: "28px 24px", cursor: "pointer", color: "white" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <div style={{ width: 44, height: 44, background: "rgba(255,255,255,.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M2 12.5V14h1.5l7-7L9 5.5l-7 7zM13.5 4.5l-2-2-1 1 2 2 1-1z" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nouvelle saisie</div>
          <div style={{ fontSize: 12.5, opacity: .85, lineHeight: 1.5 }}>
            {campagneEnCours ? `Campagne "${campagneEnCours.titre}" en cours.` : "Aucune campagne ouverte pour l'instant."}
          </div>
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            Démarrer
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </div>
        </div>

        <div
          onClick={() => onNavigate("dashboard")}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "28px 24px", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue-500)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <div style={{ width: 44, height: 44, background: "var(--teal-50)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="var(--teal-600)" strokeWidth="1.5">
              <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Voir le dashboard</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Consulter les KPIs, graphiques et indicateurs filtrés par établissement et par période.
          </div>
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 500, color: "var(--teal-600)", display: "flex", alignItems: "center", gap: 6 }}>
            Accéder
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--teal-600)" strokeWidth="1.8"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </div>
        </div>
      </div>

      {/* Campagnes depuis l'API */}
      <div style={{ maxWidth: 740 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Campagnes</div>
        {loading ? (
          <div style={{ fontSize: 13, color: "var(--text-hint)", padding: "16px 0" }}>Chargement…</div>
        ) : campagnes.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-hint)", padding: "16px 0" }}>Aucune campagne pour l'instant.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {campagnes.map((c) => {
              const { label, cls } = statutBadge(c.statut);
              return (
                <div
                  key={c.id}
                  onClick={() => c.statut === "ouverte" && onNavigate("saisie")}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: c.statut === "ouverte" ? "pointer" : "default" }}
                  onMouseEnter={e => { if (c.statut === "ouverte") e.currentTarget.style.borderColor = "var(--blue-500)"; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>{c.titre}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-hint)" }}>
                      {new Date(c.date_debut).toLocaleDateString("fr-FR")} → {new Date(c.date_fin).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <span className={`badge ${cls}`}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
