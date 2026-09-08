import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LigneExport } from "./types";
import { Eleve } from "../models/types";
import { MATIERES } from "../data/subjects";

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

function slugifyLocal(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Génère le bulletin PDF individuel d'un élève : identité, notes par
 * matière, moyenne générale, rangs et appréciation du conseil de classe. */
export function exporterBulletinIndividuel(
  eleve: Eleve,
  nomClasse: string,
  nomSession: string,
  appreciation: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const inkColor: [number, number, number] = [16, 27, 51];
  const goldColor: [number, number, number] = [201, 162, 39];
  const slateColor: [number, number, number] = [85, 96, 122];
  const derniere = eleve.moyennes[eleve.moyennes.length - 1];

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...inkColor);
  doc.text("BULLETIN SCOLAIRE", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...slateColor);
  doc.text(
    `${nomSession} · ${derniere ? `Trimestre ${derniere.trimestre} · ${derniere.annee}` : ""}`,
    40,
    68
  );

  doc.setDrawColor(...goldColor);
  doc.setLineWidth(1.2);
  doc.line(40, 78, 555, 78);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...inkColor);
  doc.text(`${eleve.nom} ${eleve.prenom}`, 40, 102);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...slateColor);
  doc.text(`Matricule ${eleve.matricule}  ·  ${nomClasse}  ·  Origine : ${eleve.pays}`, 40, 118);

  if (derniere) {
    autoTable(doc, {
      startY: 138,
      head: [["Matière", "Coefficient", "Moyenne / 20"]],
      body: derniere.parMatiere.map((m) => [
        MATIERES.find((x) => x.key === m.matiere)?.nom ?? m.matiere,
        m.coefficient,
        m.moyenne.toFixed(2),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 9.5,
        textColor: inkColor,
        lineColor: [220, 217, 206],
        lineWidth: 0.5,
      },
      headStyles: { fillColor: inkColor, textColor: [250, 250, 247], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 239, 233] },
    });

    // @ts-expect-error — lastAutoTable est injecté par jspdf-autotable au runtime
    const finTableau = doc.lastAutoTable.finalY as number;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...inkColor);
    doc.text(`Moyenne générale : ${derniere.moyenneGenerale.toFixed(2)} / 20`, 40, finTableau + 26);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...slateColor);
    doc.text(
      `Rang : ${derniere.rangClasse} sur la classe · ${derniere.rangGeneration} sur la génération`,
      40,
      finTableau + 42
    );

    doc.setDrawColor(220, 217, 206);
    doc.setLineWidth(0.75);
    doc.line(40, finTableau + 58, 555, finTableau + 58);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...inkColor);
    doc.text("Appréciation du conseil de classe", 40, finTableau + 78);

    doc.setFont("times", "italic");
    doc.setFontSize(10.5);
    doc.setTextColor(...inkColor);
    const lignesAppreciation = doc.splitTextToSize(appreciation, 515);
    doc.text(lignesAppreciation, 40, finTableau + 96);

    const yFinal = finTableau + 96 + lignesAppreciation.length * 14 + 40;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...slateColor);
    doc.text("Le Professeur Principal", 40, yFinal);
    doc.text("Le Chef d'Établissement", 400, yFinal);
  }

  doc.setFontSize(8);
  doc.setTextColor(...slateColor);
  doc.text(
    `Académie — ${nomSession}`,
    40,
    doc.internal.pageSize.getHeight() - 20
  );

  doc.save(`bulletin-${slugifyLocal(eleve.matricule + "-" + eleve.nom + "-" + eleve.prenom)}.pdf`);
}
