import { Eleve } from "../models/types";
import { mulberry32 } from "../utils/random";

function hashChaine(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Génère une appréciation narrative (style conseil de classe) pour un
 * élève, à partir de sa moyenne, de sa tendance, de sa régularité, de son
 * dernier événement scolaire et de son potentiel caché. Le texte est
 * déterministe (stable à l'affichage) mais varie d'un élève à l'autre
 * grâce à une seed dérivée de son matricule et du trimestre concerné.
 */
export function genererAppreciation(eleve: Eleve): string {
  const derniere = eleve.moyennes[eleve.moyennes.length - 1];
  if (!derniere) {
    return "Pas encore assez d'éléments pour établir une appréciation — attendez la fin du premier trimestre.";
  }

  const precedente = eleve.moyennes[eleve.moyennes.length - 2];
  const moyenne = derniere.moyenneGenerale;
  const delta = precedente ? moyenne - precedente.moyenneGenerale : 0;

  const rng = mulberry32(hashChaine(`${eleve.matricule}-${derniere.annee}-${derniere.trimestre}`));
  const choisir = <T,>(options: T[]): T => options[Math.floor(rng() * options.length)];

  let ouverture: string;
  if (moyenne >= 16) {
    ouverture = choisir([
      "Trimestre excellent.",
      "Résultats remarquables ce trimestre.",
      "Un niveau d'excellence maintenu.",
    ]);
  } else if (moyenne >= 14) {
    ouverture = choisir([
      "Très bon trimestre.",
      "De très bons résultats d'ensemble.",
      "Un travail de qualité ce trimestre.",
    ]);
  } else if (moyenne >= 12) {
    ouverture = choisir([
      "Bon trimestre.",
      "Des résultats satisfaisants.",
      "Ensemble correct ce trimestre.",
    ]);
  } else if (moyenne >= 10) {
    ouverture = choisir([
      "Trimestre moyen.",
      "Résultats justes mais suffisants.",
      "Un niveau encore fragile mais acceptable.",
    ]);
  } else if (moyenne >= 8) {
    ouverture = choisir([
      "Trimestre insuffisant.",
      "Des résultats en deçà des attentes.",
      "Un trimestre difficile.",
    ]);
  } else {
    ouverture = choisir([
      "Trimestre très insuffisant.",
      "Des résultats préoccupants.",
      "Une situation qui appelle une réaction rapide.",
    ]);
  }

  let tendance = "";
  if (precedente) {
    if (delta >= 1.5) {
      tendance = " " + choisir([
        "Nette progression par rapport au trimestre précédent, à saluer.",
        "La progression est très encourageante.",
        "Belle dynamique de progrès.",
      ]);
    } else if (delta >= 0.4) {
      tendance = " " + choisir(["En légère amélioration.", "La tendance est positive."]);
    } else if (delta <= -1.5) {
      tendance = " " + choisir([
        "Recul net qu'il conviendra de surveiller.",
        "Baisse sensible par rapport au trimestre précédent.",
      ]);
    } else if (delta <= -0.4) {
      tendance = " " + choisir([
        "Léger fléchissement à surveiller.",
        "Une petite baisse par rapport au trimestre dernier.",
      ]);
    } else {
      tendance = " " + choisir(["Niveau stable.", "Résultats réguliers d'un trimestre à l'autre."]);
    }
  }

  const regularite = eleve.competences.regularite;
  let comportement = "";
  if (regularite >= 75) {
    comportement = " " + choisir(["Travail sérieux et régulier.", "Élève constant dans l'effort."]);
  } else if (regularite <= 40) {
    comportement = " " + choisir([
      "Résultats en dents de scie selon les évaluations.",
      "Manque de régularité d'une évaluation à l'autre.",
    ]);
  }

  let evenementTxt = "";
  const dernierEvt = eleve.evenements[eleve.evenements.length - 1];
  if (dernierEvt && dernierEvt.trimestre === derniere.trimestre && dernierEvt.annee === derniere.annee) {
    if (dernierEvt.type === "progression_exceptionnelle" || dernierEvt.type === "declic") {
      evenementTxt = " " + dernierEvt.description;
    } else if (dernierEvt.type === "baisse_niveau") {
      evenementTxt = " Une période plus difficile a été traversée ce trimestre.";
    }
  }

  const potentielMax = Math.max(eleve.potentiel.potentielScientifique, eleve.potentiel.potentielLitteraire);
  let potentielTxt = "";
  if (potentielMax >= 70 && moyenne < 14) {
    potentielTxt = " " + choisir([
      "Le potentiel de l'élève reste encore sous-exploité : les capacités sont là.",
      "Des marges de progression importantes sont perceptibles.",
    ]);
  }

  let cloture: string;
  if (moyenne >= 14) {
    cloture = " " + choisir(["Poursuivre sur cette lancée.", "Continuez ainsi.", "Encouragements sincères."]);
  } else if (moyenne >= 10) {
    cloture = " " + choisir([
      "Peut mieux faire avec plus de rigueur.",
      "Des efforts supplémentaires permettraient de progresser encore.",
    ]);
  } else {
    cloture = " " + choisir([
      "Un travail plus soutenu est indispensable.",
      "Une remobilisation est nécessaire au trimestre prochain.",
    ]);
  }

  return [ouverture, tendance, comportement, evenementTxt, potentielTxt, cloture].join("");
}

/** Version courte (une phrase) — utilisée dans les listes et cartes compactes. */
export function genererAppreciationCourte(eleve: Eleve): string {
  const complete = genererAppreciation(eleve);
  const premierePhrase = complete.split(". ")[0];
  return premierePhrase.endsWith(".") ? premierePhrase : `${premierePhrase}.`;
}
