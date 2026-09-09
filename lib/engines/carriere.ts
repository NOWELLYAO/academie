import { Eleve, Niveau } from "../models/types";
import { METIERS, FiliereRequise, Metier, SECTEURS } from "../data/metiers";
import { entreprisesDuSecteur } from "../data/entreprises";
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

/** Domaines cohérents avec la série de Bac d'origine — un littéraire
 * (série A) n'a jamais étudié la SVT ou la physique, donc ne peut jamais
 * dominer en "naturaliste"/"scientifique" (ex: devenir médecin) ; un
 * scientifique C n'a pas de SVT non plus. */
function domainesAutorises(eleve: Eleve): Domaine[] {
  if (eleve.serieBac === "A") return ["litteraire"];
  if (eleve.serieBac === "C") return ["scientifique", "technologique"];
  if (eleve.serieBac === "D") return ["scientifique", "technologique", "naturaliste"];
  return ["scientifique", "litteraire", "technologique", "naturaliste"];
}

function domaineDominant(eleve: Eleve): Domaine {
  const scores = scoreDomaines(eleve);
  const autorises = domainesAutorises(eleve);
  const filtres = (Object.entries(scores) as [Domaine, number][]).filter(([d]) => autorises.includes(d));
  const classement = (filtres.length > 0 ? filtres : (Object.entries(scores) as [Domaine, number][])).sort(
    (a, b) => b[1] - a[1]
  );
  return classement[0][0];
}

/** Un secteur n'est envisageable pour cet élève que s'il offre, à terme
 * (à partir du niveau 3, "Cadre"), au moins un débouché dans un domaine
 * qu'il a réellement étudié — sinon un poste d'entrée "générale" (ouvert à
 * tous) finirait, au fil des promotions, par le faire grimper vers un
 * métier hors de son domaine (ex: littéraire vers Médecin). */
function secteurCoherent(secteur: string, autorises: Domaine[]): boolean {
  const metiersAvances = METIERS.filter((m) => m.secteur === secteur && m.niveauResponsabilite >= 3);
  if (metiersAvances.length === 0) return true;
  return metiersAvances.some((m) => m.domaine === "generale" || autorises.includes(m.domaine as Domaine));
}

function niveauInitial(eleve: Eleve): 1 | 2 | 3 | 4 {
  const moyenne = moyenneCumulee(eleve);
  if (eleve.admissiblePolytechnique && moyenne >= 16) return 4;
  if (moyenne >= 15) return 3;
  if (moyenne >= 12) return 2;
  return 1;
}

function choisirMetier(
  rng: RNG,
  criteres: { filiere?: FiliereRequise; secteur?: string; tier: number; domainesAutorises?: Domaine[] }
): Metier | null {
  let candidats = METIERS.filter((m) => m.niveauResponsabilite === criteres.tier);
  if (criteres.filiere) candidats = candidats.filter((m) => m.filiere === criteres.filiere);
  if (criteres.secteur) candidats = candidats.filter((m) => m.secteur === criteres.secteur);
  if (criteres.domainesAutorises) {
    candidats = candidats.filter(
      (m) => criteres.domainesAutorises!.includes(m.domaine as Domaine) || m.domaine === "generale"
    );
  }
  return candidats.length > 0 ? pick(rng, candidats) : null;
}

