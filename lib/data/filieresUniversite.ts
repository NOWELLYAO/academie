import { Eleve } from "../models/types";
import { RNG, pick } from "../utils/random";

export interface FiliereUniv {
  id: string;
  nom: string;
  domaines: ("scientifique" | "litteraire" | "technologique" | "naturaliste" | "generale")[];
  critere: (c: Eleve["competences"]) => boolean;
}

export const FILIERES_UNIVERSITE: FiliereUniv[] = [
  {
    id: "medecine",
    nom: "Médecine",
    domaines: ["naturaliste"],
    critere: (c) => c.svt >= 15 && c.mathematiques >= 12,
  },
  {
    id: "droit",
    nom: "Droit",
    domaines: ["litteraire", "generale"],
    critere: (c) => c.francais >= 13,
  },
  {
    id: "sciences-eco",
    nom: "Sciences Économiques",
    domaines: ["scientifique", "litteraire", "generale"],
    critere: (c) => c.mathematiques >= 12,
  },
  {
    id: "maths-info",
    nom: "Mathématiques-Informatique",
    domaines: ["scientifique", "technologique"],
    critere: (c) => c.mathematiques >= 13 && c.informatique >= 12,
  },
  {
    id: "physique-chimie",
    nom: "Physique-Chimie",
    domaines: ["scientifique"],
    critere: (c) => c.physique >= 13 && c.mathematiques >= 12,
  },
  {
    id: "lettres-langues",
    nom: "Lettres & Langues",
    domaines: ["litteraire"],
    critere: (c) => c.francais >= 10 || c.anglais >= 10,
  },
  {
    id: "sciences-humaines",
    nom: "Sciences Humaines & Psychologie",
    domaines: ["litteraire", "generale"],
    critere: () => true,
  },
];

function domainesCompatibles(eleve: Eleve, domaines: FiliereUniv["domaines"]): boolean {
  if (eleve.serieBac === "A") return domaines.includes("litteraire") || domaines.includes("generale");
  if (eleve.serieBac === "C") {
    return domaines.includes("scientifique") || domaines.includes("technologique") || domaines.includes("generale");
  }
  if (eleve.serieBac === "D") {
    return (
      domaines.includes("scientifique") ||
      domaines.includes("technologique") ||
      domaines.includes("naturaliste") ||
      domaines.includes("generale")
    );
  }
  return true;
}

/** Choisit la filière universitaire d'un élève entrant (ou déjà) à
 * l'université, selon sa série de Bac d'origine et ses compétences. Ne
 * bloque jamais : si aucune filière sélective n'est accessible, un repli
 * généraliste (Sciences Humaines) reste toujours disponible. */
export function choisirFiliereUniversite(eleve: Eleve, rng: RNG): FiliereUniv {
  const c = eleve.competences;
  const eligibles = FILIERES_UNIVERSITE.filter((f) => domainesCompatibles(eleve, f.domaines) && f.critere(c));
  if (eligibles.length > 0) return pick(rng, eligibles);

  const repli = FILIERES_UNIVERSITE.filter((f) => domainesCompatibles(eleve, f.domaines));
  return repli.length > 0 ? pick(rng, repli) : FILIERES_UNIVERSITE[FILIERES_UNIVERSITE.length - 1];
}
