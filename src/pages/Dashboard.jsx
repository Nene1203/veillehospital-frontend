import { useState, useEffect, useRef } from "react";
import {
  getKpis, getParEtablissement, getParPathologie, getEvolution,
  getEtablissements, getAnneesDisponibles, getMoisDisponibles,
  getSemainesDisponibles, getJoursDisponibles
} from "../data/api";
import { COULEURS_GRAPHIQUES } from "../data/mockData";

function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value ?? "—"}</div>
    </div>
  );
}

function BarChart({ canvasId, labels, data, color, label }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: { labels, datasets: [{ label, data, backgroundColor: color + "55", borderColor: color, borderWidth: 1.5, borderRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: "#F3F4F6" } }, x: { ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 45 }, grid: { display: false } } } },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(labels), JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId} />;
}

function LineChart({ canvasId, labels, data, color }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "line",
      data: { labels, datasets: [{ data, borderColor: color, backgroundColor: color + "18", borderWidth: 2, pointRadius: 4, pointBackgroundColor: color, fill: true, tension: 0.35 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: "#F3F4F6" } }, x: { ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 45 }, grid: { display: false } } } },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(labels), JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId} />;
}

function DoughnutChart({ canvasId, labels, data, colors }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: "62%" },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId} />;
}

const PATHO_COLORS = [
  COULEURS_GRAPHIQUES.blue, COULEURS_GRAPHIQUES.teal, COULEURS_GRAPHIQUES.coral,
  COULEURS_GRAPHIQUES.purple, COULEURS_GRAPHIQUES.amber, COULEURS_GRAPHIQUES.gray
];

