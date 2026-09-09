import { Session } from "../models/types";
import { RNG } from "../utils/random";

const CHANCE_MARIAGE_ANNUELLE = 0.06;

/** Chaque année, une petite chance que des diplômés célibataires de la
 * génération se marient entre eux — un clin d'œil narratif qui boucle la
 * cohorte. Ne concerne que les élèves déjà diplômés (statut "diplome" ou
 * "retraite"), jamais encore scolarisés. */
export function avancerMariages(session: Session, annee: string, rng: RNG): void {
  const celibataires = Object.values(session.eleves).filter(
    (e) => (e.statut === "diplome" || e.statut === "retraite") && !e.marie
  );

  for (let i = celibataires.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [celibataires[i], celibataires[j]] = [celibataires[j], celibataires[i]];
  }

  const dejaTraites = new Set<string>();
  for (let i = 0; i < celibataires.length; i++) {
    const a = celibataires[i];
    if (dejaTraites.has(a.matricule) || a.marie) continue;
    if (rng() > CHANCE_MARIAGE_ANNUELLE) continue;

    const partenaire = celibataires.find(
      (b) => b.matricule !== a.matricule && !dejaTraites.has(b.matricule) && !b.marie
    );
    if (!partenaire) continue;

    a.marie = true;
    a.conjointMatricule = partenaire.matricule;
    a.anneeMariage = annee;
    partenaire.marie = true;
    partenaire.conjointMatricule = a.matricule;
    partenaire.anneeMariage = annee;

    dejaTraites.add(a.matricule);
    dejaTraites.add(partenaire.matricule);
  }
}
