"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { listerGroupesNiveau } from "@/lib/engines/simulation";
import { estPostBac } from "@/lib/data/subjects";

const GROUPES_AFFICHAGE: { label: string; test: (niveau: string) => boolean }[] = [
  { label: "Collège", test: (n) => n === "3e" },
  { label: "Seconde", test: (n) => n.startsWith("2nde") },
  { label: "Première", test: (n) => n.startsWith("1ere") },
  { label: "Terminale", test: (n) => n.startsWith("Term") },
  { label: "Cycle supérieur (post-bac)", test: (n) => estPostBac(n as never) },
];

export default function NotesParNiveauPage() {
  const session = useAcademyStore((s) => s.session);
  const genererNotesPourNiveau = useAcademyStore((s) => s.genererNotesPourNiveau);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const groupes = useMemo(() => (session ? listerGroupesNiveau(session) : []), [session]);

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

  const trimestre = session.anneeCourante.trimestreCourant;

  function generer(cle: string) {
    const n = genererNotesPourNiveau(cle);
    setMessages((prev) => ({
      ...prev,
      [cle]:
        n > 0
          ? `${n} matière${n > 1 ? "s" : ""} évaluée${n > 1 ? "s" : ""} pour le Trimestre ${trimestre}.`
          : `Déjà à jour pour le Trimestre ${trimestre} — rien n'a été dupliqué.`,
    }));
  }

  return (
    <div className="p-10 max-w-4xl">
      <PageHeader
        eyebrow="🎯 Contrôle fin par niveau"
        title="Notes par niveau"
        description={`Un bouton par niveau, jamais par classe : chaque clic génère les évaluations du Trimestre ${trimestre} pour TOUTES les classes de ce niveau d'un coup (ex: les 6 classes de Seconde C ensemble), du collège jusqu'au cycle supérieur. Rien n'est jamais dupliqué si un niveau a déjà des notes.`}
      />

      <div className="space-y-10">
        {GROUPES_AFFICHAGE.map((section) => {
          const groupesSection = groupes.filter((g) => section.test(g.niveau));
          if (groupesSection.length === 0) return null;

          return (
            <div key={section.label}>
              <h2 className="font-display text-lg text-ink mb-3">{section.label}</h2>
              <div className="space-y-2">
                {groupesSection.map((g) => (
                  <div
                    key={g.cle}
                    className="border border-line bg-white/60 px-5 py-3 flex items-center justify-between flex-wrap gap-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink">{g.libelle}</div>
                      <div className="text-xs text-slate mt-0.5">
                        {g.classes.length} classe{g.classes.length > 1 ? "s" : ""} · {g.nbEleves} élèves
                        {messages[g.cle] && (
                          <span className="text-gold ml-2">— {messages[g.cle]}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => generer(g.cle)}
                      className="bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors shrink-0"
                    >
                      🎲 Générer les notes — {g.libelle}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
