"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAcademyStore } from "@/lib/store/useAcademyStore";

export default function AccueilPage() {
  const router = useRouter();
  const session = useAcademyStore((s) => s.session);
  const sessionsHistorique = useAcademyStore((s) => s.sessionsHistorique);
  const nouvelleSession = useAcademyStore((s) => s.nouvelleSession);
  const [nom, setNom] = useState("Génération 2026");
  const [enCours, setEnCours] = useState(false);

  function lancer() {
    setEnCours(true);
    setTimeout(() => {
      nouvelleSession(nom || "Génération 2026");
      router.push("/dashboard");
    }, 50);
  }

  return (
    <div className="min-h-screen flex items-center">
      <div className="max-w-3xl mx-auto px-5 py-12 md:px-8 md:py-16 w-full safe-bottom">
        <div className="text-[11px] uppercase tracking-wide text-gold mb-3">
          Simulateur de gestion scolaire
        </div>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] text-ink mb-4">
          Académie
          <br />
          Génération
        </h1>
        <p className="text-slate max-w-lg mb-10 leading-relaxed">
          Prenez la direction d&apos;un établissement de 600 élèves, de la 3e à
          l&apos;université. Notes, compétences, événements de parcours et
          orientation — chaque décision façonne une trajectoire.
        </p>

        <div className="border border-line bg-white/60 p-6 max-w-md mb-8">
          <label className="block text-xs uppercase tracking-wide text-slate mb-2">
            Nom de la session
          </label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border border-line bg-white px-3 py-2 text-sm mb-4 focus:outline-none focus:border-ink"
            placeholder="Génération 2026"
          />
          <button
            onClick={lancer}
            disabled={enCours}
            className="w-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {enCours ? "Génération de la promotion…" : "Nouvelle session →"}
          </button>
          <p className="text-[11px] text-slate mt-2">
            Génère automatiquement 600 élèves répartis en 10 classes de 3e.
          </p>
        </div>

        {session && (
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-ink border-b border-gold hover:text-ink-soft mb-6 block"
          >
            Continuer « {session.nomSession} » ({session.anneeCourante.libelle}) →
          </button>
        )}

        {sessionsHistorique.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-slate mb-2">
              Historique des sessions
            </div>
            <ul className="text-sm text-slate space-y-1">
              {sessionsHistorique.map((s) => (
                <li key={s.id}>
                  {s.nom} — {new Date(s.dateCreation).toLocaleDateString("fr-FR")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