// ─── Multi-select établissements ─────────────────────────────
function EtabMultiSelect({ etablissements, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleAll = () => {
    if (selected.length === etablissements.length) onChange([]);
    else onChange(etablissements.map(e => e.id));
  };

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  };

  const label = selected.length === 0 || selected.length === etablissements.length
    ? "Tous les établissements"
    : `${selected.length} établissement${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: 12, padding: "7px 12px", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", background: "var(--surface)",
          color: "var(--text-primary)", fontFamily: "var(--font)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, minWidth: 200,
          outline: "none",
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", minWidth: 280, maxHeight: 320,
          overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          {/* Tout sélectionner */}
          <div
            onClick={toggleAll}
            style={{
              padding: "10px 14px", fontSize: 12, fontWeight: 600,
              color: "var(--blue-600)", cursor: "pointer", borderBottom: "1px solid var(--border-light)",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--gray-50)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >
            <input
              type="checkbox"
              readOnly
              checked={selected.length === etablissements.length}
              style={{ accentColor: "var(--blue-600)", cursor: "pointer" }}
            />
            Tous les établissements
          </div>

          {/* Liste des établissements */}
          {etablissements.map(e => (
            <div
              key={e.id}
              onClick={() => toggle(e.id)}
              style={{
                padding: "8px 14px", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                color: "var(--text-primary)",
                borderBottom: "0.5px solid var(--border-light)",
              }}
              onMouseEnter={ev => ev.currentTarget.style.background = "var(--gray-50)"}
              onMouseLeave={ev => ev.currentTarget.style.background = ""}
            >
              <input
                type="checkbox"
                readOnly
                checked={selected.includes(e.id)}
                style={{ accentColor: "var(--blue-600)", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ lineHeight: 1.3 }}>{e.nom}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [etablissements, setEtablissements] = useState([]);
  const [selectedEtabs, setSelectedEtabs] = useState([]); // [] = tous

  // Filtres cascade
  const [annees, setAnnees] = useState([]);
  const [moisList, setMoisList] = useState([]);
  const [semainesList, setSemainesList] = useState([]);
  const [joursList, setJoursList] = useState([]);
  const [annee, setAnnee] = useState(""); // "" = toutes les années
  const [mois, setMois] = useState("");
  const [semaine, setSemaine] = useState("");
  const [jour, setJour] = useState("");

  // Données
  const [kpis, setKpis] = useState(null);
  const [etabStats, setEtabStats] = useState([]);
  const [pathoStats, setPathoStats] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chargement initial
  useEffect(() => {
    Promise.all([getEtablissements(), getAnneesDisponibles()]).then(([etabs, ans]) => {
      setEtablissements(etabs);
      setAnnees(ans);
      // Pas de sélection d'année par défaut → toutes les années
    });
  }, []);

  // Quand annee change → charger les mois
  useEffect(() => {
    setMois(""); setMoisList([]);
    setSemaine(""); setSemainesList([]);
    setJour(""); setJoursList([]);
    if (!annee) return;
    getMoisDisponibles({ annee }).then(setMoisList);
  }, [annee]);

  // Quand mois change → charger les semaines
  useEffect(() => {
    setSemaine(""); setSemainesList([]);
    setJour(""); setJoursList([]);
    if (!annee || !mois) return;
    getSemainesDisponibles({ annee, mois }).then(setSemainesList);
  }, [mois, annee]);

  // Quand semaine change → charger les jours
  useEffect(() => {
    setJour(""); setJoursList([]);
    if (!annee || !semaine) return;
    getJoursDisponibles({ annee, ...(mois && { mois }), semaine }).then(setJoursList);
  }, [semaine, mois, annee]);

  // Rechargement des données
  useEffect(() => {
    setLoading(true);
    const baseParams = {};
    if (annee) baseParams.annee = annee;
    if (mois) baseParams.mois = mois;
    if (semaine) baseParams.semaine = semaine;
    if (jour) baseParams.jour = jour;

    // Si des établissements sont sélectionnés, on fait N requêtes et on agrège
    const etabsToQuery = selectedEtabs.length > 0 && selectedEtabs.length < etablissements.length
      ? selectedEtabs
      : [null]; // null = tous

    const fetchAll = etabsToQuery.map(etabId => {
      const params = { ...baseParams };
      if (etabId) params.etablissement_id = etabId;
      return Promise.all([
        getKpis(params),
        getParEtablissement(params),
        getParPathologie(params),
        getEvolution(params),
      ]);
    });

    Promise.all(fetchAll).then(results => {
      if (results.length === 1) {
        const [k, e, p, ev] = results[0];
        setKpis(k); setEtabStats(e); setPathoStats(p); setEvolution(ev);
      } else {
        // Agrégation des résultats pour N établissements
        const allKpis = results.map(r => r[0]);
        const aggregatedKpis = {
          total_hospitalisations: allKpis.reduce((s, k) => s + (k?.total_hospitalisations || 0), 0),
          total_sortis: allKpis.reduce((s, k) => s + (k?.total_sortis || 0), 0),
          total_presents: allKpis.reduce((s, k) => s + (k?.total_presents || 0), 0),
          total_transferts: allKpis.reduce((s, k) => s + (k?.total_transferts || 0), 0),
          total_rehospitalisations: allKpis.reduce((s, k) => s + (k?.total_rehospitalisations || 0), 0),
          duree_moyenne_sejour: (() => { const v = allKpis.map(k => k?.duree_moyenne_sejour).filter(Boolean); return v.length ? Math.round(v.reduce((a,b)=>a+b)/v.length*10)/10 : null; })(),
          attente_moyenne_avant_op: (() => { const v = allKpis.map(k => k?.attente_moyenne_avant_op).filter(Boolean); return v.length ? Math.round(v.reduce((a,b)=>a+b)/v.length*10)/10 : null; })(),
          taux_remplissage_moyen: (() => { const v = allKpis.map(k => k?.taux_remplissage_moyen).filter(Boolean); return v.length ? Math.round(v.reduce((a,b)=>a+b)/v.length*10)/10 : null; })(),
        };
        setKpis(aggregatedKpis);

        // Fusionne les stats établissements
        const allEtabStats = results.flatMap(r => r[1]);
        setEtabStats(allEtabStats.filter(e => e.hospitalisations > 0));

        // Fusionne les pathologies
        const pathoMap = {};
        results.forEach(r => r[2].forEach(p => {
          pathoMap[p.pathologie] = (pathoMap[p.pathologie] || 0) + p.count;
        }));
        const total = Object.values(pathoMap).reduce((a,b)=>a+b, 0);
        const mergedPatho = Object.entries(pathoMap)
          .map(([pathologie, count]) => ({ pathologie, count, pourcentage: Math.round(count/total*100*10)/10 }))
          .sort((a,b) => b.count - a.count);
        setPathoStats(mergedPatho);

        // Évolution : prend le premier résultat (structure identique)
        setEvolution(results[0][3]);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [annee, mois, semaine, jour, selectedEtabs, etablissements]);

  const periodLabel = () => {
    const etabLabel = selectedEtabs.length > 0 && selectedEtabs.length < etablissements.length
      ? `${selectedEtabs.length} établissement${selectedEtabs.length > 1 ? "s" : ""}`
      : "Tous les établissements";
    const dateLabel = jour ? `Journée du ${jour}`
      : semaine ? `Semaine ${semaine}${mois ? ` · ${moisList.find(m=>String(m.numero)===mois)?.nom||""}` : ""} ${annee}`
      : mois ? `${moisList.find(m=>String(m.numero)===mois)?.nom||""} ${annee}`
      : annee ? `Année ${annee}`
      : "Toutes périodes";
    return `${etabLabel} · ${dateLabel}`;
  };

  const filterStyle = {
    fontSize: 12, padding: "7px 12px", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", background: "var(--surface)",
    color: "var(--text-primary)", fontFamily: "var(--font)", outline: "none", cursor: "pointer"
  };
  const filterDisabled = { ...filterStyle, opacity: 0.45, cursor: "not-allowed" };

  const hasFilters = selectedEtabs.length > 0 || annee || mois || semaine || jour;

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "18px 24px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.3px" }}>Dashboard</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{periodLabel()}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Multi-select établissements */}
          <EtabMultiSelect
            etablissements={etablissements}
            selected={selectedEtabs}
            onChange={setSelectedEtabs}
          />

          {/* Année */}
          <select style={filterStyle} value={annee} onChange={e => setAnnee(e.target.value)}>
            <option value="">Toutes les années</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Mois */}
          <select style={annee ? filterStyle : filterDisabled} disabled={!annee} value={mois} onChange={e => setMois(e.target.value)}>
            <option value="">Tous les mois</option>
            {moisList.map(m => <option key={m.numero} value={m.numero}>{m.nom}</option>)}
          </select>

          {/* Semaine */}
          <select style={annee ? filterStyle : filterDisabled} disabled={!annee} value={semaine} onChange={e => setSemaine(e.target.value)}>
            <option value="">Toutes les semaines</option>
            {semainesList.map(s => <option key={s.numero} value={s.numero}>Semaine {s.numero} ({s.debut})</option>)}
          </select>

          {/* Jour */}
          <select style={semaine ? filterStyle : filterDisabled} disabled={!semaine} value={jour} onChange={e => setJour(e.target.value)}>
            <option value="">Tous les jours</option>
            {joursList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={() => { setSelectedEtabs([]); setAnnee(""); setMois(""); setSemaine(""); setJour(""); }}
              style={{ ...filterStyle, background: "var(--gray-100)", fontWeight: 500 }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-hint)", fontSize: 14 }}>Chargement…</div>
        ) : (
          <>
            <div className="kpi-grid">
              <KpiCard label="Hospitalisations" value={kpis?.total_hospitalisations} />
              <KpiCard label="Durée moy. séjour" value={kpis?.duree_moyenne_sejour ? `${kpis.duree_moyenne_sejour}j` : "—"} />
              <KpiCard label="Attente avant op." value={kpis?.attente_moyenne_avant_op ? `${kpis.attente_moyenne_avant_op}j` : "—"} />
              <KpiCard label="Taux de remplissage" value={kpis?.taux_remplissage_moyen ? `${kpis.taux_remplissage_moyen}%` : "—"} />
            </div>
            <div className="kpi-grid">
              <KpiCard label="Patients sortis" value={kpis?.total_sortis} />
              <KpiCard label="Patients présents" value={kpis?.total_presents} />
              <KpiCard label="Transferts" value={kpis?.total_transferts} />
              <KpiCard label="Réhospitalisations" value={kpis?.total_rehospitalisations} />
            </div>

            {/* Évolution + pathologies */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16 }}>
              <div className="card">
                <div className="card-title">Évolution des hospitalisations</div>
                <div style={{ position: "relative", height: 200 }}>
                  <LineChart
                    canvasId={`evo-${annee}-${mois}-${semaine}-${selectedEtabs.join("")}`}
                    labels={evolution.map(e => e.label)}
                    data={evolution.map(e => e.value)}
                    color={COULEURS_GRAPHIQUES.blue}
                  />
                </div>
              </div>
              <div className="card">
                <div className="card-title">Répartition par pathologie</div>
                <div style={{ position: "relative", height: 150 }}>
                  <DoughnutChart
                    canvasId={`donut-${annee}-${mois}-${selectedEtabs.join("")}`}
                    labels={pathoStats.map(p => p.pathologie)}
                    data={pathoStats.map(p => p.count)}
                    colors={PATHO_COLORS.slice(0, pathoStats.length)}
                  />
                </div>
                <div className="legend" style={{ marginTop: 8 }}>
                  {pathoStats.slice(0, 5).map((p, i) => (
                    <span key={p.pathologie} className="legend-item">
                      <span className="legend-dot" style={{ background: PATHO_COLORS[i] }} />
                      {p.pathologie} {p.pourcentage}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Graphiques barres */}
            {etabStats.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
                <div className="card">
                  <div className="card-title">Hospitalisations par établissement</div>
                  <div style={{ position: "relative", height: Math.max(180, etabStats.length * 22 + 60) }}>
                    <BarChart
                      canvasId={`bar-etab-${annee}-${selectedEtabs.join("")}`}
                      labels={etabStats.map(e => e.etablissement_nom.split(" ").slice(-1)[0])}
                      data={etabStats.map(e => e.hospitalisations)}
                      color={COULEURS_GRAPHIQUES.blue}
                      label="Hospit."
                    />
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Durée moy. séjour par établissement (j)</div>
                  <div style={{ position: "relative", height: Math.max(180, etabStats.length * 22 + 60) }}>
                    <BarChart
                      canvasId={`bar-duree-${annee}-${selectedEtabs.join("")}`}
                      labels={etabStats.map(e => e.etablissement_nom.split(" ").slice(-1)[0])}
                      data={etabStats.map(e => e.duree_moyenne ?? 0)}
                      color={COULEURS_GRAPHIQUES.teal}
                      label="Durée (j)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tableau */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Détail par établissement {selectedEtabs.length > 0 && selectedEtabs.length < etablissements.length ? `(${selectedEtabs.length} sélectionnés)` : ""}
                </div>
              </div>
              {etabStats.length === 0 ? (
                <div style={{ padding: 24, fontSize: 13, color: "var(--text-hint)", textAlign: "center" }}>Aucune donnée pour cette sélection.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Établissement</th><th>Hospit.</th><th>Durée moy.</th>
                      <th>Attente op.</th><th>Taux rempl.</th><th>Sortis</th>
                      <th>Transferts</th><th>Réhospit.</th>
                    </tr></thead>
                    <tbody>
                      {etabStats.map(e => (
                        <tr key={e.etablissement_id}>
                          <td style={{ fontWeight: 500 }}>{e.etablissement_nom}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{e.hospitalisations}</td>
                          <td>{e.duree_moyenne ? `${e.duree_moyenne}j` : "—"}</td>
                          <td>{e.attente_moyenne ? `${e.attente_moyenne}j` : "—"}</td>
                          <td>{e.taux_remplissage ? `${e.taux_remplissage}%` : "—"}</td>
                          <td>{e.sortis}</td>
                          <td>{e.transferts}</td>
                          <td>{e.rehospitalisations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
