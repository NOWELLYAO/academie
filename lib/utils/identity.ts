import { ORIGINES } from "../data/names";
import { pick, RNG } from "./random";

export interface Identite {
  nom: string;
  prenom: string;
  pays: string;
}

/**
 * Tire une identité (nom + prénom) parmi un large éventail d'origines —
 * ivoirienne, sénégalaise, camerounaise, tchadienne, nigérienne,
 * française, américaine, chinoise, japonaise, allemande — et garantit
 * qu'elle n'a pas déjà été attribuée dans la session en cours.
 */
export function genererIdentiteUnique(rng: RNG, dejaUtilisees: Set<string>): Identite {
  for (let tentative = 0; tentative < 80; tentative++) {
    const origine = pick(rng, ORIGINES);
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
  // différentes pour garantir malgré tout l'unicité.
  const origineNom = pick(rng, ORIGINES);
  const originePrenom = pick(rng, ORIGINES);
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
