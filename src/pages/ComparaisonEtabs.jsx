import { useState, useEffect, useRef } from "react";
import {
  getEtablissements, getEvolution, getKpis,
  getAnneesDisponibles, getMoisDisponibles, getSemainesDisponibles
} from "../data/api";

// ── Couleurs des 4 établissements ─────────────────────────────
const ETAB_COLORS = ["#00A89D", "#8DC63F", "#6366F1", "#F59E0B"];
const ETAB_COLORS_LIGHT = ["#E6F7F6", "#F2F9E8", "#EEF2FF", "#FFFBEB"];

const KPI_OPTIONS = [
  { key: "hospitalisations",    label: "Hospitalisations",     unit: "" },
  { key: "duree_moyenne",       label: "Durée moy. séjour",    unit: "j" },
  { key: "attente_moyenne",     label: "Attente avant op.",    unit: "j" },
  { key: "taux_remplissage",    label: "Taux de remplissage",  unit: "%" },
  { key: "sortis",              label: "Patients sortis",      unit: "" },
  { key: "presents",            label: "Patients présents",    unit: "" },
  { key: "transferts",          label: "Transferts",           unit: "" },
  { key: "rehospitalisations",  label: "Réhospitalisations",   unit: "" },
];

const KPI_SUMMARY = [
  { key: "total_hospitalisations",  label: "Hospit.",      unit: "" },
  { key: "duree_moyenne_sejour",    label: "Durée moy.",   unit: "j" },
  { key: "taux_remplissage_moyen",  label: "Taux rempl.",  unit: "%" },
  { key: "total_sortis",            label: "Sortis",       unit: "" },
  { key: "total_transferts",        label: "Transferts",   unit: "" },
  { key: "total_rehospitalisations",label: "Réhospit.",    unit: "" },
];

