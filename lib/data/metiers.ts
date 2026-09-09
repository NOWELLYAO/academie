import { Domaine } from "../engines/domaines";

export type NiveauResponsabilite = 1 | 2 | 3 | 4 | 5;

export const LIBELLE_RESPONSABILITE: Record<NiveauResponsabilite, string> = {
  1: "Agent / Employé",
  2: "Technicien / Agent de maîtrise",
  3: "Cadre",
  4: "Cadre supérieur",
  5: "Cadre dirigeant",
};

export type FiliereRequise = "ingenieur" | "technicien" | "generaliste";

export interface Metier {
  id: string;
  nom: string;
  secteur: string;
  niveauResponsabilite: NiveauResponsabilite;
  salaireMin: number; // FCFA / mois
  salaireMax: number;
  domaine: Domaine | "generale";
  filiere: FiliereRequise;
}

export const SECTEURS = [
  "Banque & Finance",
  "Pétrole & Énergie",
  "BTP & Construction",
  "Santé",
  "Technologie & Informatique",
  "Droit & Justice",
  "Éducation",
  "Administration publique",
  "Agriculture & Agro-industrie",
  "Commerce & Marketing",
];

export const ICONE_SECTEUR: Record<string, string> = {
  "Banque & Finance": "🏦",
  "Pétrole & Énergie": "🛢️",
  "BTP & Construction": "🏗️",
  Santé: "🏥",
  "Technologie & Informatique": "💻",
  "Droit & Justice": "⚖️",
  Éducation: "📚",
  "Administration publique": "🏛️",
  "Agriculture & Agro-industrie": "🌾",
  "Commerce & Marketing": "🛍️",
  International: "🌍",
};

