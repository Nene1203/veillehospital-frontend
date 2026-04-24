import { useState, useEffect, useRef } from "react";
import {
  getKpis, getParEtablissement, getParPathologie, getEvolution,
  getEtablissements, getAnneesDisponibles, getMoisDisponibles,
  getSemainesDisponibles, getJoursDisponibles
} from "../data/api";

// ─── Couleurs HévivA ─────────────────────
const COLORS = {
  teal:   "#00A89D",
  lime:   "#8DC63F",
  gray:   "#ADB5BD",
  teal2:  "#009990",
  lime2:  "#6A9A2A",
  blue:   "#3B82F6",
  amber:  "#F59E0B",
};
const PATHO_COLORS = [COLORS.teal, COLORS.lime, COLORS.gray, COLORS.blue, COLORS.amber, "#E2E8F0"];

// ─── Config KPIs cliquables ──────────────
const KPI_CONFIG = [
  { key: "total_hospitalisations", label: "Hospitalisations",   unit: "",  accent: "teal", badge: "Période sélectionnée", color: COLORS.teal,  evoKey: "hospitalisations" },
  { key: "duree_moyenne_sejour",   label: "Durée moy. séjour",  unit: "j", accent: "lime",                                color: COLORS.lime,  evoKey: "duree_moyenne" },
  { key: "attente_moyenne_avant_op",label:"Attente avant op.",  unit: "j", accent: "teal",                                color: COLORS.teal,  evoKey: "attente_moyenne" },
  { key: "taux_remplissage_moyen", label: "Taux de remplissage",unit: "%", accent: "lime",                                color: COLORS.lime,  evoKey: "taux_remplissage" },
  { key: "total_sortis",           label: "Patients sortis",    unit: "",  accent: "teal",                                color: COLORS.teal,  evoKey: "sortis" },
  { key: "total_presents",         label: "Patients présents",  unit: "",  accent: "gray",                                color: COLORS.gray,  evoKey: "presents" },
  { key: "total_transferts",       label: "Transferts",         unit: "",  accent: "gray",                                color: COLORS.amber, evoKey: "transferts" },
  { key: "total_rehospitalisations",label:"Réhospitalisations", unit: "",  accent: "gray",                                color: "#6366F1",    evoKey: "rehospitalisations" },
];

// ─── Charts ──────────────────────────────
function BarChart({ canvasId, labels, data, color }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: color + "30",
          borderColor: color,
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 }, color: "#ADB5BD" }, grid: { color: "#F1F3F5" } },
          x: { ticks: { font: { size: 10 }, color: "#ADB5BD", maxRotation: 45, autoSkip: false }, grid: { display: false } }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(labels), JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId} />;
}

function LineChart({ canvasId, labels, data, color, label2, data2, color2 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    const datasets = [{
      label: label2 ? "Période actuelle" : undefined,
      data,
      borderColor: color,
      backgroundColor: color + "15",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#FFFFFF",
      pointBorderColor: color,
      pointBorderWidth: 2,
      fill: true,
      tension: 0.35,
    }];
    if (label2 && data2) {
      datasets.push({
        label: label2,
        data: data2,
        borderColor: color2 || "#ADB5BD",
        backgroundColor: (color2 || "#ADB5BD") + "10",
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: "#FFFFFF",
        pointBorderColor: color2 || "#ADB5BD",
        pointBorderWidth: 2,
        fill: false,
        tension: 0.35,
      });
    }
    chartRef.current = new window.Chart(ref.current, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: !!label2, position: "top",
            labels: { font: { size: 11 }, boxWidth: 16, padding: 12 } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 }, color: "#ADB5BD" }, grid: { color: "#F1F3F5" } },
          x: { ticks: { font: { size: 10 }, color: "#ADB5BD", maxRotation: 45, autoSkip: false }, grid: { display: false } }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(labels), JSON.stringify(data), JSON.stringify(data2)]);
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
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "65%",
      }
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId} />;
}

