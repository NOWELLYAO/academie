"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAcademyStore } from "@/lib/store/useAcademyStore";

const LIENS = [
  { href: "/", label: "Accueil", groupe: "principal" },
  { href: "/dashboard", label: "Tableau de bord", groupe: "principal" },
  { href: "/classes", label: "Classes", groupe: "gestion" },
  { href: "/eleves", label: "Élèves", groupe: "gestion" },
  { href: "/notes", label: "Notes", groupe: "gestion" },
  { href: "/resultats", label: "Résultats", groupe: "gestion" },
  { href: "/classements", label: "Classements", groupe: "analyse" },
  { href: "/orientation", label: "Orientation", groupe: "analyse" },
  { href: "/statistiques", label: "Statistiques", groupe: "analyse" },
  { href: "/hall-of-fame", label: "Hall of Fame", groupe: "analyse" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const session = useAcademyStore((s) => s.session);

  return (
    <aside className="w-64 shrink-0 bg-ink text-paper flex flex-col border-r border-ink-soft">
      <div className="px-6 py-6 border-b border-ink-soft">
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
                      className={clsx(
                        "block px-3 py-2 rounded text-sm transition-colors",
                        actif
                          ? "bg-ink-soft text-gold-soft font-medium"
                          : "text-paper/75 hover:bg-ink-soft/60 hover:text-paper"
                      )}
                    >
                      {lien.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-ink-soft text-[11px] text-paper/50">
        {session ? (
          <>
            <div>{session.anneeCourante.libelle}</div>
            <div className="mt-0.5">Étape : {libelleEtape(session.anneeCourante.etapeCourante)}</div>
          </>
        ) : (
          "Aucune session active"
        )}
      </div>
    </aside>
  );
}

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