function choisirEntreprise(rng: RNG, secteur: string, exclure?: string): string {
  const options = entreprisesDuSecteur(secteur).filter((e) => e !== exclure);
  return options.length > 0 ? pick(rng, options) : entreprisesDuSecteur(secteur)[0];
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
    const entreprise = choisirEntreprise(rng, "International");

    eleve.carriere = {
      metierId: "expat",
      nom: nomPoste,
      entreprise,
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
          entreprise,
          secteur: "International",
          niveauResponsabilite: 4,
          salaireMensuel: salaire,
          motif: `Départ à l'étranger après le diplôme — recruté(e) par ${entreprise} à ${destination.ville}.`,
        },
      ],
    };
    crediterEleve(eleve, salaire * 12, `Salaire annuel (expatriation) — ${poste}`, annee);
    return;
  }

  if (rng() < 0.1) {
    const secteur = pick(rng, SECTEURS);
    const nom = `Fondateur — Start-up ${secteur.split(" ")[0]}`;
    const entreprise = `${eleve.nom} ${eleve.prenom[0]}. — SAS`;
    const salaire = Math.round(randRange(rng, 100000, 400000));

    eleve.carriere = {
      metierId: "entrepreneur",
      nom,
      entreprise,
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
          entreprise,
          secteur,
          niveauResponsabilite: 3,
          salaireMensuel: salaire,
          motif: `Création de l'entreprise ${entreprise} après le diplôme (${secteur}).`,
        },
      ],
    };
    crediterEleve(eleve, salaire * 12, `Revenu annuel (entreprise) — ${nom}`, annee);
    return;
  }

  const filiere = filiereDuDiplome(eleve.niveau);
  const tier = niveauInitial(eleve);
  const autorises = domainesAutorises(eleve);

  let metiersDomaine = METIERS.filter(
    (m) => m.filiere === filiere && m.niveauResponsabilite === tier && (m.domaine === dominant || m.domaine === "generale")
  );
  if (metiersDomaine.length === 0) {
    // Repli : on garde la contrainte de filière ET de domaines autorisés
    // par la série de Bac (jamais un littéraire qui devient médecin).
    metiersDomaine = METIERS.filter(
      (m) => m.filiere === filiere && m.niveauResponsabilite === tier && (autorises.includes(m.domaine as Domaine) || m.domaine === "generale")
    );
  }
  if (metiersDomaine.length === 0) {
    metiersDomaine = METIERS.filter(
      (m) =>
        m.niveauResponsabilite === Math.max(1, tier - 1) &&
        (autorises.includes(m.domaine as Domaine) || m.domaine === "generale") &&
        secteurCoherent(m.secteur, autorises)
    );
  }

  const metier = metiersDomaine.length > 0 ? pick(rng, metiersDomaine) : METIERS[0];
  const salaire = Math.round(randRange(rng, metier.salaireMin, metier.salaireMax));
  const entreprise = choisirEntreprise(rng, metier.secteur);

  eleve.carriere = {
    metierId: metier.id,
    nom: metier.nom,
    entreprise,
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
        entreprise,
        secteur: metier.secteur,
        niveauResponsabilite: metier.niveauResponsabilite,
        salaireMensuel: salaire,
        motif: `Premier poste après l'obtention du diplôme, chez ${entreprise} (${metier.secteur}).`,
      },
    ],
  };

  crediterEleve(eleve, salaire * 12, `Salaire annuel — ${metier.nom}`, annee);
}

function anneeNumero(annee: string): number {
  return parseInt(annee.split("-")[0], 10);
}

function enregistrer(c: NonNullable<Eleve["carriere"]>, annee: string, motif: string) {
  c.historique.unshift({
    annee,
    metierId: c.metierId,
    nom: c.nom,
    entreprise: c.entreprise,
    secteur: c.secteur,
    niveauResponsabilite: c.niveauResponsabilite,
    salaireMensuel: c.salaireMensuel,
    motif,
  });
  c.historique = c.historique.slice(0, 20);
}

/** Fait évoluer la carrière d'un diplômé déjà en poste, une fois par
 * année : promotion interne, débauchage par un concurrent (parfois à
 * l'international), démission volontaire, ou entrepreneuriat (succès /
 * faillite) — puis mise à la retraite après une longue carrière.
 * Idempotent — un même élève n'est jamais avancé deux fois la même année. */
