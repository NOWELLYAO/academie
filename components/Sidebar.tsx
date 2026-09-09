"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAcademyStore } from "@/lib/store/useAcademyStore";

const LIENS = [
  { href: "/", label: "Accueil", groupe: "principal" },
  { href: "/dashboard", label: "Tableau de bord", groupe: "principal" },
  { href: "/favoris", label: "★ Mes favoris", groupe: "principal" },
  { href: "/classes", label: "Classes", groupe: "gestion" },
  { href: "/eleves", label: "Élèves", groupe: "gestion" },
  { href: "/notes", label: "Notes", groupe: "gestion" },
  { href: "/notes-par-niveau", label: "🎯 Notes par niveau", groupe: "gestion" },
  { href: "/resultats", label: "Résultats", groupe: "gestion" },
  { href: "/bulletin", label: "Bulletin complet", groupe: "gestion" },
  { href: "/exports", label: "Fiches PDF / Excel", groupe: "gestion" },
  { href: "/comparateur", label: "Comparateur", groupe: "analyse" },
  { href: "/evolution", label: "📈 Évolution génération", groupe: "analyse" },
  { href: "/classements", label: "Classements", groupe: "analyse" },
  { href: "/eleves-a-suivre", label: "Élèves à suivre", groupe: "analyse" },
  { href: "/orientation", label: "Orientation", groupe: "analyse" },
  { href: "/examens", label: "📊 Examens", groupe: "analyse" },
  { href: "/statistiques", label: "Statistiques", groupe: "analyse" },
  { href: "/hall-of-fame", label: "Hall of Fame", groupe: "analyse" },
  { href: "/tableau-honneur", label: "Tableau d'honneur", groupe: "analyse" },
  { href: "/finances", label: "💰 Finances", groupe: "analyse" },
  { href: "/concours", label: "Concours", groupe: "analyse" },
];

function libelleEtape(etape: string): string {
  const map: Record<string, string> = {
    T1: "Trimestre 1",
    T2: "Trimestre 2",
    T3: "Trimestre 3",
    examen: "Examen",
    orientation: "Orientation",
    annee_suivante: "Année suivante",
  };
  return map[etape] ?? etape;
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const session = useAcademyStore((s) => s.session);
  const favorisCount = session?.favoris?.length ?? 0;

  return (
    <>
      <div className="px-6 py-6 border-b border-ink-soft shrink-0">
        <div className="text-[11px] tracking-wide text-gold uppercase">Académie</div>
        <div className="font-display text-xl leading-tight mt-1">
          Génération {session?.anneeDepart?.split("-")[0] ?? "—"}
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scrollbar-thin">
        {["principal", "gestion", "analyse"].map((groupe) => (
          <div key={groupe}>
            <div className="px-3 mb-1 text-[10px] uppercase tracking-wide text-slate-300/60">
              {groupe === "principal" ? "" : groupe === "gestion" ? "Gestion" : "Analyse"}
            </div>
            <ul className="space-y-0.5">
              {LIENS.filter((l) => l.groupe === groupe).map((lien) => {
                const actif = pathname === lien.href;
                return (
                  <li key={lien.href}>
                    <Link
                      href={lien.href}
                      onClick={onNavigate}
                      className={clsx(
                        "block px-3 py-2.5 md:py-2 rounded text-sm transition-colors",
                        actif
                          ? "bg-ink-soft text-gold-soft font-medium"
                          : "text-paper/75 hover:bg-ink-soft/60 hover:text-paper"
                      )}
                    >
                      {lien.label}
                      {lien.href === "/favoris" && favorisCount > 0 && (
                        <span className="ml-1.5 text-[10px] text-gold">({favorisCount})</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-ink-soft text-[11px] text-paper/50 shrink-0 safe-bottom">
        {session ? (
          <>
            <div>{session.anneeCourante.libelle}</div>
            <div className="mt-0.5">Étape : {libelleEtape(session.anneeCourante.etapeCourante)}</div>
          </>
        ) : (
          "Aucune session active"
        )}
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);

  // Ferme le tiroir automatiquement à chaque changement de page
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  return (
    <>
      {/* Barre du haut — mobile uniquement */}
      <header className="md:hidden sticky top-0 z-30 safe-top bg-ink text-paper border-b border-ink-soft">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-[10px] tracking-wide text-gold uppercase shrink-0">Académie</span>
            <span className="font-display text-base truncate">Génération 2026</span>
          </div>
          <button
            onClick={() => setOuvert(true)}
            aria-label="Ouvrir le menu"
            className="shrink-0 h-9 w-9 flex items-center justify-center -mr-1"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Tiroir — mobile uniquement */}
      {ouvert && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink/60"
            onClick={() => setOuvert(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-ink text-paper flex flex-col safe-top safe-bottom shadow-xl">
            <div className="flex justify-end px-3 pt-3 shrink-0">
              <button
                onClick={() => setOuvert(false)}
                aria-label="Fermer le menu"
                className="h-9 w-9 flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <NavContent onNavigate={() => setOuvert(false)} />
          </aside>
        </div>
      )}

      {/* Barre latérale fixe — desktop uniquement */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 bg-ink text-paper md:flex-col border-r border-ink-soft">
        <NavContent />
      </aside>
    </>
  );
}
