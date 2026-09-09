import { Eleve } from "../models/types";
import { Badge } from "./badges";

function anneeNumero(annee: string): number {
  return parseInt(annee.split("-")[0], 10);
}

/** Calcule les badges liés à la carrière professionnelle d'un élève déjà
 * diplômé (ou retraité) — distincts des badges scolaires. */
export function calculerBadgesCarriere(eleve: Eleve, anneeCourante: string): Badge[] {
  const c = eleve.carriere;
  if (!c) return [];
  const badges: Badge[] = [];

  if (c.niveauResponsabilite >= 5) {
    badges.push({
      titre: "Élite dirigeante",
      icone: "👑",
      description: "A atteint le sommet de la hiérarchie professionnelle.",
    });
  }

  const anneesDepuisDebut = anneeNumero(anneeCourante) - anneeNumero(c.anneeDebut);
  if (c.niveauResponsabilite >= 4 && anneesDepuisDebut > 0 && anneesDepuisDebut <= 4) {
    badges.push({
      titre: "Ascension fulgurante",
      icone: "🚀",
      description: "Une progression de carrière exceptionnellement rapide.",
    });
  }

  const promotions = c.historique.filter((h) => h.motif.startsWith("Promotion")).length;
  if (c.historique.length >= 5 && promotions <= 1) {
    badges.push({
      titre: "Pilier de l'entreprise",
      icone: "🏛️",
      description: "Une longue carrière stable, fidèle à son poste.",
    });
  }

  if (c.typeCarriere === "entrepreneur" && c.statutEntreprise === "succes") {
    badges.push({
      titre: "Entrepreneur accompli",
      icone: "💡",
      description: "A bâti une entreprise florissante depuis le diplôme.",
    });
  }
  if (c.statutEntreprise === "faillite") {
    badges.push({
      titre: "Rebond entrepreneurial",
      icone: "🔁",
      description: "S'est relevé(e) après l'échec de sa première entreprise.",
    });
  }

  if (c.paysExpatriation) {
    badges.push({
      titre: `Expatrié(e) — ${c.paysExpatriation}`,
      icone: "🌍",
      description: "A construit sa carrière à l'international.",
    });
  }

  if (eleve.marie) {
    badges.push({
      titre: "Marié(e)",
      icone: "💍",
      description: `Marié(e) depuis ${eleve.anneeMariage ?? ""}.`,
    });
  }

  if (eleve.statut === "retraite") {
    badges.push({
      titre: "Retraité(e)",
      icone: "🌅",
      description: "Une carrière achevée après de longues années de service.",
    });
  }

  return badges;
}
