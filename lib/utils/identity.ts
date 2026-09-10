import { ORIGINES } from "../data/names";
import { pick, RNG } from "./random";

export interface Identite {
  nom: string;
  prenom: string;
  pays: string;
}

const ORIGINES_IVOIRIENNES = ORIGINES.filter((o) => o.pays === "Côte d'Ivoire");
const ORIGINES_ETRANGERES = ORIGINES.filter((o) => o.pays !== "Côte d'Ivoire");

/**
 * Tire une identité (nom + prénom) et garantit qu'elle n'a pas déjà été
 * attribuée dans la session en cours. La grande majorité des élèves sont
 * ivoiriens (Côte d'Ivoire) ; `etranger` force le tirage parmi les autres
 * origines (sénégalaise, camerounaise, tchadienne, nigérienne, française,
 * américaine, chinoise, japonaise, allemande) pour la minorité d'élèves
 * internationaux de chaque classe.
 */
export function genererIdentiteUnique(rng: RNG, dejaUtilisees: Set<string>, etranger = false): Identite {
  const origines = etranger ? ORIGINES_ETRANGERES : ORIGINES_IVOIRIENNES;

  for (let tentative = 0; tentative < 80; tentative++) {
    const origine = pick(rng, origines);
    const estFille = rng() < 0.5;
    const nom = pick(rng, origine.nomsFamille);
    const prenom = estFille ? pick(rng, origine.prenomsFeminins) : pick(rng, origine.prenomsMasculins);
    const cle = `${nom}|${prenom}`;
    if (!dejaUtilisees.has(cle)) {
      dejaUtilisees.add(cle);
      return { nom, prenom, pays: origine.pays };
    }
  }

  // Repli extrêmement improbable (pools épuisés) : on combine deux origines
  // différentes (au sein du même groupe ivoirien/étranger) pour garantir
  // malgré tout l'unicité.
  const origineNom = pick(rng, origines);
  const originePrenom = pick(rng, origines);
  const estFille = rng() < 0.5;
  let nom = pick(rng, origineNom.nomsFamille);
  let prenom = estFille ? pick(rng, originePrenom.prenomsFeminins) : pick(rng, originePrenom.prenomsMasculins);
  let cle = `${nom}|${prenom}`;
  let compteur = 2;
  while (dejaUtilisees.has(cle)) {
    prenom = `${prenom}-${compteur}`;
    cle = `${nom}|${prenom}`;
    compteur++;
  }
  dejaUtilisees.add(cle);
  return { nom, prenom, pays: origineNom.pays };
}
