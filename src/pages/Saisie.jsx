import { useState, useCallback, useEffect } from "react";
import { PATHOLOGIES, MODES_ENTREE, STATUTS_PATIENT, DESTINATIONS_SORTIE } from "../data/mockData";
import { getEtablissements, getCampagnes, createVeille, soumettreVeille } from "../data/api";

function calcDuree(entree, sortie) {
  if (!entree || !sortie) return "";
  const d = (new Date(sortie) - new Date(entree)) / 86400000;
  return d >= 0 ? `${Math.round(d)}j` : "";
}

function CellInput({ value, onChange, type = "text", placeholder = "", min, max }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min} max={max}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "5px 6px", color: "var(--text-primary)", fontFamily: "var(--font)", outline: "none" }}
      onFocus={(e) => { e.target.style.background = "var(--blue-50)"; e.target.style.borderRadius = "4px"; }}
      onBlur={(e) => { e.target.style.background = "transparent"; }}
    />
  );
}

function CellSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, padding: "5px 6px", color: "var(--text-primary)", fontFamily: "var(--font)", outline: "none", cursor: "pointer" }}
      onFocus={(e) => { e.target.style.background = "var(--blue-50)"; e.target.style.borderRadius = "4px"; }}
      onBlur={(e) => { e.target.style.background = "transparent"; }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

const newRow = () => ({
  nom: "", prenom: "", age: "", chambre: "",
  pathologie: "Chute", operation_subie: "",
  dateEntree: "", dateSortie: "",
  attente_avant_op_jours: "0", temps_apres_op_jours: "0",
  modeEntree: "Urgences", statut: "Hospitalisé",
  destination_sortie: "Domicile", rehospitalisation: "Non",
});

export default function Saisie() {
  const [rows, setRows] = useState([newRow()]);
  const [etablissements, setEtablissements] = useState([]);
  const [campagnes, setCampagnes] = useState([]);
  const [etablissementId, setEtablissementId] = useState("");
  const [campagneId, setCampagneId] = useState("");
  const [nbLitsDisponibles, setNbLitsDisponibles] = useState("0");
  const [nbLitsOccupes, setNbLitsOccupes] = useState("0");
  const [commentaires, setCommentaires] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([getEtablissements(), getCampagnes()]).then(([etabs, camps]) => {
      setEtablissements(etabs);
      setCampagnes(camps.filter((c) => c.statut === "ouverte"));
      if (etabs.length > 0) setEtablissementId(etabs[0].id);
      const ouvertes = camps.filter((c) => c.statut === "ouverte");
      if (ouvertes.length > 0) setCampagneId(ouvertes[0].id);
    });
  }, []);

  const updateRow = useCallback((idx, field, value) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }, []);

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const deleteRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!etablissementId || !campagneId) {
      setMessage({ type: "error", text: "Veuillez sélectionner un établissement et une campagne." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const patientsPayload = rows
        .filter((r) => r.nom || r.prenom)
        .map((r) => ({
          nom: r.nom || null,
          prenom: r.prenom || null,
          age: r.age ? parseInt(r.age) : null,
          chambre: r.chambre || null,
          pathologie: r.pathologie || null,
          operation_subie: r.operation_subie || null,
          date_entree: r.dateEntree || null,
          date_sortie: r.dateSortie || null,
          attente_avant_op_jours: parseInt(r.attente_avant_op_jours) || 0,
          temps_apres_op_jours: parseInt(r.temps_apres_op_jours) || 0,
          mode_entree: r.modeEntree,
          statut: r.statut,
          destination_sortie: r.destination_sortie || null,
          rehospitalisation: r.rehospitalisation === "Oui",
        }));

      const veille = await createVeille({
        campagne_id: campagneId,
        etablissement_id: etablissementId,
        nb_lits_disponibles: parseInt(nbLitsDisponibles) || 0,
        nb_lits_occupes: parseInt(nbLitsOccupes) || 0,
        commentaires: commentaires || null,
        patients: patientsPayload,
      });

      await soumettreVeille(veille.id);
      setMessage({ type: "success", text: `Saisie soumise avec succès — ${patientsPayload.length} patient(s) enregistré(s).` });
      setRows([newRow()]);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculées
  const durees = rows.map((r) => calcDuree(r.dateEntree, r.dateSortie)).filter(Boolean).map((d) => parseInt(d));
  const avgDuree = durees.length ? Math.round(durees.reduce((a, b) => a + b) / durees.length) + "j" : "—";
  const nbHospit = rows.filter((r) => r.statut === "Hospitalisé").length;
  const nbSortis = rows.filter((r) => r.statut === "Sorti").length;

  const campagneActive = campagnes.find((c) => c.id === campagneId);

  const COLUMNS = [
    { label: "#", width: 28 }, { label: "Nom", width: 80 }, { label: "Prénom", width: 80 },
    { label: "Âge", width: 44 }, { label: "Chambre", width: 62 }, { label: "Pathologie", width: 130 },
    { label: "Opération", width: 130 }, { label: "Date entrée", width: 108 }, { label: "Date sortie", width: 108 },
    { label: "Durée séjour", width: 68 }, { label: "Attente av. op. (j)", width: 72 }, { label: "Temps ap. op. (j)", width: 72 },
    { label: "Mode entrée", width: 90 }, { label: "Statut", width: 90 }, { label: "Destination sortie", width: 100 },
    { label: "Réhospit.", width: 72 }, { label: "", width: 32 },
  ];

  return (
    <div>
      <div style={{ padding: "18px 24px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.3px" }}>Saisie des veilles hospitalières</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {campagneActive ? `${campagneActive.titre} — ${new Date(campagneActive.date_debut).toLocaleDateString("fr-FR")} au ${new Date(campagneActive.date_fin).toLocaleDateString("fr-FR")}` : "Sélectionnez une campagne"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Envoi…" : "Soumettre la saisie"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ margin: "12px 24px 0", padding: "12px 16px", borderRadius: "var(--radius-md)", background: message.type === "success" ? "var(--green-50)" : "var(--red-50)", color: message.type === "success" ? "var(--green-600)" : "var(--red-600)", fontSize: 13 }}>
          {message.text}
        </div>
      )}

      <div style={{ padding: "16px 24px 32px" }}>
        {/* Métadonnées */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 18px", marginBottom: 14, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label className="form-label">Campagne</label>
            <select className="form-select" style={{ width: 220 }} value={campagneId} onChange={(e) => setCampagneId(e.target.value)}>
              {campagnes.length === 0 ? <option>Aucune campagne ouverte</option> : campagnes.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Établissement</label>
            <select className="form-select" style={{ width: 200 }} value={etablissementId} onChange={(e) => setEtablissementId(e.target.value)}>
              {etablissements.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Lits disponibles</label>
            <input className="form-input" type="number" style={{ width: 100 }} value={nbLitsDisponibles} onChange={(e) => setNbLitsDisponibles(e.target.value)} min="0" />
          </div>
          <div>
            <label className="form-label">Lits occupés</label>
            <input className="form-input" type="number" style={{ width: 100 }} value={nbLitsOccupes} onChange={(e) => setNbLitsOccupes(e.target.value)} min="0" />
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {[["Patients saisis", rows.length], ["Durée moy. séjour", avgDuree], ["Encore hospitalisés", nbHospit || "—"], ["Sortis", nbSortis || "—"]].map(([label, val]) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "var(--text-hint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tableau patients */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "var(--gray-50)" }}>
                  {COLUMNS.map((col) => (
                    <th key={col.label} style={{ width: col.width, minWidth: col.width, padding: "9px 6px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border-light)", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const duree = calcDuree(row.dateEntree, row.dateSortie);
                  const td = (children) => ({ style: { borderRight: "1px solid var(--border-light)" } });
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = ""}
                    >
                      <td style={{ padding: "2px 6px", textAlign: "center", fontSize: 11, color: "var(--text-hint)", borderRight: "1px solid var(--border-light)" }}>{idx + 1}</td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput value={row.nom} onChange={(v) => updateRow(idx, "nom", v)} placeholder="Nom" /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput value={row.prenom} onChange={(v) => updateRow(idx, "prenom", v)} placeholder="Prénom" /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput type="number" value={row.age} onChange={(v) => updateRow(idx, "age", v)} placeholder="—" min={0} max={130} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput value={row.chambre} onChange={(v) => updateRow(idx, "chambre", v)} placeholder="12A" /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellSelect value={row.pathologie} onChange={(v) => updateRow(idx, "pathologie", v)} options={PATHOLOGIES} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput value={row.operation_subie} onChange={(v) => updateRow(idx, "operation_subie", v)} placeholder="Ex: Prothèse" /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput type="date" value={row.dateEntree} onChange={(v) => updateRow(idx, "dateEntree", v)} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput type="date" value={row.dateSortie} onChange={(v) => updateRow(idx, "dateSortie", v)} /></td>
                      <td style={{ textAlign: "center", fontSize: 12, padding: "5px 6px", color: duree ? "var(--text-primary)" : "var(--text-hint)", fontWeight: duree ? 600 : 400, fontFamily: "var(--font-mono)", borderRight: "1px solid var(--border-light)" }}>{duree || "—"}</td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput type="number" value={row.attente_avant_op_jours} onChange={(v) => updateRow(idx, "attente_avant_op_jours", v)} placeholder="0" min={0} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellInput type="number" value={row.temps_apres_op_jours} onChange={(v) => updateRow(idx, "temps_apres_op_jours", v)} placeholder="0" min={0} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellSelect value={row.modeEntree} onChange={(v) => updateRow(idx, "modeEntree", v)} options={MODES_ENTREE} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellSelect value={row.statut} onChange={(v) => updateRow(idx, "statut", v)} options={STATUTS_PATIENT} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellSelect value={row.destination_sortie} onChange={(v) => updateRow(idx, "destination_sortie", v)} options={DESTINATIONS_SORTIE} /></td>
                      <td style={{ borderRight: "1px solid var(--border-light)" }}><CellSelect value={row.rehospitalisation} onChange={(v) => updateRow(idx, "rehospitalisation", v)} options={["Non", "Oui"]} /></td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => deleteRow(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-hint)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--red-500)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-hint)"}
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", borderTop: "1px solid var(--border-light)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-50)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="7" /><path d="M8 5v6M5 8h6" /></svg>
            Ajouter un patient
          </div>
        </div>

        {/* Commentaires */}
        <div style={{ marginTop: 14 }}>
          <label className="form-label">Commentaires / observations</label>
          <textarea className="form-input" rows={3} style={{ resize: "vertical" }} placeholder="Observations de la période…" value={commentaires} onChange={(e) => setCommentaires(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
