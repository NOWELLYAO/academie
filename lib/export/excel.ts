import * as XLSX from "xlsx";
import { LigneExport } from "./types";

export function exporterExcel(
  lignes: LigneExport[],
  titre: string,
  sousTitre: string,
  nomFichier: string
) {
  const enTetes = ["Rang", "Matricule", "Nom", "Prénom", "Classe", "Niveau", "Moyenne", "Statut"];
  const donnees = lignes.map((l) => [
    l.rang,
    l.matricule,
    l.nom,
    l.prenom,
    l.classeNom,
    l.niveauLisible,
    l.moyenne,
    l.statut,
  ]);

  const feuille = XLSX.utils.aoa_to_sheet([
    [titre],
    [sousTitre],
    [],
    enTetes,
    ...donnees,
  ]);

  feuille["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 18 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
  ];
  feuille["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: enTetes.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: enTetes.length - 1 } },
  ];

  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, "Fiche");
  XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}
