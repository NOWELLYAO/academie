"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StudentTable from "@/components/StudentTable";

export default function ElevesPage() {
  const session = useAcademyStore((s) => s.session);
  const [recherche, setRecherche] = useState("");

  const eleves = useMemo(() => {
    if (!session) return [];
    return Object.values(session.eleves);
  }, [session]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return eleves.slice(0, 60);
    return eleves.filter(
      (e) =>
        e.matricule.toLowerCase().includes(q) ||
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q)
    );
  }, [eleves, recherche]);

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

  return (
    <div className="p-10 max-w-6xl">
      <PageHeader eyebrow={`${eleves.length} élèves`} title="Recherche d'élèves" />

      <input
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher par nom, prénom ou matricule (ex: A027)"
        className="w-full max-w-md border border-line bg-white px-3 py-2 text-sm mb-6 focus:outline-none focus:border-ink"
      />

      <StudentTable eleves={filtres} />
      {!recherche && (
        <p className="text-xs text-slate mt-3">
          Affichage des 60 premiers élèves — affinez la recherche pour en voir d&apos;autres.
        </p>
      )}
    </div>
  );
}
