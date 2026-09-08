export interface FiliereUniversitaire {
  nom: string;
  domaine: "ingenierie" | "informatique" | "sciences" | "lettres";
}

export const FILIERES_MATHS_PHYSIQUE: FiliereUniversitaire[] = [
  { nom: "Génie civil", domaine: "ingenierie" },
  { nom: "Génie mécanique", domaine: "ingenierie" },
  { nom: "Génie électrique", domaine: "ingenierie" },
  { nom: "Génie industriel", domaine: "ingenierie" },
];

export const FILIERES_MATHS_INFO: FiliereUniversitaire[] = [
  { nom: "Informatique", domaine: "informatique" },
  { nom: "Intelligence artificielle", domaine: "informatique" },
  { nom: "Data Science", domaine: "informatique" },
  { nom: "Cybersécurité", domaine: "informatique" },
  { nom: "Génie logiciel", domaine: "informatique" },
];

export const FILIERES_SVT: FiliereUniversitaire[] = [
  { nom: "Biologie", domaine: "sciences" },
  { nom: "Médecine", domaine: "sciences" },
  { nom: "Agronomie", domaine: "sciences" },
  { nom: "Sciences de la vie", domaine: "sciences" },
];

export const FILIERES_LITTERAIRES: FiliereUniversitaire[] = [
  { nom: "Droit", domaine: "lettres" },
  { nom: "Communication", domaine: "lettres" },
  { nom: "Sciences politiques", domaine: "lettres" },
  { nom: "Lettres modernes", domaine: "lettres" },
  { nom: "Langues", domaine: "lettres" },
];
