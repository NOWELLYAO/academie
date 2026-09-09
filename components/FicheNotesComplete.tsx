import { Eleve } from "@/lib/models/types";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import { calculerMention, LIBELLE_MENTION } from "@/lib/engines/mentions";

interface LigneAnnuelle {
  annee: string;
  classeNom: string;
  moyenne: number;
  rangClasse: number;
  rangGeneration: number;
  doublant: boolean;
  commentaires: string[];
}

function construireFiche(eleve: Eleve): LigneAnnuelle[] {
  const parAnnee = new Map<string, typeof eleve.moyennes>();
  eleve.moyennes.forEach((m) => {
    if (!parAnnee.has(m.annee)) parAnnee.set(m.annee, []);
    parAnnee.get(m.annee)!.push(m);
  });

  const lignes: LigneAnnuelle[] = [];
  parAnnee.forEach((entrees, annee) => {
    const derniere = [...entrees].sort((a, b) => a.trimestre - b.trimestre)[entrees.length - 1];
    const doublant = eleve.historiqueOrientation.some(
      (o) => o.annee === annee && o.niveauDestination === "redoublement"
    );
    const commentaires = eleve.historiqueOrientation
      .filter((o) => o.annee === annee)
      .map((o) => o.motif);

    lignes.push({
      annee,
      classeNom: derniere.classeNom ?? NOM_NIVEAU[derniere.niveau],
      moyenne: derniere.moyenneGenerale,
      rangClasse: derniere.rangClasse,
      rangGeneration: derniere.rangGeneration,
      doublant,
      commentaires,
    });
  });

  return lignes.sort((a, b) => a.annee.localeCompare(b.annee));
}

function couleurMoyenne(m: number): string {
  if (m >= 16) return "text-forest font-semibold";
  if (m >= 12) return "text-ink";
  if (m >= 10) return "text-slate";
  return "text-burgundy";
}

export default function FicheNotesComplete({ eleve }: { eleve: Eleve }) {
  const lignes = construireFiche(eleve);

  if (lignes.length === 0) {
    return (
      <p className="text-sm text-slate">
        Pas encore d&apos;année complète — avancez la timeline pour voir apparaître le parcours.
      </p>
    );
  }

  return (
    <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Année</th>
            <th>Classe suivie</th>
            <th>Moyenne</th>
            <th>Rang classe</th>
            <th>Rang génération</th>
            <th>Mention</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => {
            const mention = calculerMention(l.moyenne);
            return (
              <tr key={l.annee}>
                <td className="font-medium whitespace-nowrap">{l.annee}</td>
                <td className="whitespace-nowrap">
                  {l.classeNom}
                  {l.doublant && (
                    <span className="ml-1.5 text-[10px] border border-burgundy text-burgundy px-1.5 py-0.5">
                      🔁 doublant
                    </span>
                  )}
                </td>
                <td className={couleurMoyenne(l.moyenne)}>{l.moyenne.toFixed(2)}</td>
                <td className="tabular-nums">{l.rangClasse || "—"}</td>
                <td className="tabular-nums">{l.rangGeneration || "—"}</td>
                <td>
                  {mention ? (
                    <span className="text-xs border border-gold text-ink px-1.5 py-0.5 bg-gold-soft/30 whitespace-nowrap">
                      {LIBELLE_MENTION[mention]}
                    </span>
                  ) : (
                    <span className="text-slate text-xs">—</span>
                  )}
                </td>
                <td className="text-xs text-slate max-w-xs">
                  {l.commentaires.length > 0 ? l.commentaires.join(" ") : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
