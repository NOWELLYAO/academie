"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";

export default function ResultatsPage() {
  const session = useAcademyStore((s) => s.session);
  const [trimestre, setTrimestre] = useState<1 | 2 | 3>(1);
  const [classeId, setClasseId] = useState("");

  const eleves = useMemo(() => (session ? Object.values(session.eleves) : []), [session]);

  if (!session) {
    return (
      <div className="p-5 md:p-10">
        <p className="text-slate text-sm">
          Aucune session active.{" "}
          <Link href="/" className="text-ink border-b border-gold">
            Créer une nouvelle session
          </Link>
          .
        </p>
      </div>
    );
  }

  const lignes = eleves
    .filter((e) => !classeId || e.classeId === classeId)
    .map((e) => {
      const moyenneTrimestre = e.moyennes.find(
        (m) => m.trimestre === trimestre && m.annee === session.anneeCourante.libelle
      );
      return { eleve: e, moyenneTrimestre };
    })
    .filter((l) => l.moyenneTrimestre)
    .sort((a, b) => (b.moyenneTrimestre!.moyenneGenerale) - (a.moyenneTrimestre!.moyenneGenerale));

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <PageHeader eyebrow={session.anneeCourante.libelle} title="Résultats" description="Consultez les moyennes par trimestre." />

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex border border-line bg-white/60">
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              onClick={() => setTrimestre(t as 1 | 2 | 3)}
              className={`px-4 py-2 text-sm ${
                trimestre === t ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"
              }`}
            >
              Trimestre {t}
            </button>
          ))}
        </div>
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Toutes les classes</option>
          {session.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {lignes.length === 0 ? (
        <p className="text-sm text-slate">
          Aucun résultat pour ce trimestre — avancez la timeline depuis le tableau de bord.
        </p>
      ) : (
        <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Classe</th>
                <th>Moyenne T{trimestre}</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.eleve.matricule}>
                  <td className="text-slate">{i + 1}</td>
                  <td className="font-medium">
                    <Link href={`/eleves/${l.eleve.matricule}`} className="hover:text-gold">
                      {l.eleve.matricule}
                    </Link>
                  </td>
                  <td>
                    {l.eleve.nom} {l.eleve.prenom}
                  </td>
                  <td className="text-slate">{l.eleve.classeId}</td>
                  <td>{l.moyenneTrimestre!.moyenneGenerale.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
