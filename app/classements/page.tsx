"use client";

import { useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { classerClasse, classerGeneration } from "@/lib/engines/ranking";

export default function ClassementsPage() {
  const session = useAcademyStore((s) => s.session);
  const [portee, setPortee] = useState<"generation" | "classe">("generation");
  const [classeId, setClasseId] = useState("");

  if (!session) {
    return (
      <div className="p-10">
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

  const classement =
    portee === "generation"
      ? classerGeneration(session)
      : classeId
      ? classerClasse(session, classeId)
      : [];

  return (
    <div className="p-10 max-w-4xl">
      <PageHeader eyebrow="Classements" title="Classements de la promotion" />

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
            onClick={() => setPortee("classe")}
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
            <option value="">— Sélectionner une classe —</option>
            {session.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Matricule</th>
              <th>Élève</th>
              <th>Classe</th>
              <th>Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {classement.slice(0, 100).map((e) => (
              <tr key={e.matricule}>
                <td className="text-slate">{e.rang}</td>
                <td className="font-medium">
                  <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                    {e.matricule}
                  </Link>
                </td>
                <td>
                  {e.nom} {e.prenom}
                </td>
                <td className="text-slate">{e.classeId}</td>
                <td>{e.moyenne.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
