"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { matieresDuNiveau } from "@/lib/data/subjects";

export default function NotesSelectionPage() {
  const session = useAcademyStore((s) => s.session);
  const router = useRouter();
  const [classeId, setClasseId] = useState<string>("");

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

  const classe = session.classes.find((c) => c.id === classeId);
  const matieres = classe ? matieresDuNiveau(classe.niveau) : [];

  return (
    <div className="p-5 md:p-10 max-w-4xl">
      <PageHeader eyebrow="Gestion des notes" title="Saisir les évaluations" description="Choisissez une classe puis une matière pour créer une évaluation et saisir les notes." />

      <div className="border border-line bg-white/60 p-6 max-w-lg">
        <label className="block text-xs uppercase tracking-wide text-slate mb-2">Classe</label>
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2 text-sm mb-6 focus:outline-none focus:border-ink"
        >
          <option value="">— Sélectionner une classe —</option>
          {session.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>

        {classe && (
          <>
            <label className="block text-xs uppercase tracking-wide text-slate mb-2">Matière</label>
            <div className="grid grid-cols-2 gap-2">
              {matieres.map((m) => (
                <button
                  key={m.key}
                  onClick={() => router.push(`/notes/${classe.id}/${m.key}`)}
                  className="border border-line px-3 py-2 text-sm text-left hover:border-ink hover:bg-paper-dim transition-colors"
                >
                  {m.nom}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