// ── Graphique multi-courbes ────────────────────────────────────
function MultiLineChart({ canvasId, labels, datasets }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          label: d.label,
          data: d.data,
          borderColor: d.color,
          backgroundColor: d.color + "12",
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: d.color,
          pointBorderWidth: 2,
          fill: false,
          tension: 0.35,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { font: { size: 11 }, boxWidth: 16, padding: 14 },
          },
          tooltip: {
            callbacks: {
              title: (items) => `Période : ${items[0].label}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 }, color: "#ADB5BD" },
            grid: { color: "#F1F3F5" },
          },
          x: {
            ticks: { font: { size: 10 }, color: "#ADB5BD", maxRotation: 45, autoSkip: false },
            grid: { display: false },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);
  return <canvas ref={ref} id={canvasId} />;
}

// ── Sélecteur d'établissement (1 parmi la liste) ──────────────
function EtabPicker({ index, etablissements, selected, onSelect, color }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: selected ? color + "10" : "#F8F9FA",
      border: `1.5px solid ${selected ? color : "#E2E8F0"}`,
      borderRadius: 10,
      cursor: "pointer",
      transition: "all 0.15s",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Établissement {index + 1}
      </div>
      <select
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        style={{
          width: "100%", fontSize: 11, padding: "5px 8px",
          border: `1px solid ${color}40`, borderRadius: 6,
          background: "white", color: "#1A2332",
          fontFamily: "inherit", outline: "none", cursor: "pointer",
        }}
      >
        <option value="">— Choisir un établissement —</option>
        {etablissements.map((e) => (
          <option key={e.id} value={e.id}>{e.nom}</option>
        ))}
      </select>
    </div>
  );
}

export default function ComparaisonEtabs() {
  const [etablissements, setEtablissements] = useState([]);
  const [selectedEtabs, setSelectedEtabs] = useState([null, null, null, null]);
  const [selectedKpi, setSelectedKpi] = useState("hospitalisations");
  const [annees, setAnnees] = useState([]);
  const [annee, setAnnee] = useState("");
  const [moisList, setMoisList] = useState([]);
  const [mois, setMois] = useState("");
  const [semList, setSemList] = useState([]);
  const [semaine, setSemaine] = useState("");
  const [evolutions, setEvolutions] = useState([null, null, null, null]);
  const [kpisData, setKpisData] = useState([null, null, null, null]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getEtablissements(), getAnneesDisponibles()]).then(([etabs, ans]) => {
      setEtablissements(etabs);
      setAnnees(ans);
      if (ans.length > 0) setAnnee(String(ans[0]));
    });
  }, []);

  useEffect(() => {
    setMois(""); setMoisList([]); setSemaine(""); setSemList([]);
    if (!annee) return;
    getMoisDisponibles({ annee }).then(setMoisList);
  }, [annee]);

  useEffect(() => {
    setSemaine(""); setSemList([]);
    if (!annee || !mois) return;
    getSemainesDisponibles({ annee, mois }).then(setSemList);
  }, [annee, mois]);

  // Charger les données quand un établissement ou filtre change
  useEffect(() => {
    const params = {};
    if (annee) params.annee = annee;
    if (mois) params.mois = mois;
    if (semaine) params.semaine = semaine;

    const activeEtabs = selectedEtabs.filter(Boolean);
    if (activeEtabs.length === 0) return;

    setLoading(true);
    Promise.all(
      selectedEtabs.map((etabId) => {
        if (!etabId) return Promise.resolve([null, null]);
        return Promise.all([
          getEvolution({ ...params, etablissement_id: etabId }),
          getKpis({ ...params, etablissement_id: etabId }),
        ]);
      })
    ).then((results) => {
      setEvolutions(results.map((r) => r[0]));
      setKpisData(results.map((r) => r[1]));
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedEtabs, annee, mois, semaine]);

  const activeKpiConfig = KPI_OPTIONS.find((k) => k.key === selectedKpi) || KPI_OPTIONS[0];

  // Construire les datasets pour le graphique
  const buildDatasets = () => {
    const datasets = [];
    selectedEtabs.forEach((etabId, i) => {
      if (!etabId || !evolutions[i]) return;
      const etab = etablissements.find((e) => e.id === etabId);
      datasets.push({
        label: etab?.nom?.split(" ").slice(0, 3).join(" ") || `Étab. ${i + 1}`,
        data: evolutions[i].map((e) => e[selectedKpi] ?? e.value ?? 0),
        color: ETAB_COLORS[i],
      });
    });
    return datasets;
  };

  // Labels communs (on prend le plus long)
  const buildLabels = () => {
    let longest = [];
    evolutions.forEach((ev) => {
      if (ev && ev.length > longest.length) longest = ev.map((e) => e.label);
    });
    return longest;
  };

  const datasets = buildDatasets();
  const labels = buildLabels();
  const activeCount = selectedEtabs.filter(Boolean).length;

  const fStyle = {
    fontSize: 12, padding: "7px 12px",
    border: "1px solid #E2E8F0", borderRadius: 6,
    background: "#FFFFFF", color: "#495057",
    fontFamily: "inherit", outline: "none", cursor: "pointer",
  };
  const fDisabled = { ...fStyle, opacity: 0.45, cursor: "not-allowed" };

  return (
    <div style={{ padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A2332", margin: "0 0 4px" }}>
          Comparaison multi-établissements
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Comparez les indicateurs de jusqu'à 4 établissements sur la même période
        </p>
      </div>

      {/* Sélecteurs période + KPI */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center",
        flexWrap: "wrap", marginBottom: 16,
        padding: "12px 16px", background: "#F8F9FA",
        borderRadius: 10, border: "1px solid #E2E8F0",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B",
          textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Période
        </span>
        <select style={fStyle} value={annee} onChange={(e) => setAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select style={annee ? fStyle : fDisabled} disabled={!annee}
          value={mois} onChange={(e) => setMois(e.target.value)}>
          <option value="">Tous les mois</option>
          {moisList.map((m) => <option key={m.numero} value={m.numero}>{m.nom}</option>)}
        </select>
        <select style={annee ? fStyle : fDisabled} disabled={!annee}
          value={semaine} onChange={(e) => setSemaine(e.target.value)}>
          <option value="">Toutes les semaines</option>
          {semList.map((s) => <option key={s.numero} value={s.numero}>Semaine {s.numero}</option>)}
        </select>

        <div style={{ width: 1, height: 24, background: "#E2E8F0", margin: "0 4px" }} />

        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B",
          textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Indicateur
        </span>
        <select style={fStyle} value={selectedKpi} onChange={(e) => setSelectedKpi(e.target.value)}>
          {KPI_OPTIONS.map((k) => (
            <option key={k.key} value={k.key}>{k.label}{k.unit ? ` (${k.unit})` : ""}</option>
          ))}
        </select>
      </div>

      {/* Sélecteurs établissements */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <EtabPicker
            key={i}
            index={i}
            etablissements={etablissements.filter((e) =>
              !selectedEtabs.some((s, si) => s === e.id && si !== i)
            )}
            selected={selectedEtabs[i]}
            color={ETAB_COLORS[i]}
            onSelect={(id) => {
              const next = [...selectedEtabs];
              next[i] = id;
              setSelectedEtabs(next);
            }}
          />
        ))}
      </div>

      {activeCount === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: "#ADB5BD", fontSize: 14,
          border: "2px dashed #E2E8F0", borderRadius: 12,
        }}>
          Sélectionnez au moins un établissement pour afficher les courbes
        </div>
      ) : (
        <>
          {/* Graphique principal */}
          <div style={{
            background: "white", borderRadius: 12, border: "1px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 14,
            borderTop: `3px solid ${ETAB_COLORS[selectedEtabs.findIndex(Boolean)]}`,
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2332" }}>
                  Évolution — {activeKpiConfig.label}
                  {activeKpiConfig.unit && (
                    <span style={{ fontSize: 11, color: "#ADB5BD", marginLeft: 6, fontWeight: 400 }}>
                      ({activeKpiConfig.unit})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {activeCount} établissement{activeCount > 1 ? "s" : ""} comparé{activeCount > 1 ? "s" : ""}
                  {annee && ` · ${mois ? moisList.find(m => String(m.numero) === mois)?.nom + " " : ""}${annee}`}
                </div>
              </div>
              {loading && (
                <div style={{ fontSize: 12, color: "#ADB5BD", display: "flex",
                  alignItems: "center", gap: 6 }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Chargement…
                </div>
              )}
            </div>
            <div style={{ padding: "16px 20px", height: 320 }}>
              {datasets.length > 0 ? (
                <MultiLineChart
                  canvasId={`multi-${selectedKpi}-${annee}-${mois}-${semaine}`}
                  labels={labels}
                  datasets={datasets}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100%", color: "#ADB5BD", fontSize: 13 }}>
                  Aucune donnée disponible pour cette sélection
                </div>
              )}
            </div>
          </div>

          {/* Tableau récapitulatif KPIs */}
          <div style={{
            background: "white", borderRadius: 12, border: "1px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2332" }}>
                Récapitulatif des indicateurs
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8F9FA" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11,
                      fontWeight: 700, color: "#64748B", textTransform: "uppercase",
                      letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0" }}>
                      Indicateur
                    </th>
                    {selectedEtabs.map((etabId, i) => {
                      if (!etabId) return null;
                      const etab = etablissements.find((e) => e.id === etabId);
                      return (
                        <th key={i} style={{ padding: "10px 16px", textAlign: "center",
                          fontSize: 11, fontWeight: 700, borderBottom: "1px solid #E2E8F0",
                          color: ETAB_COLORS[i] }}>
                          <div style={{ display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%",
                              background: ETAB_COLORS[i] }} />
                            {etab?.nom?.split(" ").slice(0, 2).join(" ")}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {KPI_SUMMARY.map((kpi, ki) => (
                    <tr key={kpi.key} style={{ background: ki % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600,
                        color: "#1A2332", borderBottom: "1px solid #F1F5F9" }}>
                        {kpi.label}
                      </td>
                      {selectedEtabs.map((etabId, i) => {
                        if (!etabId) return null;
                        const val = kpisData[i]?.[kpi.key];
                        const isSelected = kpi.key.includes(selectedKpi.replace("_moyenne","").replace("taux_remplissage","taux"));
                        return (
                          <td key={i} style={{ padding: "10px 16px", textAlign: "center",
                            fontSize: 13, fontWeight: 700,
                            color: ETAB_COLORS[i],
                            borderBottom: "1px solid #F1F5F9",
                            background: isSelected ? ETAB_COLORS_LIGHT[i] : undefined,
                          }}>
                            {val != null
                              ? `${typeof val === "number" ? val.toLocaleString("fr-CH") : val}${kpi.unit}`
                              : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
