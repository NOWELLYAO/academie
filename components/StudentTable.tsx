"use client";

import Link from "next/link";
import { Eleve } from "@/lib/models/types";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import FavoriteStar from "./FavoriteStar";
import Avatar from "./Avatar";

function couleurMoyenne(m: number): string {
  if (m >= 16) return "text-forest font-semibold";
  if (m >= 12) return "text-ink";
  if (m >= 10) return "text-slate";
  return "text-burgundy";
}

export default function StudentTable({ eleves }: { eleves: Eleve[] }) {
  const tries = [...eleves].sort((a, b) => {
    const ma = a.moyennes[a.moyennes.length - 1]?.moyenneGenerale ?? 0;
    const mb = b.moyennes[b.moyennes.length - 1]?.moyenneGenerale ?? 0;
    return mb - ma;
  });

  return (
    <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
      <table className="ledger-table">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th>Rang</th>
            <th>Matricule</th>
            <th>Élève</th>
            <th>Niveau</th>
            <th>Moyenne</th>
            <th>Progression</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {tries.map((e, i) => {
            const derniere = e.moyennes[e.moyennes.length - 1];
            const progression = e.competences.progression ?? 0;
            return (
              <tr key={e.matricule}>
                <td>
                  <FavoriteStar matricule={e.matricule} />
                </td>
                <td className="text-slate">{i + 1}</td>
                <td>
                  <Link href={`/eleves/${e.matricule}`}>
                    <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={28} />
                  </Link>
                </td>
                <td className="font-medium">
                  <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                    {e.matricule}
                  </Link>
                </td>
                <td>
                  <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                    {e.nom} {e.prenom}
                  </Link>
                </td>
                <td className="text-slate">{NOM_NIVEAU[e.niveau]}</td>
                <td className={couleurMoyenne(derniere?.moyenneGenerale ?? 0)}>
                  {derniere ? derniere.moyenneGenerale.toFixed(2) : "—"}
                </td>
                <td>
                  {progression !== 0 ? (
                    <span className={progression > 0 ? "text-forest" : "text-burgundy"}>
                      {progression > 0 ? "▲" : "▼"} {Math.abs(progression)}
                    </span>
                  ) : (
                    <span className="text-slate">—</span>
                  )}
                </td>
                <td className="text-slate">{e.statut}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
