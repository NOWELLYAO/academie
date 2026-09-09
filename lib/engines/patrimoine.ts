import { v4 as uuid } from "uuid";
import { Eleve } from "../models/types";
import { biensAccessibles } from "../data/luxe";
import { debiterEleve, formaterFCFA } from "./finances";
import { pick, randRange, RNG } from "../utils/random";

const SEUIL_INVESTISSEMENT = 500000; // solde minimal pour envisager un placement ou un achat
const HISTORIQUE_MAX = 15;

/** Fait vivre le patrimoine d'un élève déjà en poste, une fois par année :
 * performance du portefeuille boursier existant, puis, si le solde le
 * permet, un nouvel investissement en bourse ou un achat de bien de luxe
 * (voiture, maison, terrain...). Rien n'est obligatoire — beaucoup se
 * contentent d'épargner. */
export function avancerPatrimoineEleve(eleve: Eleve, annee: string, rng: RNG): void {
  if (eleve.bourse && eleve.bourse.valeur > 0) {
    const rendement = randRange(rng, -0.15, 0.25);
    const variation = Math.round(eleve.bourse.valeur * rendement);
    eleve.bourse.valeur = Math.max(0, eleve.bourse.valeur + variation);
    eleve.bourse.historique.unshift({
      annee,
      action: "performance",
      montant: variation,
      motif:
        variation >= 0
          ? `Plus-value boursière de ${formaterFCFA(variation)}.`
          : `Perte boursière de ${formaterFCFA(Math.abs(variation))}.`,
    });
    eleve.bourse.historique = eleve.bourse.historique.slice(0, HISTORIQUE_MAX);
  }

  if ((eleve.solde ?? 0) < SEUIL_INVESTISSEMENT) return;

  const roll = rng();

  if (roll < 0.25) {
    const montant = Math.round((eleve.solde ?? 0) * randRange(rng, 0.1, 0.35));
    if (montant >= 10000) {
      debiterEleve(eleve, montant, `Investissement en bourse de ${formaterFCFA(montant)}.`, annee);
      if (!eleve.bourse) eleve.bourse = { valeur: 0, historique: [] };
      eleve.bourse.valeur += montant;
      eleve.bourse.historique.unshift({
        annee,
        action: "achat",
        montant,
        motif: `Achat d'actions pour ${formaterFCFA(montant)}.`,
      });
      eleve.bourse.historique = eleve.bourse.historique.slice(0, HISTORIQUE_MAX);
    }
    return;
  }

  if (roll < 0.45) {
    const accessibles = biensAccessibles(eleve.solde ?? 0);
    if (accessibles.length > 0) {
      const bien = pick(rng, accessibles);
      const prix = Math.round(randRange(rng, bien.prixMin, Math.min(bien.prixMax, eleve.solde ?? 0)));
      debiterEleve(eleve, prix, `Achat — ${bien.nom} (${formaterFCFA(prix)}).`, annee);
      if (!eleve.patrimoine) eleve.patrimoine = [];
      eleve.patrimoine.push({ id: uuid(), type: bien.type, nom: bien.nom, valeurAchat: prix, anneeAchat: annee });
    }
  }
}
