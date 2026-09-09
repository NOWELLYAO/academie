"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import RangBadge from "@/components/RangBadge";
import { classerClasse, classerGeneration, classerParMatiereListe } from "@/lib/engines/ranking";
import { MATIERES } from "@/lib/data/subjects";
import { SubjectKey } from "@/lib/models/types";

export default function ClassementsPage() {
  const session = useAcademyStore((s) => s.session);
  const [portee, setPortee] = useState<"generation" | "classe">("generation");
  const [classeId, setClasseId] = useState("");
  const [matiere, setMatiere] = useState<SubjectKey | "general">("general");

  const classement = useMemo(() => {
    if (!session) return [];
    const perimetre =
      portee === "generation"
        ? Object.values(session.eleves)
        : classeId
        ? session.classes.find((c) => c.id === classeId)?.matricules.map((m) => session.eleves[m]).filter(Boolean) ?? []
        : [];

    if (matiere === "general") {
      return portee === "generation"
        ? classerGeneration(session)
        : classeId
        ? classerClasse(session, classeId)
        : [];
    }
    return classerParMatiereListe(session, perimetre, matiere);
  }, [session, portee, classeId, matiere]);

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

  return (
    <div className="p-5 md:p-10 max-w-4xl">
      <PageHeader
        eyebrow="Classements"
        title="Classements de la promotion"
        description="Les 5 premiers de chaque classement sont marqués d'un badge de distinction."
      />

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex border border-line bg-white/60">
          <button
            onClick={() => setPortee("generation")}
            className={`px-4 py-2 text-sm ${
              portee === "generation" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"
            }`}
          >
            Génération
          </button>
          <button
            onClick={() => {
              setPortee("classe");
              if (!classeId && session.classes[0]) setClasseId(session.classes[0].id);
            }}
            className={`px-4 py-2 text-sm ${
              portee === "classe" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"
            }`}
          >
            Par classe
          </button>
        </div>

        {portee === "classe" && (
          <select
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            {session.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        )}

        <select
          value={matiere}
          onChange={(e) => setMatiere(e.target.value as SubjectKey | "general")}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="general">Moyenne générale</option>
          {MATIERES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Matricule</th>
              <th>Élève</th>
              <th>Classe</th>
              <th>{matiere === "general" ? "Moyenne" : `Moyenne — ${MATIERES.find((m) => m.key === matiere)?.nom}`}</th>
            </tr>
          </thead>
          <tbody>
            {classement.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-sm text-slate py-6 text-center">
                  Aucune donnée pour ce périmètre — avancez la timeline depuis le tableau de bord.
                </td>
              </tr>
            ) : (
              classement.slice(0, 100).map((e) => (
                <tr key={e.matricule}>
                  <td className="text-slate">
                    <span className="inline-flex items-center">
                      {e.rang}
                      <RangBadge rang={e.rang} />
                    </span>
                  </td>
                  <td className="font-medium">
                    <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                      {e.matricule}
                    </Link>
                  </td>
                  <td>
                    {e.nom} {e.prenom}
                  </td>
                  <td className="text-slate">{e.classeNom}</td>
                  <td>{e.moyenne.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
