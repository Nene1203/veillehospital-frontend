import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ── Couleurs HévivA ───────────────────────────────────────────
const TEAL = "#00A89D";
const LIME = "#8DC63F";
const DARK = "#1A2332";
const GRAY = "#64748B";

// ── Utilitaires ───────────────────────────────────────────────
const fmt = (v) => v != null ? (typeof v === "number" ? v.toLocaleString("fr-CH") : v) : "—";

// ── Bouton Export ─────────────────────────────────────────────
export function BoutonExport({ kpis, etabStats, pathoStats, evolution, selectedKpi, activeKpiConfig, periodLabel, etablissements, selectedEtabs }) {
  const [loading, setLoading] = useState(false);

  const genererPDF = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const ml = 15, mr = 15, mt = 20;
      const cw = W - ml - mr;

      // ── Page 1 : En-tête + KPIs + Graphique ─────────────────

      // Fond header
      pdf.setFillColor(26, 35, 50);
      pdf.rect(0, 0, W, 38, "F");

      // Bande teal gauche
      pdf.setFillColor(0, 168, 157);
      pdf.rect(0, 0, 5, 38, "F");

      // Bande lime
      pdf.setFillColor(141, 198, 63);
      pdf.rect(5, 0, 2, 38, "F");

      // Titre
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("VeilleHospital", ml + 2, 16);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Rapport d'activité — HévivA", ml + 2, 24);
      pdf.text(`Généré le ${new Date().toLocaleDateString("fr-CH")} à ${new Date().toLocaleTimeString("fr-CH")}`, ml + 2, 30);

      // Période et périmètre à droite
      pdf.setTextColor(141, 198, 63);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(periodLabel, W - mr, 20, { align: "right" });
      pdf.setTextColor(148, 163, 184);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("GeneiVision · Nelson Telep", W - mr, 30, { align: "right" });

      let y = 48;

      // ── Section KPIs ────────────────────────────────────────
      pdf.setTextColor(100, 116, 139);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("INDICATEURS CLÉS", ml, y);
      pdf.setDrawColor(0, 168, 157);
      pdf.setLineWidth(0.5);
      pdf.line(ml, y + 2, W - mr, y + 2);
      y += 8;

      const kpiItems = [
        { label: "Hospitalisations",    value: fmt(kpis?.total_hospitalisations),  unit: "",  color: TEAL },
        { label: "Durée moy. séjour",   value: fmt(kpis?.duree_moyenne_sejour),    unit: "j", color: LIME },
        { label: "Taux remplissage",     value: fmt(kpis?.taux_remplissage_moyen),  unit: "%", color: TEAL },
        { label: "Attente avant op.",    value: fmt(kpis?.attente_moyenne_avant_op),unit: "j", color: LIME },
        { label: "Patients sortis",      value: fmt(kpis?.total_sortis),            unit: "",  color: TEAL },
        { label: "Patients présents",    value: fmt(kpis?.total_presents),          unit: "",  color: GRAY },
        { label: "Transferts",           value: fmt(kpis?.total_transferts),        unit: "",  color: GRAY },
        { label: "Réhospitalisations",   value: fmt(kpis?.total_rehospitalisations),unit: "",  color: GRAY },
      ];

      const kpiW = cw / 4;
      kpiItems.forEach((k, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = ml + col * kpiW;
        const ky = y + row * 22;

        // Fond carte
        const rgb = k.color === TEAL ? [230,247,246] : k.color === LIME ? [242,249,232] : [248,249,250];
        pdf.setFillColor(...rgb);
        pdf.roundedRect(x, ky, kpiW - 2, 20, 2, 2, "F");

        // Barre couleur top
        const colRgb = k.color === TEAL ? [0,168,157] : k.color === LIME ? [141,198,63] : [173,181,189];
        pdf.setFillColor(...colRgb);
        pdf.rect(x, ky, kpiW - 2, 1.5, "F");

        // Label
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text(k.label.toUpperCase(), x + 3, ky + 6);

        // Valeur
        pdf.setTextColor(...colRgb);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.text(`${k.value}${k.unit}`, x + 3, ky + 15);
      });

      y += 50;

      // ── Graphique évolution (capture canvas) ────────────────
      const chartCanvas = document.getElementById(`evo-${activeKpiConfig?.key || "total_hospitalisations"}-${""}`);
      // Chercher n'importe quel canvas d'évolution
      const allCanvas = document.querySelectorAll("canvas");
      let evoCanvas = null;
      allCanvas.forEach(c => { if (c.id && c.id.startsWith("evo-")) evoCanvas = c; });

      if (evoCanvas) {
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(`ÉVOLUTION — ${(activeKpiConfig?.label || "HOSPITALISATIONS").toUpperCase()}`, ml, y);
        pdf.setDrawColor(0, 168, 157);
        pdf.line(ml, y + 2, W - mr, y + 2);
        y += 7;

        const imgData = evoCanvas.toDataURL("image/png");
        const imgH = 45;
        pdf.addImage(imgData, "PNG", ml, y, cw * 0.62, imgH);
        y += imgH + 6;
      } else {
        // Graphique évolution textuel si pas de canvas
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text("ÉVOLUTION DES HOSPITALISATIONS", ml, y);
        pdf.setDrawColor(0, 168, 157);
        pdf.line(ml, y + 2, W - mr, y + 2);
        y += 8;

        if (evolution && evolution.length > 0) {
          const maxVal = Math.max(...evolution.map(e => e.value || 0));
          const barW = Math.min(8, (cw - 20) / evolution.length);
          const chartH = 30;
          const chartY = y + chartH;

          evolution.forEach((e, i) => {
            const bh = maxVal > 0 ? (e.value / maxVal) * chartH : 0;
            const bx = ml + 10 + i * (barW + 1);
            pdf.setFillColor(0, 168, 157, 0.6);
            pdf.setFillColor(180, 230, 225);
            pdf.rect(bx, chartY - bh, barW, bh, "F");
            pdf.setFillColor(0, 168, 157);
            pdf.rect(bx, chartY - bh, barW, 0.5, "F");
            if (i % 2 === 0) {
              pdf.setTextColor(173, 181, 189);
              pdf.setFontSize(6);
              pdf.text(e.label, bx + barW/2, chartY + 4, { align: "center" });
            }
          });
          pdf.setDrawColor(226, 232, 240);
          pdf.line(ml + 8, chartY, W - mr - 5, chartY);
          y += chartH + 12;
        }
      }

      // ── Page 2 : Tableau détail établissements ───────────────
      if (etabStats && etabStats.filter(e => e.hospitalisations > 0).length > 0) {
        pdf.addPage();

        // Header page 2
        pdf.setFillColor(26, 35, 50);
        pdf.rect(0, 0, W, 22, "F");
        pdf.setFillColor(0, 168, 157);
        pdf.rect(0, 0, 5, 22, "F");
        pdf.setFillColor(141, 198, 63);
        pdf.rect(5, 0, 2, 22, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text("Détail par établissement", ml + 2, 14);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(periodLabel, W - mr, 14, { align: "right" });

        y = 32;

        // En-têtes tableau
        const cols = [
          { label: "Établissement", w: 55 },
          { label: "Hospit.", w: 20 },
          { label: "Durée moy.", w: 22 },
          { label: "Taux rempl.", w: 22 },
          { label: "Sortis", w: 18 },
          { label: "Transferts", w: 22 },
          { label: "Réhospit.", w: 21 },
        ];

        // Header tableau
        pdf.setFillColor(26, 35, 50);
        pdf.rect(ml, y, cw, 8, "F");
        let cx = ml;
        cols.forEach(col => {
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7.5);
          pdf.text(col.label, cx + 2, y + 5.5);
          cx += col.w;
        });
        y += 8;

        // Lignes tableau
        const dataRows = etabStats.filter(e => e.hospitalisations > 0);
        dataRows.forEach((e, idx) => {
          const rowH = 8;
          // Fond alterné
          if (idx % 2 === 0) {
            pdf.setFillColor(248, 249, 250);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(ml, y, cw, rowH, "F");

          // Alerte taux remplissage
          if (e.taux_remplissage > 90) {
            pdf.setFillColor(254, 242, 242);
            pdf.rect(ml, y, cw, rowH, "F");
          }

          cx = ml;
          const rowData = [
            { val: e.etablissement_nom?.substring(0, 28) || "—", bold: false, color: [26, 35, 50] },
            { val: e.hospitalisations?.toLocaleString("fr-CH") || "0", bold: true, color: [0, 168, 157] },
            { val: e.duree_moyenne ? `${e.duree_moyenne}j` : "—", bold: false, color: [100, 116, 139] },
            { val: e.taux_remplissage ? `${e.taux_remplissage}%` : "—", bold: true, color: e.taux_remplissage > 90 ? [220, 38, 38] : [0, 168, 157] },
            { val: String(e.sortis || 0), bold: false, color: [100, 116, 139] },
            { val: String(e.transferts || 0), bold: false, color: [100, 116, 139] },
            { val: String(e.rehospitalisations || 0), bold: false, color: [100, 116, 139] },
          ];

          rowData.forEach((cell, ci) => {
            pdf.setTextColor(...cell.color);
            pdf.setFont("helvetica", cell.bold ? "bold" : "normal");
            pdf.setFontSize(7.5);
            pdf.text(cell.val, cx + 2, y + 5.5);
            cx += cols[ci].w;
          });

          // Bordure bas
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.2);
          pdf.line(ml, y + rowH, W - mr, y + rowH);

          y += rowH;

          // Nouvelle page si besoin
          if (y > H - 20) {
            pdf.addPage();
            y = 20;
          }
        });

        // ── Répartition pathologies ──────────────────────────
        if (pathoStats && pathoStats.length > 0 && y < H - 60) {
          y += 10;
          pdf.setTextColor(100, 116, 139);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.text("RÉPARTITION PAR PATHOLOGIE", ml, y);
          pdf.setDrawColor(141, 198, 63);
          pdf.line(ml, y + 2, W - mr, y + 2);
          y += 8;

          const colors = [
            [0,168,157],[141,198,63],[173,181,189],[59,130,246],[245,158,11],
          ];
          pathoStats.slice(0, 5).forEach((p, i) => {
            const barMaxW = cw * 0.5;
            const barW2 = p.pourcentage / 100 * barMaxW;
            const rgb = colors[i] || [173,181,189];

            pdf.setFillColor(...rgb);
            pdf.roundedRect(ml, y, barW2, 6, 1, 1, "F");

            pdf.setTextColor(26, 35, 50);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.text(p.pathologie, ml + barMaxW + 4, y + 4.5);
            pdf.setTextColor(...rgb);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${p.pourcentage}%`, ml + barMaxW + 60, y + 4.5);

            y += 9;
          });
        }
      }

      // ── Footer toutes pages ──────────────────────────────────
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(248, 249, 250);
        pdf.rect(0, H - 10, W, 10, "F");
        pdf.setDrawColor(226, 232, 240);
        pdf.line(0, H - 10, W, H - 10);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text("Confidentiel — VeilleHospital · GeneiVision", ml, H - 4);
        pdf.text(`Page ${i} / ${totalPages}`, W - mr, H - 4, { align: "right" });
      }

      // Téléchargement
      const date = new Date().toISOString().split("T")[0];
      pdf.save(`VeilleHospital_Rapport_${date}.pdf`);

    } catch (err) {
      console.error("Erreur export PDF:", err);
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={genererPDF}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", borderRadius: 8, border: "none",
        background: loading ? "#ADB5BD" : TEAL,
        color: "white", fontWeight: 700, fontSize: 12,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        boxShadow: loading ? "none" : "0 2px 8px rgba(0,168,157,0.3)",
      }}
      title="Exporter le rapport en PDF"
    >
      {loading ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Génération…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exporter PDF
        </>
      )}
    </button>
  );
}