// ─── Multi-select établissements ─────────
function EtabMultiSelect({ etablissements, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const isAll = selected.length === 0 || selected.length === etablissements.length;
  const label = isAll ? "Tous les établissements" : `${selected.length} établissement${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`;
  const toggleAll = () => onChange(isAll ? etablissements.map(e => e.id) : []);
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  return (
    <div ref={ref} className="etab-multiselect">
      <button className="etab-multiselect-btn" onClick={() => setOpen(!open)} type="button">
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="etab-dropdown">
          <div className="etab-dropdown-all" onClick={toggleAll}>
            <input type="checkbox" readOnly checked={isAll} />
            Tous les établissements
          </div>
          {etablissements.map(e => (
            <div key={e.id} className="etab-dropdown-item" onClick={() => toggle(e.id)}>
              <input type="checkbox" readOnly checked={selected.includes(e.id)} />
              <span>{e.nom}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KPI Card cliquable ───────────────────
function KpiCard({ label, value, unit, accent = "teal", badge, selected, onClick }) {
  return (
    <div
      className={`kpi-card kpi-${accent}`}
      onClick={onClick}
      style={{
        cursor: "pointer",
        outline: selected ? `2.5px solid ${accent === "teal" ? COLORS.teal : accent === "lime" ? COLORS.lime : COLORS.gray}` : "none",
        outlineOffset: 2,
        transform: selected ? "translateY(-2px)" : "none",
        boxShadow: selected ? "0 4px 16px rgba(0,168,157,0.18)" : undefined,
        transition: "all 0.15s ease",
        position: "relative",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 8, height: 8, borderRadius: "50%",
          background: accent === "lime" ? COLORS.lime : COLORS.teal,
        }} />
      )}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value ?? "—"}
        {unit && <span style={{ fontSize: 14, fontWeight: 400, color: "#ADB5BD", marginLeft: 2 }}>{unit}</span>}
      </div>
      {badge && <div className="kpi-badge">{badge}</div>}
      {selected && (
        <div style={{ fontSize: 10, color: accent === "lime" ? COLORS.lime : COLORS.teal,
          marginTop: 4, fontWeight: 600 }}>
          ↓ Courbe affichée
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────
export default function Dashboard() {
  const [etablissements, setEtablissements] = useState([]);
  const [selectedEtabs, setSelectedEtabs] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState("total_hospitalisations");

  const [annees, setAnnees] = useState([]);
  const [moisList, setMoisList] = useState([]);
  const [semainesList, setSemainesList] = useState([]);
  const [joursList, setJoursList] = useState([]);
  const [annee, setAnnee] = useState("");
  const [mois, setMois] = useState("");
  const [semaine, setSemaine] = useState("");
  const [jour, setJour] = useState("");

  const [kpis, setKpis] = useState(null);
  const [etabStats, setEtabStats] = useState([]);
  const [pathoStats, setPathoStats] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEtablissements(), getAnneesDisponibles()]).then(([etabs, ans]) => {
      setEtablissements(etabs);
      setAnnees(ans);
    });
  }, []);

  useEffect(() => {
    setMois(""); setMoisList([]);
    setSemaine(""); setSemainesList([]);
    setJour(""); setJoursList([]);
    if (!annee) return;
    getMoisDisponibles({ annee }).then(setMoisList);
  }, [annee]);

  useEffect(() => {
    setSemaine(""); setSemainesList([]);
    setJour(""); setJoursList([]);
    if (!annee || !mois) return;
    getSemainesDisponibles({ annee, mois }).then(setSemainesList);
  }, [mois, annee]);

  useEffect(() => {
    setJour(""); setJoursList([]);
    if (!annee || !semaine) return;
    getJoursDisponibles({ annee, ...(mois && { mois }), semaine }).then(setJoursList);
  }, [semaine, mois, annee]);

  useEffect(() => {
    setLoading(true);
    const base = {};
    if (annee) base.annee = annee;
    if (mois) base.mois = mois;
    if (semaine) base.semaine = semaine;
    if (jour) base.jour = jour;

    const etabsToQuery = selectedEtabs.length > 0 && selectedEtabs.length < etablissements.length
      ? selectedEtabs : [null];

    Promise.all(etabsToQuery.map(etabId => {
      const params = { ...base };
      if (etabId) params.etablissement_id = etabId;
      return Promise.all([getKpis(params), getParEtablissement(params), getParPathologie(params), getEvolution(params)]);
    })).then(results => {
      if (results.length === 1) {
        const [k, e, p, ev] = results[0];
        setKpis(k); setEtabStats(e); setPathoStats(p); setEvolution(ev);
      } else {
        const allKpis = results.map(r => r[0]);
        const avg = (arr) => { const v = arr.filter(Boolean); return v.length ? Math.round(v.reduce((a,b)=>a+b)/v.length*10)/10 : null; };
        setKpis({
          total_hospitalisations: allKpis.reduce((s,k)=>s+(k?.total_hospitalisations||0),0),
          total_sortis: allKpis.reduce((s,k)=>s+(k?.total_sortis||0),0),
          total_presents: allKpis.reduce((s,k)=>s+(k?.total_presents||0),0),
          total_transferts: allKpis.reduce((s,k)=>s+(k?.total_transferts||0),0),
          total_rehospitalisations: allKpis.reduce((s,k)=>s+(k?.total_rehospitalisations||0),0),
          duree_moyenne_sejour: avg(allKpis.map(k=>k?.duree_moyenne_sejour)),
          attente_moyenne_avant_op: avg(allKpis.map(k=>k?.attente_moyenne_avant_op)),
          taux_remplissage_moyen: avg(allKpis.map(k=>k?.taux_remplissage_moyen)),
        });
        setEtabStats(results.flatMap(r=>r[1]).filter(e=>e.hospitalisations>0));
        const pm = {};
        results.forEach(r=>r[2].forEach(p=>{pm[p.pathologie]=(pm[p.pathologie]||0)+p.count;}));
        const tot = Object.values(pm).reduce((a,b)=>a+b,0);
        setPathoStats(Object.entries(pm).map(([p,c])=>({pathologie:p,count:c,pourcentage:Math.round(c/tot*100*10)/10})).sort((a,b)=>b.count-a.count));
        setEvolution(results[0][3]);
      }
    }).catch(console.error).finally(()=>setLoading(false));
  }, [annee, mois, semaine, jour, selectedEtabs, etablissements]);

  // KPI sélectionné config
  const activeKpi = KPI_CONFIG.find(k => k.key === selectedKpi) || KPI_CONFIG[0];

  // Données de la courbe selon le KPI sélectionné
  const getEvoData = () => {
    if (!evolution.length) return [];
    const evoKey = activeKpi.evoKey;
    return evolution.map(e => {
      if (evoKey === "hospitalisations") return e.value ?? e.hospitalisations ?? 0;
      if (evoKey === "duree_moyenne")    return e.duree_moyenne ?? 0;
      if (evoKey === "attente_moyenne")  return e.attente_moyenne ?? 0;
      if (evoKey === "taux_remplissage") return e.taux_remplissage ?? 0;
      if (evoKey === "sortis")           return e.sortis ?? 0;
      if (evoKey === "presents")         return e.presents ?? 0;
      if (evoKey === "transferts")       return e.transferts ?? 0;
      if (evoKey === "rehospitalisations") return e.rehospitalisations ?? 0;
      return e.value ?? 0;
    });
  };

  const periodLabel = () => {
    const etabL = selectedEtabs.length > 0 && selectedEtabs.length < etablissements.length
      ? `${selectedEtabs.length} établissement${selectedEtabs.length>1?"s":""}`
      : "Tous les établissements";
    const dateL = jour ? `Journée du ${jour}`
      : semaine ? `Semaine ${semaine}${mois ? ` · ${moisList.find(m=>String(m.numero)===mois)?.nom||""}` : ""} ${annee}`
      : mois ? `${moisList.find(m=>String(m.numero)===mois)?.nom||""} ${annee}`
      : annee ? `Année ${annee}` : "Toutes périodes";
    return `${etabL} · ${dateL}`;
  };

  const hasFilters = selectedEtabs.length > 0 || annee || mois || semaine || jour;
  const resetFilters = () => { setSelectedEtabs([]); setAnnee(""); setMois(""); setSemaine(""); setJour(""); };
  const fStyle = { fontSize: 12, padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 6, background: "#FFFFFF", color: "#495057", fontFamily: "inherit", outline: "none", cursor: "pointer" };
  const fDisabled = { ...fStyle, opacity: 0.45, cursor: "not-allowed" };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{periodLabel()}</div>
        </div>
        <div className="filters-bar">
          <EtabMultiSelect etablissements={etablissements} selected={selectedEtabs} onChange={setSelectedEtabs} />
          <select style={fStyle} value={annee} onChange={e=>setAnnee(e.target.value)}>
            <option value="">Toutes les années</option>
            {annees.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select style={annee?fStyle:fDisabled} disabled={!annee} value={mois} onChange={e=>setMois(e.target.value)}>
            <option value="">Tous les mois</option>
            {moisList.map(m=><option key={m.numero} value={m.numero}>{m.nom}</option>)}
          </select>
          <select style={annee?fStyle:fDisabled} disabled={!annee} value={semaine} onChange={e=>setSemaine(e.target.value)}>
            <option value="">Toutes les semaines</option>
            {semainesList.map(s=><option key={s.numero} value={s.numero}>Semaine {s.numero}</option>)}
          </select>
          <select style={semaine?fStyle:fDisabled} disabled={!semaine} value={jour} onChange={e=>setJour(e.target.value)}>
            <option value="">Tous les jours</option>
            {joursList.map(j=><option key={j} value={j}>{j}</option>)}
          </select>
          {hasFilters && <button style={{...fStyle,background:"#F1F3F5"}} onClick={resetFilters}>Réinitialiser</button>}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            Chargement des données…
          </div>
        ) : (
          <>
            {/* Hint cliquable */}
            <div style={{ fontSize: 11, color: "#ADB5BD", marginBottom: 8, display: "flex",
              alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="6" stroke="#ADB5BD" strokeWidth="1"/>
                <text x="6.5" y="10" textAnchor="middle" fontSize="8" fill="#ADB5BD">i</text>
              </svg>
              Cliquez sur un indicateur pour afficher sa courbe d'évolution
            </div>

            {/* Ligne 1 KPIs */}
            <div className="kpi-grid">
              {KPI_CONFIG.slice(0, 4).map(k => (
                <KpiCard
                  key={k.key}
                  label={k.label}
                  value={kpis?.[k.key]?.toLocaleString?.("fr-CH") ?? kpis?.[k.key]}
                  unit={k.unit}
                  accent={k.accent}
                  badge={k.badge}
                  selected={selectedKpi === k.key}
                  onClick={() => setSelectedKpi(k.key)}
                />
              ))}
            </div>

            {/* Ligne 2 KPIs */}
            <div className="kpi-grid">
              {KPI_CONFIG.slice(4, 8).map(k => (
                <KpiCard
                  key={k.key}
                  label={k.label}
                  value={kpis?.[k.key]?.toLocaleString?.("fr-CH") ?? kpis?.[k.key]}
                  unit={k.unit}
                  accent={k.accent}
                  selected={selectedKpi === k.key}
                  onClick={() => setSelectedKpi(k.key)}
                />
              ))}
            </div>

            {/* Graphique évolution KPI sélectionné */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 14 }}>
              <div className="card" style={{ borderTop: `3px solid ${activeKpi.color}` }}>
                <div className="card-header">
                  <div className="card-title">
                    Évolution — {activeKpi.label}
                    {activeKpi.unit && (
                      <span style={{ fontSize: 11, color: "#ADB5BD", marginLeft: 6,
                        fontWeight: 400 }}>
                        ({activeKpi.unit})
                      </span>
                    )}
                  </div>
                  {annee && <span className="card-tag">{annee}</span>}
                </div>
                <div className="card-body" style={{ height: 200 }}>
                  <LineChart
                    canvasId={`evo-${selectedKpi}-${annee}-${mois}-${semaine}`}
                    labels={evolution.map(e => e.label)}
                    data={getEvoData()}
                    color={activeKpi.color}
                  />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Répartition par pathologie</div>
                </div>
                <div className="card-body">
                  <div style={{ height: 140 }}>
                    <DoughnutChart
                      canvasId={`donut-${annee}-${mois}`}
                      labels={pathoStats.map(p=>p.pathologie)}
                      data={pathoStats.map(p=>p.count)}
                      colors={PATHO_COLORS.slice(0,pathoStats.length)}
                    />
                  </div>
                  <div className="legend" style={{ marginTop: 10 }}>
                    {pathoStats.slice(0,5).map((p,i)=>(
                      <span key={p.pathologie} className="legend-item">
                        <span className="legend-dot" style={{ background: PATHO_COLORS[i] }} />
                        {p.pathologie} <span style={{ color: "#ADB5BD" }}>{p.pourcentage}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques par établissement */}
            {etabStats.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 }}>
                <div className="card">
                  <div className="card-header"><div className="card-title">Hospitalisations par établissement</div></div>
                  <div className="card-body" style={{ height: 200 }}>
                    <BarChart
                      canvasId={`bar-etab-${annee}`}
                      labels={etabStats.map(e=>e.etablissement_nom.split(" ").slice(-1)[0])}
                      data={etabStats.map(e=>e.hospitalisations)}
                      color={COLORS.teal}
                    />
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Durée moy. séjour par établissement (j)</div></div>
                  <div className="card-body" style={{ height: 200 }}>
                    <BarChart
                      canvasId={`bar-duree-${annee}`}
                      labels={etabStats.map(e=>e.etablissement_nom.split(" ").slice(-1)[0])}
                      data={etabStats.map(e=>e.duree_moyenne??0)}
                      color={COLORS.lime}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tableau détail */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Détail par établissement</div>
                <span style={{ fontSize: 11, color: "#ADB5BD" }}>
                  {etabStats.filter(e=>e.hospitalisations>0).length} établissements
                </span>
              </div>
              {etabStats.length === 0 ? (
                <div className="empty-state">Aucune donnée pour cette sélection.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Établissement</th>
                        <th>Hospit.</th>
                        <th>Durée moy.</th>
                        <th>Attente op.</th>
                        <th>Taux rempl.</th>
                        <th>Sortis</th>
                        <th>Transferts</th>
                        <th>Réhospit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etabStats.map(e=>(
                        <tr key={e.etablissement_id}>
                          <td>{e.etablissement_nom}</td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--teal)" }}>
                            {e.hospitalisations.toLocaleString("fr-CH")}
                          </td>
                          <td>{e.duree_moyenne ? `${e.duree_moyenne}j` : "—"}</td>
                          <td>{e.attente_moyenne ? `${e.attente_moyenne}j` : "—"}</td>
                          <td>
                            {e.taux_remplissage ? (
                              <span style={{
                                background: e.taux_remplissage > 90 ? "#FEF2F2" : "var(--teal-light)",
                                color: e.taux_remplissage > 90 ? "#DC2626" : "var(--teal-dark)",
                                padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 500
                              }}>
                                {e.taux_remplissage}%
                              </span>
                            ) : "—"}
                          </td>
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
    </>
  );
}