export const METIERS: Metier[] = [
  // Banque & Finance (scientifique dominant : maths/logique)
  { id: "banque-1", nom: "Agent de guichet", secteur: "Banque & Finance", niveauResponsabilite: 1, salaireMin: 80000, salaireMax: 120000, domaine: "generale", filiere: "generaliste" },
  { id: "banque-2", nom: "Chargé de clientèle", secteur: "Banque & Finance", niveauResponsabilite: 2, salaireMin: 150000, salaireMax: 250000, domaine: "generale", filiere: "technicien" },
  { id: "banque-3", nom: "Analyste financier", secteur: "Banque & Finance", niveauResponsabilite: 3, salaireMin: 400000, salaireMax: 700000, domaine: "scientifique", filiere: "generaliste" },
  { id: "banque-4", nom: "Directeur d'agence", secteur: "Banque & Finance", niveauResponsabilite: 4, salaireMin: 900000, salaireMax: 1500000, domaine: "scientifique", filiere: "generaliste" },
  { id: "banque-5", nom: "Cadre dirigeant — Banque d'investissement", secteur: "Banque & Finance", niveauResponsabilite: 5, salaireMin: 2000000, salaireMax: 4500000, domaine: "scientifique", filiere: "ingenieur" },

  // Pétrole & Énergie (scientifique/ingénieur)
  { id: "petrole-1", nom: "Agent de terrain", secteur: "Pétrole & Énergie", niveauResponsabilite: 1, salaireMin: 90000, salaireMax: 130000, domaine: "generale", filiere: "generaliste" },
  { id: "petrole-2", nom: "Technicien pétrolier", secteur: "Pétrole & Énergie", niveauResponsabilite: 2, salaireMin: 200000, salaireMax: 350000, domaine: "scientifique", filiere: "technicien" },
  { id: "petrole-3", nom: "Ingénieur pétrolier", secteur: "Pétrole & Énergie", niveauResponsabilite: 3, salaireMin: 600000, salaireMax: 1000000, domaine: "scientifique", filiere: "ingenieur" },
  { id: "petrole-4", nom: "Chef de projet — Exploitation pétrolière", secteur: "Pétrole & Énergie", niveauResponsabilite: 4, salaireMin: 1200000, salaireMax: 2000000, domaine: "scientifique", filiere: "ingenieur" },
  { id: "petrole-5", nom: "Directeur général — Filiale pétrolière", secteur: "Pétrole & Énergie", niveauResponsabilite: 5, salaireMin: 2500000, salaireMax: 5000000, domaine: "scientifique", filiere: "ingenieur" },

  // BTP & Construction (scientifique/technologique)
  { id: "btp-1", nom: "Ouvrier BTP qualifié", secteur: "BTP & Construction", niveauResponsabilite: 1, salaireMin: 70000, salaireMax: 110000, domaine: "generale", filiere: "generaliste" },
  { id: "btp-2", nom: "Conducteur de travaux", secteur: "BTP & Construction", niveauResponsabilite: 2, salaireMin: 180000, salaireMax: 300000, domaine: "technologique", filiere: "technicien" },
  { id: "btp-3", nom: "Ingénieur BTP", secteur: "BTP & Construction", niveauResponsabilite: 3, salaireMin: 500000, salaireMax: 850000, domaine: "scientifique", filiere: "ingenieur" },
  { id: "btp-4", nom: "Directeur de projets BTP", secteur: "BTP & Construction", niveauResponsabilite: 4, salaireMin: 1000000, salaireMax: 1700000, domaine: "scientifique", filiere: "ingenieur" },
  { id: "btp-5", nom: "Directeur général — Groupe BTP", secteur: "BTP & Construction", niveauResponsabilite: 5, salaireMin: 2200000, salaireMax: 4000000, domaine: "scientifique", filiere: "ingenieur" },

  // Santé (naturaliste)
  { id: "sante-1", nom: "Aide-soignant", secteur: "Santé", niveauResponsabilite: 1, salaireMin: 75000, salaireMax: 110000, domaine: "generale", filiere: "generaliste" },
  { id: "sante-2", nom: "Infirmier", secteur: "Santé", niveauResponsabilite: 2, salaireMin: 160000, salaireMax: 280000, domaine: "naturaliste", filiere: "technicien" },
  { id: "sante-3", nom: "Médecin généraliste", secteur: "Santé", niveauResponsabilite: 3, salaireMin: 500000, salaireMax: 900000, domaine: "naturaliste", filiere: "generaliste" },
  { id: "sante-4", nom: "Médecin spécialiste", secteur: "Santé", niveauResponsabilite: 4, salaireMin: 1100000, salaireMax: 2000000, domaine: "naturaliste", filiere: "generaliste" },
  { id: "sante-5", nom: "Directeur d'hôpital / Professeur de médecine", secteur: "Santé", niveauResponsabilite: 5, salaireMin: 2000000, salaireMax: 3800000, domaine: "naturaliste", filiere: "generaliste" },

  // Technologie & Informatique (technologique)
  { id: "tech-1", nom: "Agent support informatique", secteur: "Technologie & Informatique", niveauResponsabilite: 1, salaireMin: 85000, salaireMax: 130000, domaine: "generale", filiere: "generaliste" },
  { id: "tech-2", nom: "Technicien / Développeur junior", secteur: "Technologie & Informatique", niveauResponsabilite: 2, salaireMin: 180000, salaireMax: 320000, domaine: "technologique", filiere: "technicien" },
  { id: "tech-3", nom: "Ingénieur logiciel", secteur: "Technologie & Informatique", niveauResponsabilite: 3, salaireMin: 550000, salaireMax: 950000, domaine: "technologique", filiere: "ingenieur" },
  { id: "tech-4", nom: "Architecte logiciel / Chef de projet IT", secteur: "Technologie & Informatique", niveauResponsabilite: 4, salaireMin: 1100000, salaireMax: 1900000, domaine: "technologique", filiere: "ingenieur" },
  { id: "tech-5", nom: "Directeur technique (CTO)", secteur: "Technologie & Informatique", niveauResponsabilite: 5, salaireMin: 2300000, salaireMax: 4500000, domaine: "technologique", filiere: "ingenieur" },

  // Droit & Justice (littéraire)
  { id: "droit-1", nom: "Assistant juridique", secteur: "Droit & Justice", niveauResponsabilite: 1, salaireMin: 75000, salaireMax: 115000, domaine: "generale", filiere: "generaliste" },
  { id: "droit-2", nom: "Clerc de notaire / Greffier", secteur: "Droit & Justice", niveauResponsabilite: 2, salaireMin: 150000, salaireMax: 250000, domaine: "litteraire", filiere: "technicien" },
  { id: "droit-3", nom: "Avocat / Juriste d'entreprise", secteur: "Droit & Justice", niveauResponsabilite: 3, salaireMin: 450000, salaireMax: 800000, domaine: "litteraire", filiere: "generaliste" },
  { id: "droit-4", nom: "Avocat associé / Magistrat", secteur: "Droit & Justice", niveauResponsabilite: 4, salaireMin: 1000000, salaireMax: 1800000, domaine: "litteraire", filiere: "generaliste" },
  { id: "droit-5", nom: "Bâtonnier / Procureur général", secteur: "Droit & Justice", niveauResponsabilite: 5, salaireMin: 2000000, salaireMax: 3500000, domaine: "litteraire", filiere: "generaliste" },

  // Éducation (littéraire/générale)
  { id: "edu-1", nom: "Surveillant scolaire", secteur: "Éducation", niveauResponsabilite: 1, salaireMin: 65000, salaireMax: 100000, domaine: "generale", filiere: "generaliste" },
  { id: "edu-2", nom: "Professeur des écoles", secteur: "Éducation", niveauResponsabilite: 2, salaireMin: 140000, salaireMax: 220000, domaine: "generale", filiere: "technicien" },
  { id: "edu-3", nom: "Professeur certifié", secteur: "Éducation", niveauResponsabilite: 3, salaireMin: 300000, salaireMax: 550000, domaine: "litteraire", filiere: "generaliste" },
  { id: "edu-4", nom: "Proviseur / Inspecteur académique", secteur: "Éducation", niveauResponsabilite: 4, salaireMin: 700000, salaireMax: 1200000, domaine: "litteraire", filiere: "generaliste" },
  { id: "edu-5", nom: "Directeur régional de l'éducation", secteur: "Éducation", niveauResponsabilite: 5, salaireMin: 1500000, salaireMax: 2800000, domaine: "litteraire", filiere: "generaliste" },

  // Administration publique (générale)
  { id: "admin-1", nom: "Agent administratif", secteur: "Administration publique", niveauResponsabilite: 1, salaireMin: 70000, salaireMax: 105000, domaine: "generale", filiere: "generaliste" },
  { id: "admin-2", nom: "Secrétaire administratif", secteur: "Administration publique", niveauResponsabilite: 2, salaireMin: 140000, salaireMax: 230000, domaine: "generale", filiere: "technicien" },
  { id: "admin-3", nom: "Attaché d'administration / Chef de bureau", secteur: "Administration publique", niveauResponsabilite: 3, salaireMin: 350000, salaireMax: 600000, domaine: "generale", filiere: "generaliste" },
  { id: "admin-4", nom: "Directeur de cabinet", secteur: "Administration publique", niveauResponsabilite: 4, salaireMin: 800000, salaireMax: 1400000, domaine: "generale", filiere: "generaliste" },
  { id: "admin-5", nom: "Secrétaire général de ministère", secteur: "Administration publique", niveauResponsabilite: 5, salaireMin: 1800000, salaireMax: 3200000, domaine: "generale", filiere: "generaliste" },

  // Agriculture & Agro-industrie (naturaliste)
  { id: "agri-1", nom: "Ouvrier agricole", secteur: "Agriculture & Agro-industrie", niveauResponsabilite: 1, salaireMin: 60000, salaireMax: 95000, domaine: "generale", filiere: "generaliste" },
  { id: "agri-2", nom: "Technicien agricole", secteur: "Agriculture & Agro-industrie", niveauResponsabilite: 2, salaireMin: 140000, salaireMax: 230000, domaine: "naturaliste", filiere: "technicien" },
  { id: "agri-3", nom: "Ingénieur agronome", secteur: "Agriculture & Agro-industrie", niveauResponsabilite: 3, salaireMin: 400000, salaireMax: 700000, domaine: "naturaliste", filiere: "generaliste" },
  { id: "agri-4", nom: "Directeur d'exploitation agro-industrielle", secteur: "Agriculture & Agro-industrie", niveauResponsabilite: 4, salaireMin: 900000, salaireMax: 1500000, domaine: "naturaliste", filiere: "generaliste" },
  { id: "agri-5", nom: "Directeur général — Groupe agroalimentaire", secteur: "Agriculture & Agro-industrie", niveauResponsabilite: 5, salaireMin: 1900000, salaireMax: 3500000, domaine: "naturaliste", filiere: "generaliste" },

  // Commerce & Marketing (générale/littéraire)
  { id: "com-1", nom: "Vendeur", secteur: "Commerce & Marketing", niveauResponsabilite: 1, salaireMin: 65000, salaireMax: 100000, domaine: "generale", filiere: "generaliste" },
  { id: "com-2", nom: "Chargé de clientèle commercial", secteur: "Commerce & Marketing", niveauResponsabilite: 2, salaireMin: 140000, salaireMax: 240000, domaine: "generale", filiere: "technicien" },
  { id: "com-3", nom: "Chef de produit / Responsable marketing", secteur: "Commerce & Marketing", niveauResponsabilite: 3, salaireMin: 380000, salaireMax: 650000, domaine: "litteraire", filiere: "generaliste" },
  { id: "com-4", nom: "Directeur commercial", secteur: "Commerce & Marketing", niveauResponsabilite: 4, salaireMin: 850000, salaireMax: 1400000, domaine: "litteraire", filiere: "generaliste" },
  { id: "com-5", nom: "Directeur général — Commerce & Distribution", secteur: "Commerce & Marketing", niveauResponsabilite: 5, salaireMin: 1800000, salaireMax: 3200000, domaine: "litteraire", filiere: "generaliste" },
];
