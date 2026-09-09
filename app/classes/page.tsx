"use client";

import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { estPostBac } from "@/lib/data/subjects";
import { Classe } from "@/lib/models/types";

const GROUPES: { label: string; test: (niveau: string) => boolean }[] = [
  { label: "Collège", test: (n) => n === "3e" },
  { label: "Seconde", test: (n) => n.startsWith("2nde") },
  { label: "Première", test: (n) => n.startsWith("1ere") },
  { label: "Terminale", test: (n) => n.startsWith("Term") },
  { label: "Cycle supérieur (post-bac)", test: (n) => estPostBac(n as never) },
];

export default function ClassesPage() {
  const session = useAcademyStore((s) => s.session);

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

  function grille(classes: Classe[]) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {classes.map((c) => {
          const eleves = c.matricules.map((m) => session!.eleves[m]).filter(Boolean);
          const moys = eleves
            .map((e) => e.moyennes[e.moyennes.length - 1]?.moyenneGenerale)
            .filter((m): m is number => m !== undefined);
          const moyenne = moys.length ? moys.reduce((a, b) => a + b, 0) / moys.length : 0;

          return (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className="border border-line bg-white/60 p-4 hover:border-ink transition-colors"
            >
              <div className="font-display text-lg text-ink">{c.nom}</div>
              <div className="text-xs text-slate mt-1">{eleves.length} élèves</div>
              <div className="text-sm mt-3 tabular-nums">
                Moy. <span className="font-semibold">{moyenne ? moyenne.toFixed(2) : "—"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 max-w-6xl">
      <PageHeader
        eyebrow="Établissement"
        title="Classes"
        description={`${session.classes.length} classes actives — du collège au cycle supérieur — ${session.anneeCourante.libelle}`}
      />

      <div className="space-y-10">
        {GROUPES.map((groupe) => {
          const classes = session.classes.filter((c) => groupe.test(c.niveau));
          if (classes.length === 0) return null;
          return (
            <div key={groupe.label}>
              <h2 className="font-display text-lg text-ink mb-3">{groupe.label}</h2>
              {grille(classes)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
