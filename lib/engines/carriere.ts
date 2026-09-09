import { Eleve, Niveau } from "../models/types";
import { METIERS, FiliereRequise, Metier, SECTEURS } from "../data/metiers";
import { scoreDomaines, Domaine } from "./domaines";
import { crediterEleve } from "./finances";
import { moyenneCumulee } from "./ranking";
import { pick, randRange, RNG } from "../utils/random";

const DUREE_CARRIERE_AVANT_RETRAITE = 30; // années
const PLAFOND_SALAIRE = 25000000; // FCFA / mois — évite l'emballement sur de très longues simulations

const DESTINATIONS_EXPATRIATION = [
  { pays: "France", ville: "Paris" },
  { pays: "Canada", ville: "Montréal" },
  { pays: "États-Unis", ville: "New York" },
  { pays: "Émirats Arabes Unis", ville: "Dubaï" },
  { pays: "Allemagne", ville: "Berlin" },
  { pays: "Royaume-Uni", ville: "Londres" },
];

const POSTES_EXPATRIATION: Record<Domaine | "generale", string[]> = {
  scientifique: ["Ingénieur R&D", "Analyste quantitatif", "Consultant en ingénierie"],
  litteraire: ["Consultant international", "Diplomate", "Chargé d'affaires internationales"],
  technologique: ["Ingénieur logiciel senior", "Chercheur en intelligence artificielle", "Architecte cloud"],
  naturaliste: ["Chercheur biomédical", "Médecin spécialiste", "Chercheur en biotechnologie"],
  generale: ["Consultant international", "Cadre export"],
};

function filiereDuDiplome(niveau: Niveau): FiliereRequise {
  if (niveau === "EcoleIngenieurs") return "ingenieur";
  if (niveau === "DUT") return "technicien";
  return "generaliste";
}

