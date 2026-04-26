import { useState, useCallback, useEffect } from "react";
import { getEtablissements, getCampagnes, createVeille, soumettreVeille } from "../data/api";

// ── Référentiels conformes au fichier Excel EMS 2026 ──────────

const JOURS_HOSP = ["Lundi au Vendredi", "Week-end", "Jour Férié"];

const HEURES_HOSP = ["Jour (8h-20h)", "Nuit (20h-8h)"];

const TYPES_HOSP = ["Planifiée", "Urgence"];

const DEMANDEURS = [
  "Médecin Responsable",
  "Médecin Traitant",
  "Médecin de garde",
  "EMPAA / Psychiatrie",
  "Inf. Piquet inf",
  "Famille",
  "Autres spécialistes",
];

const LIEUX_HOSP = ["Somatique", "Psychiatrie", "Les Deux"];

// Durée : <24H puis 1 à 50 jours
const DUREES_HOSP = ["<24H", ...Array.from({ length: 50 }, (_, i) => String(i + 1))];

const MOTIFS = [
  "Lésion(s) traumatique(s) - Fracture confirmée + Chirurgie",
  "Lésion(s) traumatique(s) - Fracture confirmée",
  "Lésion(s) traumatique(s) - Pas de fracture",
  "Maladie de l'appareil circulatoire",
  "Maladie de l'appareil respiratoire",
  "Maladie de l'appareil digestif",
  "Troubles mentaux et du comportement",
  "Maladie de l'appareil génito-urinaire",
  "Maladie ostéo-articulaire",
  "Maladie oncologique",
  "Maladie du système nerveux",
  "Autre",
];

const ISSUES = [
  "Retour EMS",
  "Décès",
  "Transfert vers un autre EMS",
  "Retour à domicile",
  "Autre",
];

// Âges de 55 à 115
const AGES = Array.from({ length: 61 }, (_, i) => String(i + 55));

// Classe PLAISIR de 1 à 12
const CLASSES_PLAISIR = Array.from({ length: 12 }, (_, i) => String(i + 1));

const GENRES = ["Femme", "Homme"];

// ── Composants cellules ───────────────────────────────────────

function CellSelect({ value, onChange, options, placeholder = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", border: "none", background: "transparent",
        fontSize: 11.5, padding: "4px 5px", color: value ? "var(--text-primary)" : "var(--text-hint)",
        fontFamily: "var(--font)", outline: "none", cursor: "pointer",
      }}
      onFocus={(e) => { e.target.style.background = "var(--blue-50)"; e.target.style.borderRadius = "4px"; }}
      onBlur={(e) => { e.target.style.background = "transparent"; }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CellInput({ value, onChange, type = "text", placeholder = "", min, max }) {
  return (
    <input
      type={type} value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max}
      style={{
        width: "100%", border: "none", background: "transparent",
        fontSize: 11.5, padding: "4px 5px", color: "var(--text-primary)",
        fontFamily: "var(--font)", outline: "none",
      }}
      onFocus={(e) => { e.target.style.background = "var(--blue-50)"; e.target.style.borderRadius = "4px"; }}
      onBlur={(e) => { e.target.style.background = "transparent"; }}
    />
  );
}

// ── Nouvelle ligne vide ───────────────────────────────────────

const newRow = () => ({
  date: "",
  num_resident: "",
  age: "",
  genre: "",
  classe_plaisir: "",
  jour_hosp: "",
  heure_hosp: "",
  type_hosp: "",
  demandeur: "",
  lieu_hosp: "",
  duree_hosp: "",
  motif: "",
  issue: "",
  remarques: "",
});

// ── Colonnes du tableau ───────────────────────────────────────

