"use client";

import { useMemo, useState } from "react";
import { Eleve, Session, SubjectKey } from "@/lib/models/types";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import {
  construireAnneeDetaillee,
  listerAnneesDisponibles,
} from "@/lib/engines/ficheDetaillee";
import RangBadge from "./RangBadge";

const ICONE_MATIERE: Record<SubjectKey, string> = {
  mathematiques: "🧮",
  physique: "🔭",
  svt: "🌿",
  francais: "🖋️",
  anglais: "🌍",
  informatique: "💻",
  philosophie: "🦉",
};

function couleurNote(m: number | null): string {
  if (m === null) return "text-slate";
  if (m >= 16) return "text-forest font-semibold";
  if (m >= 12) return "text-ink";
  if (m >= 10) return "text-slate";
  return "text-burgundy";
}

export default function FicheDetailleeParNiveau({
  session,
  eleve,
}: {
  session: Session;
  eleve: Eleve;
}) {
  const options = useMemo(() => listerAnneesDisponibles(eleve), [eleve]);
  const [anneeChoisie, setAnneeChoisie] = useState<string>(
    options[options.length - 1]?.annee ?? ""
  );

  const fiche = useMemo(
    () => (anneeChoisie ? construireAnneeDetaillee(session, eleve, anneeChoisie) : null),
    [session, eleve, anneeChoisie]
  );

  if (options.length === 0) {
    return <p className="text-sm text-slate">Pas encore de données — avancez la timeline.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="text-xs uppercase tracking-wide text-slate">Niveau / année</label>
        <select
          value={anneeChoisie}
          onChange={(e) => setAnneeChoisie(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o.annee} value={o.annee}>
              {o.label}
              {o.doublant ? " (redoublée)" : ""}
            </option>
          ))}
        </select>
        {fiche && (
          <span className="text-xs text-slate">
            {NOM_NIVEAU[fiche.niveau as keyof typeof NOM_NIVEAU] ?? fiche.niveau} · {fiche.classeNom}
          </span>
        )}
      </div>

      {!fiche ? (
        <p className="text-sm text-slate">Aucune donnée pour cette année.</p>
      ) : (
        <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Coeff.</th>
                <th>Trimestre 1</th>
                <th>Trimestre 2</th>
                <th>Trimestre 3</th>
                {fiche?.estExamen && <th>{fiche.libelleExamen ?? "Examen"}</th>}
                <th>Moy. annuelle</th>
              </tr>
            </thead>
            <tbody>
              {fiche.lignes.map((ligne) => (
                <tr key={ligne.matiere}>
                  <td className="whitespace-nowrap">
                    <span className="mr-1.5">{ICONE_MATIERE[ligne.matiere]}</span>
                    {ligne.nom}
                  </td>
                  <td className="text-slate tabular-nums">{ligne.coefficient}</td>
                  {ligne.parTrimestre.map((c) => (
                    <td key={c.trimestre}>
                      {c.moyenne === null ? (
                        <span className="text-slate">—</span>
                      ) : (
                        <div>
                          <span className={couleurNote(c.moyenne)}>{c.moyenne.toFixed(2)}</span>
                          <div className="text-[11px] text-slate mt-0.5 whitespace-nowrap">
                            <span className="inline-flex items-center">
                              {c.rangClasse}
                              {c.rangClasse && <RangBadge rang={c.rangClasse} />}
                              /{c.totalClasse} classe
                            </span>
                            <br />
                            {c.rangNiveau}/{c.totalNiveau} niveau
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                  {fiche.estExamen && (
                    <td>
                      {ligne.examen === null ? (
                        <span className="text-slate">—</span>
                      ) : (
                        <div>
                          <span className={couleurNote(ligne.examen.note)}>
                            {ligne.examen.note.toFixed(2)}
                          </span>
                          <div className="text-[11px] text-slate mt-0.5 whitespace-nowrap">
                            <span className="inline-flex items-center">
                              {ligne.examen.rangClasse}
                              {ligne.examen.rangClasse && <RangBadge rang={ligne.examen.rangClasse} />}
                              /{ligne.examen.totalClasse} classe
                            </span>
                            <br />
                            {ligne.examen.rangNiveau}/{ligne.examen.totalNiveau} niveau
                          </div>
                        </div>
                      )}
                    </td>
                  )}
                  <td className={`font-semibold ${couleurNote(ligne.moyenneAnnuelle)}`}>
                    {ligne.moyenneAnnuelle !== null ? ligne.moyenneAnnuelle.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate mt-2">
        Moyenne annuelle par matière pondérée T1×1, T2×2, T3×2 — cohérente avec la moyenne
        générale. Rangs calculés au sein de la classe suivie et de l&apos;ensemble du niveau
        {fiche?.estExamen ? `, y compris pour la note à l'épreuve (${fiche.libelleExamen}).` : "."}
      </p>
    </div>
  );
}