export function avancerCarriereEleve(eleve: Eleve, annee: string, rng: RNG): void {
  const c = eleve.carriere;
  if (!c) return;
  if (c.historique[0]?.annee === annee) return;

  if (anneeNumero(annee) - anneeNumero(c.anneeDebut) >= DUREE_CARRIERE_AVANT_RETRAITE) {
    eleve.statut = "retraite";
    enregistrer(c, annee, `Départ à la retraite après ${DUREE_CARRIERE_AVANT_RETRAITE} ans de carrière.`);
    return;
  }

  const potMax = Math.max(eleve.potentiel.potentielScientifique, eleve.potentiel.potentielLitteraire);

  // --- Entrepreneur : succès, faillite, ou croissance modérée ---
  if (c.typeCarriere === "entrepreneur" && c.statutEntreprise !== "faillite") {
    const chanceFaillite = 0.1 - (potMax / 100) * 0.05;
    const chanceSucces = 0.15 + (potMax / 100) * 0.2;
    const roll = rng();

    if (roll < chanceFaillite) {
      c.statutEntreprise = "faillite";
      c.typeCarriere = "salarie";
      const metier = choisirMetier(rng, { tier: 2, domainesAutorises: domainesAutorises(eleve) });
      if (metier) {
        c.metierId = metier.id;
        c.nom = metier.nom;
        c.secteur = metier.secteur;
        c.niveauResponsabilite = metier.niveauResponsabilite;
        c.entreprise = choisirEntreprise(rng, metier.secteur);
        c.salaireMensuel = Math.round(randRange(rng, metier.salaireMin, metier.salaireMax));
      } else {
        c.salaireMensuel = Math.round(c.salaireMensuel * 0.6);
      }
      enregistrer(c, annee, `Faillite de l'entreprise — reconversion salariée chez ${c.entreprise}.`);
    } else if (roll < chanceFaillite + chanceSucces) {
      c.statutEntreprise = "succes";
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * randRange(rng, 1.4, 2.5)));
      c.niveauResponsabilite = Math.min(5, c.niveauResponsabilite + 1) as 1 | 2 | 3 | 4 | 5;
      enregistrer(c, annee, `Forte croissance de ${c.entreprise} — succès entrepreneurial.`);
    } else {
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * (1 + randRange(rng, 0.02, 0.15))));
      enregistrer(c, annee, `Croissance modérée de ${c.entreprise}.`);
    }
    crediterEleve(eleve, c.salaireMensuel * 12, `Revenu annuel (entreprise) — ${c.nom}`, annee);
    return;
  }

  // --- Expatrié déjà en poste : progression autonome à l'international ---
  if (c.paysExpatriation) {
    const chancePromotion = 0.15 + (potMax / 100) * 0.2;
    if (c.niveauResponsabilite < 5 && rng() < chancePromotion) {
      c.niveauResponsabilite = (c.niveauResponsabilite + 1) as 1 | 2 | 3 | 4 | 5;
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * randRange(rng, 1.2, 1.6)));
      enregistrer(c, annee, `Promotion chez ${c.entreprise} à l'international : ${c.nom}.`);
    } else {
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * (1 + randRange(rng, 0.03, 0.1))));
      enregistrer(c, annee, `Augmentation annuelle chez ${c.entreprise} (poste à l'international).`);
    }
    crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel (expatriation) — ${c.nom}`, annee);
    return;
  }

  // --- Salarié local : débauchage international, débauchage domestique,
  // démission volontaire, promotion interne, ou simple augmentation ---
  const meritant = c.niveauResponsabilite >= 3 || potMax >= 70;

  if (meritant && rng() < 0.03 + (potMax / 100) * 0.04) {
    const destination = pick(rng, DESTINATIONS_EXPATRIATION);
    const dominant = domaineDominant(eleve);
    const postes = POSTES_EXPATRIATION[dominant] ?? POSTES_EXPATRIATION.generale;
    const poste = pick(rng, postes);
    const nouvelleEntreprise = choisirEntreprise(rng, "International");
    c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * randRange(rng, 2, 3.5)));
    c.metierId = "expat";
    c.nom = `${poste} — ${destination.ville}, ${destination.pays}`;
    c.entreprise = nouvelleEntreprise;
    c.secteur = "International";
    c.niveauResponsabilite = Math.max(c.niveauResponsabilite, 4) as 1 | 2 | 3 | 4 | 5;
    c.paysExpatriation = destination.pays;
    enregistrer(c, annee, `Recruté(e) à l'international par ${nouvelleEntreprise} (${destination.ville}) — départ à l'étranger.`);
    crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel (expatriation) — ${c.nom}`, annee);
    return;
  }

  if (meritant && rng() < 0.05 + (potMax / 100) * 0.07) {
    const nouvelleEntreprise = choisirEntreprise(rng, c.secteur, c.entreprise);
    c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * randRange(rng, 1.25, 1.7)));
    const ancienneEntreprise = c.entreprise;
    c.entreprise = nouvelleEntreprise;
    enregistrer(c, annee, `Débauché(e) par ${nouvelleEntreprise} (quitte ${ancienneEntreprise}) avec un salaire revalorisé.`);
    crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel — ${c.nom}`, annee);
    return;
  }

  if (rng() < 0.04) {
    const nouvelleEntreprise = choisirEntreprise(rng, c.secteur, c.entreprise);
    const ancienneEntreprise = c.entreprise;
    c.entreprise = nouvelleEntreprise;
    c.salaireMensuel = Math.max(50000, Math.round(c.salaireMensuel * randRange(rng, 0.85, 1.3)));
    enregistrer(c, annee, `A démissionné de ${ancienneEntreprise} pour rejoindre ${nouvelleEntreprise}.`);
    crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel — ${c.nom}`, annee);
    return;
  }

  const chancePromotion = 0.15 + (potMax / 100) * 0.25;
  let promu = false;
  if (c.niveauResponsabilite < 5 && rng() < chancePromotion) {
    const metier = choisirMetier(rng, {
      secteur: c.secteur,
      tier: c.niveauResponsabilite + 1,
      domainesAutorises: domainesAutorises(eleve),
    });
    if (metier) {
      c.metierId = metier.id;
      c.nom = metier.nom;
      c.niveauResponsabilite = metier.niveauResponsabilite;
      c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(randRange(rng, metier.salaireMin, metier.salaireMax)));
      promu = true;
    }
  }
  if (!promu) {
    c.salaireMensuel = Math.min(PLAFOND_SALAIRE, Math.round(c.salaireMensuel * (1 + randRange(rng, 0.02, 0.08))));
  }

  enregistrer(
    c,
    annee,
    promu ? `Promotion chez ${c.entreprise} : ${c.nom}.` : `Augmentation annuelle de salaire chez ${c.entreprise}.`
  );
  crediterEleve(eleve, c.salaireMensuel * 12, `Salaire annuel — ${c.nom}`, annee);
}