const COLUMNS = [
  // En-tête groupé "Information Résident"
  { key: "#",             label: "#",                  width: 28,  group: "" },
  { key: "date",          label: "Date",               width: 100, group: "Information Résident" },
  { key: "num_resident",  label: "N° Résident",        width: 80,  group: "Information Résident" },
  { key: "age",           label: "Âge",                width: 58,  group: "Information Résident" },
  { key: "genre",         label: "Genre",              width: 70,  group: "Information Résident" },
  { key: "classe_plaisir",label: "Classe PLAISIR",     width: 70,  group: "Information Résident" },
  // Dates/heures
  { key: "jour_hosp",     label: "Jour d'hosp.",       width: 120, group: "Dates / Heures" },
  { key: "heure_hosp",    label: "Heure d'hosp.",      width: 100, group: "Dates / Heures" },
  // Hospitalisation
  { key: "type_hosp",     label: "Type d'hosp.",       width: 90,  group: "Hospitalisation" },
  { key: "demandeur",     label: "Hosp. à la demande de", width: 150, group: "Hospitalisation" },
  { key: "lieu_hosp",     label: "Lieu d'hosp.",       width: 90,  group: "Hospitalisation" },
  { key: "duree_hosp",    label: "Durée d'hosp. (j)",  width: 80,  group: "Hospitalisation" },
  // Motif
  { key: "motif",         label: "Motifs",             width: 210, group: "Motif d'hospitalisation" },
  // Post-hosp
  { key: "issue",         label: "Issue de l'hosp.",   width: 130, group: "Post-hospitalisation" },
  // Remarques
  { key: "remarques",     label: "Remarques / Commentaires", width: 140, group: "Remarques" },
  // Actions
  { key: "_del",          label: "",                   width: 32,  group: "" },
];

// Groupes pour l'en-tête fusionné
const GROUPS = [
  { label: "",                      span: 1,  color: "transparent", text: "transparent" },
  { label: "Information Résident",  span: 5,  color: "#FFF9C4",     text: "#7B6B00" },
  { label: "Dates / Heures",        span: 2,  color: "#F8E0D0",     text: "#7B3000" },
  { label: "Hospitalisation",       span: 4,  color: "#D8EEF7",     text: "#0D4F74" },
  { label: "Motif d'hospitalisation", span: 1, color: "#E8F5E9",   text: "#1B5E20" },
  { label: "Post-hospitalisation",  span: 1,  color: "#F3E5F5",     text: "#4A148C" },
  { label: "Remarques",             span: 1,  color: "#ECEFF1",     text: "#37474F" },
  { label: "",                      span: 1,  color: "transparent", text: "transparent" },
];

// ── Composant principal ───────────────────────────────────────

