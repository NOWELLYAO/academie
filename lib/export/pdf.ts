import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LigneExport } from "./types";

export function exporterPDF(
  lignes: LigneExport[],
  titre: string,
  sousTitre: string,
  nomFichier: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const inkColor: [number, number, number] = [16, 27, 51];
  const goldColor: [number, number, number] = [201, 162, 39];
  const slateColor: [number, number, number] = [85, 96, 122];

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...inkColor);
  doc.text(titre, 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...slateColor);
  doc.text(sousTitre, 40, 68);

  doc.setDrawColor(...goldColor);
  doc.setLineWidth(1.2);
  doc.line(40, 78, 555, 78);

  autoTable(doc, {
    startY: 92,
    head: [["Rang", "Matricule", "Nom", "Prénom", "Classe", "Niveau", "Moyenne", "Statut"]],
    body: lignes.map((l) => [
      l.rang,
      l.matricule,
      l.nom,
      l.prenom,
      l.classeNom,
      l.niveauLisible,
      l.moyenne.toFixed(2),
      l.statut,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: inkColor,
      lineColor: [220, 217, 206],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: inkColor,
      textColor: [250, 250, 247],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [240, 239, 233] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const rang = Number(data.cell.raw);
        if (rang <= 3) {
          data.cell.styles.textColor = goldColor;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...slateColor);
    doc.text(
      `Académie — Génération 2026 · Page ${i}/${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 20
    );
  }

  doc.save(`${nomFichier}.pdf`);
}