function domaineDominant(eleve: Eleve): Domaine {
  const scores = scoreDomaines(eleve);
  return (Object.entries(scores) as [Domaine, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

function niveauInitial(eleve: Eleve): 1 | 2 | 3 | 4 {
  const moyenne = moyenneCumulee(eleve);
  if (eleve.admissiblePolytechnique && moyenne >= 16) return 4;
  if (moyenne >= 15) return 3;
  if (moyenne >= 12) return 2;
  return 1;
}

function choisirMetier(rng: RNG, criteres: { filiere?: FiliereRequise; secteur?: string; tier: number }): Metier | null {
  let candidats = METIERS.filter((m) => m.niveauResponsabilite === criteres.tier);
  if (criteres.filiere) candidats = candidats.filter((m) => m.filiere === criteres.filiere);
  if (criteres.secteur) candidats = candidats.filter((m) => m.secteur === criteres.secteur);
  return candidats.length > 0 ? pick(rng, candidats) : null;
}

/** Attribue le premier poste d'un élève tout juste diplômé. Trois issues
 * possibles : une carrière salariée classique (la plupart des cas), une
 * aventure entrepreneuriale, ou une expatriation pour les tout meilleurs
 * profils — chacune avec sa propre logique d'évolution ensuite. */
export function demarrerCarriere(eleve: Eleve, rng: RNG, annee: string): void {
  const moyenne = moyenneCumulee(eleve);
  const dominant = domaineDominant(eleve);

  const eligibleExpatriation = eleve.admissiblePolytechnique || moyenne >= 16;
  if (eligibleExpatriation && rng() < 0.15) {
    const destination = pick(rng, DESTINATIONS_EXPATRIATION);
    const postes = POSTES_EXPATRIATION[dominant] ?? POSTES_EXPATRIATION.generale;
    const poste = pick(rng, postes);
    const salaire = Math.round(randRange(rng, 1800000, 3200000));
    const nomPoste = `${poste} — ${destination.ville}, ${destination.pays}`;

    eleve.carriere = {
      metierId: "expat",
      nom: nomPoste,
      secteur: "International",
      niveauResponsabilite: 4,
      salaireMensuel: salaire,
      anneeDebut: annee,
      typeCarriere: "salarie",
      paysExpatriation: destination.pays,
      historique: [
        {
          annee,
          metierId: "expat",
          nom: nomPoste,
          secteur: "International",
          niveauResponsabilite: 4,
          salaireMensuel: salaire,
          motif: `Départ à l'étranger après le diplôme — recruté(e) à ${destination.ville}.`,
        },
      ],
    };
    crediterEleve(eleve, salaire * 12, `Salaire annuel (expatriation) — ${poste}`, annee);
    return;
  }

  if (rng() < 0.1) {
    const secteur = pick(rng, SECTEURS);
    const nom = `Fondateur — Start-up ${secteur.split(" ")[0]}`;
    const salaire = Math.round(randRange(rng, 100000, 400000));

    eleve.carriere = {
      metierId: "entrepreneur",
      nom,
      secteur,
      niveauResponsabilite: 3,
      salaireMensuel: salaire,
      anneeDebut: annee,
      typeCarriere: "entrepreneur",
      statutEntreprise: "en_activite",
      historique: [
        {
          annee,
          metierId: "entrepreneur",
          nom,
          secteur,
          niveauResponsabilite: 3,
          salaireMensuel: salaire,
          motif: `Création d'entreprise après le diplôme (${secteur}).`,
        },
      ],
    };
    crediterEleve(eleve, salaire * 12, `Revenu annuel (entreprise) — ${nom}`, annee);
    return;
  }

  const filiere = filiereDuDiplome(eleve.niveau);
  const tier = niveauInitial(eleve);

  let metiersDomaine = METIERS.filter(
    (m) => m.filiere === filiere && m.niveauResponsabilite === tier && (m.domaine === dominant || m.domaine === "generale")
  );
  if (metiersDomaine.length === 0) {
    metiersDomaine = METIERS.filter((m) => m.filiere === filiere && m.niveauResponsabilite === tier);
  }
  if (metiersDomaine.length === 0) {
    metiersDomaine = METIERS.filter((m) => m.niveauResponsabilite === Math.max(1, tier - 1));
  }

  const metier = metiersDomaine.length > 0 ? pick(rng, metiersDomaine) : METIERS[0];
  const salaire = Math.round(randRange(rng, metier.salaireMin, metier.salaireMax));

  eleve.carriere = {
    metierId: metier.id,
    nom: metier.nom,
    secteur: metier.secteur,
    niveauResponsabilite: metier.niveauResponsabilite,
    salaireMensuel: salaire,
    anneeDebut: annee,
    typeCarriere: "salarie",
    historique: [
      {
        annee,
        metierId: metier.id,
        nom: metier.nom,
        secteur: metier.secteur,
        niveauResponsabilite: metier.niveauResponsabilite,
        salaireMensuel: salaire,
        motif: `Premier poste après l'obtention du diplôme (${metier.secteur}).`,
      },
    ],
  };

  crediterEleve(eleve, salaire * 12, `Salaire annuel — ${metier.nom}`, annee);
}

function anneeNumero(annee: string): number {
  return parseInt(annee.split("-")[0], 10);
}

/** Fait évoluer la carrière d'un diplômé déjà en poste, une fois par
 * année : promotion/augmentation pour un salarié, succès/faillite pour un
 * entrepreneur, et mise à la retraite après une longue carrière.
 * Idempotent — un même élève n'est jamais avancé deux fois la même année. */
export function avancerCarriereEleve(eleve: Eleve, annee: string, rng: RNG): void {
  const c = eleve.carriere;
  if (!c) return;
  if (c.historique[0]?.annee === annee) return;

  if (anneeNumero(annee) - anneeNumero(c.anneeDebut) >= DUREE_CARRIERE_AVANT_RETRAITE) {
    eleve.statut = "retraite";
    c.historique.unshift({
      annee,
      metierId: c.metierId,
      nom: c.nom,
      secteur: c.secteur,
      niveauResponsabilite: c.niveauResponsabilite,
      salaireMensuel: c.salaireMensuel,
      motif: `Départ à la retraite après ${DUREE_CARRIERE_AVANT_RETRAITE} ans de carrière.`,
    });
    return;
  }

  const potMax = Math.max(eleve.potentiel.potentielScientifique, eleve.potentiel.potentielLitteraire);

  if (c.typeCarriere === "entrepreneur" && c.statutEntreprise !== "faillite") {
    const chanceFaillite = 0.1 - (potMax / 100) * 0.05;
    const chanceSucces = 0.15 + (potMax / 100) * 0.2;

    const roll = rng();
    if (roll < chanceFaillite) {
      c.statutEntreprise = "faillite";
      c.typeCarriere = "salarie";
      const metier = choisirMetier(rng, { tier: 2 });
      if (metier) {
        c.metierId = metier.id;
        c.nom = metier.nom;
        c.secteur = metier.secteur;
        c.niveauResponsabilite = metier.niveauResponsabilite;
        c.salaireMensuel = Math.round(randRange(rng, metier.salaireMin, metier.salaireMax));
      } else {
        c.salaireMensuel = Math.round(c.salaireMensuel * 0.6);
      }
      c.historique.unshift({
        annee,
        metierId: c.metierId,
        nom: c.nom,
        secteur: c.secteur,
        niveauResponsabilite: c.niveauResponsabilite,
        salaireMensuel: c.salaireMensuel,
        motif: "Faillite de l'entreprise — reconversion salariée.",
      });
    } else if (roll < chanceFaillite + chanceSucces) {
      c.statutEntreprise = "succes";
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * randRange(rng, 1.4, 2.5)));
      c.niveauResponsabilite = Math.min(5, c.niveauResponsabilite + 1) as 1 | 2 | 3 | 4 | 5;
      c.historique.unshift({
        annee,
        metierId: c.metierId,
        nom: c.nom,
        secteur: c.secteur,
        niveauResponsabilite: c.niveauResponsabilite,
        salaireMensuel: c.salaireMensuel,
        motif: "Forte croissance de l'entreprise — succès entrepreneurial.",
      });
    } else {
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * (1 + randRange(rng, 0.02, 0.15))));
      c.historique.unshift({
        annee,
        metierId: c.metierId,
        nom: c.nom,
        secteur: c.secteur,
        niveauResponsabilite: c.niveauResponsabilite,
        salaireMensuel: c.salaireMensuel,
        motif: "Croissance modérée de l'entreprise.",
      });
    }
    c.historique = c.historique.slice(0, 15);
    crediterEleve(eleve, c.salaireMensuel * 12, `Revenu annuel (entreprise) — ${c.nom}`, annee);
    return;
  }

  if (c.paysExpatriation) {
    const chancePromotion = 0.15 + (potMax / 100) * 0.2;
    let promu = false;
    if (c.niveauResponsabilite < 5 && rng() < chancePromotion) {
      c.niveauResponsabilite = (c.niveauResponsabilite + 1) as 1 | 2 | 3 | 4 | 5;
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * randRange(rng, 1.2, 1.6)));
      promu = true;
    } else {
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * (1 + randRange(rng, 0.03, 0.1))));
    }
    c.historique.unshift({
      annee,
      metierId: c.metierId,
      nom: c.nom,
      secteur: c.secteur,
      niveauResponsabilite: c.niveauResponsabilite,
      salaireMensuel: c.salaireMensuel,
      motif: promu ? `Promotion à l'international : ${c.nom}.` : "Augmentation annuelle (poste à l'international).",
    });
    c.historique = c.historique.slice(0, 15);
    crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel (expatriation) — ${c.nom}`, annee);
    return;
  }

  const chancePromotion = 0.15 + (potMax / 100) * 0.25;
  let promu = false;
  if (c.niveauResponsabilite < 5 && rng() < chancePromotion) {
    const metier = choisirMetier(rng, { secteur: c.secteur, tier: c.niveauResponsabilite + 1 });
    if (metier) {
      c.metierId = metier.id;
      c.nom = metier.nom;
      c.niveauResponsabilite = metier.niveauResponsabilite;
      c.salaireMensuel = Math.round(randRange(rng, metier.salaireMin, metier.salaireMax));
      promu = true;
    }
  }
  if (!promu) {
    c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * (1 + randRange(rng, 0.02, 0.08))));
  }

  c.historique.unshift({
    annee,
    metierId: c.metierId,
    nom: c.nom,
    secteur: c.secteur,
    niveauResponsabilite: c.niveauResponsabilite,
    salaireMensuel: c.salaireMensuel,
    motif: promu ? `Promotion : ${c.nom}.` : "Augmentation annuelle de salaire.",
  });
  c.historique = c.historique.slice(0, 15);

  crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel — ${c.nom}`, annee);
}