export default function Saisie() {
  const [rows, setRows] = useState([newRow()]);
  const [etablissements, setEtablissements] = useState([]);
  const [campagnes, setCampagnes] = useState([]);
  const [etablissementId, setEtablissementId] = useState("");
  const [campagneId, setCampagneId] = useState("");
  const [nomEms, setNomEms] = useState("");
  const [reseauSante, setReseauSante] = useState("");
  const [nbLits, setNbLits] = useState("");
  const [nbDeces, setNbDeces] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([getEtablissements(), getCampagnes()]).then(([etabs, camps]) => {
      setEtablissements(etabs);
      const ouvertes = camps.filter((c) => c.statut === "ouverte");
      setCampagnes(ouvertes);
      if (etabs.length > 0) {
        setEtablissementId(etabs[0].id);
        setNomEms(etabs[0].nom || "");
      }
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
      const hospitalisations = rows
        .filter((r) => r.date || r.num_resident || r.motif)
        .map((r) => ({
          date: r.date || null,
          num_resident: r.num_resident || null,
          age: r.age ? parseInt(r.age) : null,
          genre: r.genre || null,
          classe_plaisir: r.classe_plaisir ? parseInt(r.classe_plaisir) : null,
          jour_hosp: r.jour_hosp || null,
          heure_hosp: r.heure_hosp || null,
          type_hosp: r.type_hosp || null,
          demandeur: r.demandeur || null,
          lieu_hosp: r.lieu_hosp || null,
          duree_hosp: r.duree_hosp || null,
          motif: r.motif || null,
          issue: r.issue || null,
          remarques: r.remarques || null,
        }));

      const veille = await createVeille({
        campagne_id: campagneId,
        etablissement_id: etablissementId,
        nom_ems: nomEms,
        reseau_sante: reseauSante,
        nb_lits: parseInt(nbLits) || 0,
        nb_deces: parseInt(nbDeces) || 0,
        hospitalisations,
      });

      await soumettreVeille(veille.id);
      setMessage({ type: "success", text: `Saisie soumise avec succès — ${hospitalisations.length} hospitalisation(s) enregistrée(s).` });
      setRows([newRow()]);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats rapides
  const total = rows.filter((r) => r.date || r.num_resident || r.motif).length;
  const urgences = rows.filter((r) => r.type_hosp === "Urgence").length;
  const retourEms = rows.filter((r) => r.issue === "Retour EMS").length;
  const campagneActive = campagnes.find((c) => c.id === campagneId);

  const tdStyle = { borderRight: "1px solid var(--border-light)", padding: 0, verticalAlign: "middle" };

  return (
    <div>
      {/* ── Barre supérieure ── */}
      <div style={{
        padding: "16px 24px", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.3px" }}>
            Saisie des veilles hospitalières
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {campagneActive
              ? `Période : ${new Date(campagneActive.date_debut).toLocaleDateString("fr-FR")} au ${new Date(campagneActive.date_fin).toLocaleDateString("fr-FR")}`
              : "Sélectionnez une campagne"}
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ fontSize: 12 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Envoi…" : "Soumettre la saisie"}
        </button>
      </div>

      {message && (
        <div style={{
          margin: "12px 24px 0", padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          background: message.type === "success" ? "var(--green-50)" : "var(--red-50)",
          color: message.type === "success" ? "var(--green-600)" : "var(--red-600)",
          fontSize: 13,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ padding: "16px 24px 32px" }}>

        {/* ── Métadonnées EMS ── */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "14px 18px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
            Informations de l'établissement
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label className="form-label">Campagne</label>
              <select className="form-select" style={{ width: 220 }} value={campagneId} onChange={(e) => setCampagneId(e.target.value)}>
                {campagnes.length === 0
                  ? <option>Aucune campagne ouverte</option>
                  : campagnes.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Établissement</label>
              <select
                className="form-select"
                style={{ width: 200 }}
                value={etablissementId}
                onChange={(e) => {
                  setEtablissementId(e.target.value);
                  const etab = etablissements.find((et) => et.id === e.target.value);
                  if (etab) setNomEms(etab.nom || "");
                }}
              >
                {etablissements.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Réseau de santé</label>
              <input className="form-input" style={{ width: 160 }} value={reseauSante} onChange={(e) => setReseauSante(e.target.value)} placeholder="Ex: HévivA" />
            </div>
            <div>
              <label className="form-label">Nombre de lits</label>
              <input className="form-input" type="number" style={{ width: 90 }} value={nbLits} onChange={(e) => setNbLits(e.target.value)} min="0" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Nombre de décès</label>
              <input className="form-input" type="number" style={{ width: 90 }} value={nbDeces} onChange={(e) => setNbDeces(e.target.value)} min="0" placeholder="0" />
            </div>
          </div>
        </div>

        {/* ── Stats rapides ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            ["Hospitalisations saisies", total],
            ["Urgences", urgences || "—"],
            ["Retours EMS", retourEms || "—"],
            ["Lignes", rows.length],
          ].map(([label, val]) => (
            <div key={label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-hint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Tableau principal ── */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
              <thead>
                {/* En-têtes de groupe */}
                <tr>
                  {GROUPS.map((g, gi) => (
                    <th
                      key={gi}
                      colSpan={g.span}
                      style={{
                        background: g.color,
                        color: g.text,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "5px 6px",
                        borderBottom: "1px solid var(--border-light)",
                        borderRight: "1px solid var(--border-light)",
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.label}
                    </th>
                  ))}
                </tr>
                {/* En-têtes de colonnes */}
                <tr style={{ background: "var(--gray-50)" }}>
                  {COLUMNS.map((col) => (
                    <th key={col.key} style={{
                      width: col.width, minWidth: col.width,
                      padding: "8px 6px", textAlign: "left",
                      fontSize: 10, fontWeight: 600, color: "var(--text-secondary)",
                      borderBottom: "1px solid var(--border)",
                      borderRight: "1px solid var(--border-light)",
                      whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em",
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}
                  >
                    {/* # */}
                    <td style={{ ...tdStyle, padding: "2px 6px", textAlign: "center", fontSize: 11, color: "var(--text-hint)" }}>{idx + 1}</td>

                    {/* Date */}
                    <td style={tdStyle}>
                      <CellInput type="date" value={row.date} onChange={(v) => updateRow(idx, "date", v)} />
                    </td>

                    {/* N° Résident */}
                    <td style={tdStyle}>
                      <CellInput value={row.num_resident} onChange={(v) => updateRow(idx, "num_resident", v)} placeholder="N° résident" />
                    </td>

                    {/* Âge */}
                    <td style={tdStyle}>
                      <CellSelect value={row.age} onChange={(v) => updateRow(idx, "age", v)} options={AGES} placeholder="—" />
                    </td>

                    {/* Genre */}
                    <td style={tdStyle}>
                      <CellSelect value={row.genre} onChange={(v) => updateRow(idx, "genre", v)} options={GENRES} placeholder="—" />
                    </td>

                    {/* Classe PLAISIR */}
                    <td style={tdStyle}>
                      <CellSelect value={row.classe_plaisir} onChange={(v) => updateRow(idx, "classe_plaisir", v)} options={CLASSES_PLAISIR} placeholder="—" />
                    </td>

                    {/* Jour d'hosp. */}
                    <td style={tdStyle}>
                      <CellSelect value={row.jour_hosp} onChange={(v) => updateRow(idx, "jour_hosp", v)} options={JOURS_HOSP} placeholder="—" />
                    </td>

                    {/* Heure d'hosp. */}
                    <td style={tdStyle}>
                      <CellSelect value={row.heure_hosp} onChange={(v) => updateRow(idx, "heure_hosp", v)} options={HEURES_HOSP} placeholder="—" />
                    </td>

                    {/* Type d'hosp. */}
                    <td style={tdStyle}>
                      <CellSelect value={row.type_hosp} onChange={(v) => updateRow(idx, "type_hosp", v)} options={TYPES_HOSP} placeholder="—" />
                    </td>

                    {/* Demandeur */}
                    <td style={tdStyle}>
                      <CellSelect value={row.demandeur} onChange={(v) => updateRow(idx, "demandeur", v)} options={DEMANDEURS} placeholder="—" />
                    </td>

                    {/* Lieu d'hosp. */}
                    <td style={tdStyle}>
                      <CellSelect value={row.lieu_hosp} onChange={(v) => updateRow(idx, "lieu_hosp", v)} options={LIEUX_HOSP} placeholder="—" />
                    </td>

                    {/* Durée d'hosp. */}
                    <td style={tdStyle}>
                      <CellSelect value={row.duree_hosp} onChange={(v) => updateRow(idx, "duree_hosp", v)} options={DUREES_HOSP} placeholder="—" />
                    </td>

                    {/* Motif */}
                    <td style={tdStyle}>
                      <CellSelect value={row.motif} onChange={(v) => updateRow(idx, "motif", v)} options={MOTIFS} placeholder="—" />
                    </td>

                    {/* Issue */}
                    <td style={tdStyle}>
                      <CellSelect value={row.issue} onChange={(v) => updateRow(idx, "issue", v)} options={ISSUES} placeholder="—" />
                    </td>

                    {/* Remarques */}
                    <td style={tdStyle}>
                      <CellInput value={row.remarques} onChange={(v) => updateRow(idx, "remarques", v)} placeholder="Observations…" />
                    </td>

                    {/* Supprimer */}
                    <td style={{ textAlign: "center", padding: 0 }}>
                      <button
                        onClick={() => deleteRow(idx)}
                        title="Supprimer la ligne"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--text-hint)", padding: "6px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--red-500)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-hint)"}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M3 3l10 10M13 3L3 13" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ajouter une ligne */}
          <div
            onClick={addRow}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 16px", fontSize: 13,
              color: "var(--text-secondary)", cursor: "pointer",
              borderTop: "1px solid var(--border-light)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-50)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="8" cy="8" r="7" />
              <path d="M8 5v6M5 8h6" />
            </svg>
            Ajouter une hospitalisation
          </div>
        </div>

      </div>
    </div>
  );
}
