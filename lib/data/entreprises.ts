export const ENTREPRISES_PAR_SECTEUR: Record<string, string[]> = {
  "Banque & Finance": [
    "Baobab Capital Bank",
    "Lagune Finance Group",
    "Sahel Crédit & Épargne",
    "Atlantia Banque",
    "Cauris Investment Bank",
    "Golfe Financial Holding",
  ],
  "Pétrole & Énergie": [
    "Golfe Énergie",
    "AfricOil Group",
    "Lagune Pétrole & Gaz",
    "Savane Énergie",
    "Cauris Ressources",
  ],
  "BTP & Construction": [
    "Baobab Construction",
    "Atlantia BTP",
    "Lagune Travaux Publics",
    "Sahel Bâtiment & Génie Civil",
    "Cauris Infrastructures",
  ],
  Santé: [
    "Clinique de la Lagune",
    "Hôpital Baobab",
    "Centre Médical Atlantia",
    "Polyclinique du Golfe",
    "Fondation Santé Savane",
  ],
  "Technologie & Informatique": [
    "NovaTech Afrique",
    "ByteWave Solutions",
    "Kora Digital",
    "Lagune Software",
    "Sahel Data Systems",
    "Cauris Cloud",
  ],
  "Droit & Justice": [
    "Cabinet Baobab & Associés",
    "Étude Notariale Atlantia",
    "Cabinet Lagune Conseil",
    "Cauris Legal Partners",
  ],
  Éducation: [
    "Groupe Scolaire Baobab",
    "Institut Atlantia",
    "Lycée International de la Lagune",
    "Fondation Éducative Sahel",
  ],
  "Administration publique": [
    "Ministère (Administration centrale)",
    "Direction Régionale Atlantia",
    "Préfecture de la Lagune",
  ],
  "Agriculture & Agro-industrie": [
    "Baobab Agro-Industries",
    "Lagune Cacao & Café",
    "Savane Plantations",
    "Cauris Agroalimentaire",
  ],
  "Commerce & Marketing": [
    "Baobab Distribution",
    "Lagune Retail Group",
    "Atlantia Commerce",
    "Sahel Marketing & Communication",
  ],
  "Génie civil & Infrastructures": [
    "Baobab Grands Travaux",
    "Atlantia Génie Civil",
    "Cauris Infrastructures Majeures",
  ],
  International: [
    "Atlantia Global Partners",
    "Lagune International Consulting",
    "Cauris World Group",
  ],
};

export function entreprisesDuSecteur(secteur: string): string[] {
  return ENTREPRISES_PAR_SECTEUR[secteur] ?? ["Entreprise indépendante"];
}
