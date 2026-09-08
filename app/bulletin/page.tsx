"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { MATIERES } from "@/lib/data/subjects";
import { classerParMatiere } from "@/lib/engines/ranking";
import RangBadge from "@/components/RangBadge";
import { Eleve, SubjectKey } from "@/lib/models/types";

type Portee = "generation" | "classe";
type Colonne =
  | "rang"
  | "matricule"
  | "eleve"
  | "classe"
  | "niveau"
  | SubjectKey
  | "moyenneGenerale"
  | "rangClasse"
  | "rangGeneration"
  | "progression"
  | "regularite"
  | "assiduite"
  | "statut";

function couleurValeur(m: number): string {
  if (m >= 16) return "text-forest font-semibold";
  if (m >= 12) return "text-ink";
  if (m >= 10) return "text-slate";
  return "text-burgundy";
}

export default function BulletinPage() {
  const session = useAcademyStore((s) => s.session);
  const [portee, setPortee] = useState<Portee>("generation");
  const [classeId, setClasseId] = useState("");
  const [tri, setTri] = useState<{ colonne: Colonne; sens: 1 | -1 }>({
    colonne: "moyenneGenerale",
    sens: -1,
  });

  const eleves: Eleve[] = useMemo(() => {
    if (!session) return [];
    if (portee === "generation") return Object.values(session.eleves);
    if (!classeId) return [];
    const classe = session.classes.find((c) => c.id === classeId);
    return classe ? classe.matricules.map((m) => session.eleves[m]).filter(Boolean) : [];
  }, [session, portee, classeId]);

  const nomsClasses = useMemo(() => {
    if (!session) return {} as Record<string, string>;
    const carte: Record<string, string> = {};
    session.classes.forEach((c) => (carte[c.id] = c.nom));
    return carte;
  }, [session]);

  // Classements par matière calculés sur le périmètre sélectionné (classe ou génération)
  const classementsMatieres = useMemo(() => {
    const map = new Map<SubjectKey, Map<string, { moyenne: number; rang: number; total: number }>>();
    MATIERES.forEach((m) => map.set(m.key, classerParMatiere(eleves, m.key)));
    return map;
  }, [eleves]);

  // Matières effectivement présentes dans le périmètre affiché (évite les colonnes vides)
  const matieresAffichees = useMemo(() => {
    return MATIERES.filter((m) => (classementsMatieres.get(m.key)?.size ?? 0) > 0);
  }, [classementsMatieres]);

  const lignes = useMemo(() => {
    return eleves.map((e) => {
      const derniere = e.moyennes[e.moyennes.length - 1];
      return {
        eleve: e,
        moyenneGenerale: derniere?.moyenneGenerale ?? 0,
        rangClasse: derniere?.rangClasse ?? 0,
        rangGeneration: derniere?.rangGeneration ?? 0,
      };
    });
  }, [eleves]);

  const lignesTriees = useMemo(() => {
    const copie = [...lignes];
    copie.sort((a, b) => {
      let va: number, vb: number;
      switch (tri.colonne) {
        case "moyenneGenerale":
          va = a.moyenneGenerale; vb = b.moyenneGenerale; break;
        case "rangClasse":
          va = a.rangClasse; vb = b.rangClasse; break;
        case "rangGeneration":
          va = a.rangGeneration; vb = b.rangGeneration; break;
        case "progression":
          va = a.eleve.competences.progression ?? 0; vb = b.eleve.competences.progression ?? 0; break;
        case "regularite":
          va = a.eleve.competences.regularite ?? 0; vb = b.eleve.competences.regularite ?? 0; break;
        case "assiduite":
          va = a.eleve.assiduite; vb = b.eleve.assiduite; break;
        case "matricule":
          return tri.sens * a.eleve.matricule.localeCompare(b.eleve.matricule);
        case "eleve":
          return tri.sens * `${a.eleve.nom} ${a.eleve.prenom}`.localeCompare(`${b.eleve.nom} ${b.eleve.prenom}`);
        default: {
          const carte = classementsMatieres.get(tri.colonne as SubjectKey);
          va = carte?.get(a.eleve.matricule)?.moyenne ?? -1;
          vb = carte?.get(b.eleve.matricule)?.moyenne ?? -1;
        }
      }
      return tri.sens * (va - vb);
    });
    return copie;
  }, [lignes, tri, classementsMatieres]);

  function trierPar(colonne: Colonne) {
    setTri((prev) =>
      prev.colonne === colonne ? { colonne, sens: prev.sens === -1 ? 1 : -1 } : { colonne, sens: -1 }
    );
  }

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

  const flecheTri = (colonne: Colonne) =>
    tri.colonne === colonne ? (tri.sens === -1 ? " ▼" : " ▲") : "";

  return (
    <div className="p-10 max-w-full">
      <PageHeader
        eyebrow="Feuille de notes exhaustive"
        title="Bulletin complet"
        description="Moyennes et rangs par matière, moyenne générale, progression, régularité et assiduité — par classe ou pour l'ensemble de la génération. Cliquez sur un en-tête pour trier."
      />

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex border border-line bg-white/60">
          <button
            onClick={() => setPortee("generation")}
            className={`px-4 py-2 text-sm ${
              portee === "generation" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"
            }`}
          >
            Génération entière
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

        <span className="text-xs text-slate ml-auto">
          {lignesTriees.length} élève{lignesTriees.length > 1 ? "s" : ""}
        </span>
      </div>

      {lignesTriees.length === 0 ? (
        <p className="text-sm text-slate">
          Aucune donnée pour ce périmètre — avancez la timeline depuis le tableau de bord.
        </p>
      ) : (
        <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
          <table className="ledger-table text-sm whitespace-nowrap">
            <thead>
              <tr>
                <Th onClick={() => trierPar("matricule")}>Matricule{flecheTri("matricule")}</Th>
                <Th onClick={() => trierPar("eleve")}>Élève{flecheTri("eleve")}</Th>
                <th>Classe</th>
                <th>Niveau</th>
                {matieresAffichees.map((m) => (
                  <Th key={m.key} onClick={() => trierPar(m.key)}>
                    {m.nom}{flecheTri(m.key)}
                  </Th>
                ))}
                <Th onClick={() => trierPar("moyenneGenerale")}>
                  Moy. générale{flecheTri("moyenneGenerale")}
                </Th>
                <Th onClick={() => trierPar("rangClasse")}>Rang classe{flecheTri("rangClasse")}</Th>
                <Th onClick={() => trierPar("rangGeneration")}>
                  Rang génération{flecheTri("rangGeneration")}
                </Th>
                <Th onClick={() => trierPar("progression")}>Progression{flecheTri("progression")}</Th>
                <Th onClick={() => trierPar("regularite")}>Régularité{flecheTri("regularite")}</Th>
                <Th onClick={() => trierPar("assiduite")}>Assiduité{flecheTri("assiduite")}</Th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignesTriees.map(({ eleve: e, moyenneGenerale, rangClasse, rangGeneration }) => {
                const progression = e.competences.progression ?? 0;
                return (
                  <tr key={e.matricule}>
                    <td className="font-medium">
                      <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                        {e.matricule}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                        {e.nom} {e.prenom}
                      </Link>
                    </td>
                    <td className="text-slate">{nomsClasses[e.classeId] ?? e.classeId}</td>
                    <td className="text-slate">{e.niveau}</td>
                    {matieresAffichees.map((m) => {
                      const info = classementsMatieres.get(m.key)?.get(e.matricule);
                      return (
                        <td key={m.key}>
                          {info ? (
                            <span className={couleurValeur(info.moyenne)}>
                              {info.moyenne.toFixed(2)}{" "}
                              <span className="text-slate text-xs">
                                ({info.rang}/{info.total})
                              </span>
                              <RangBadge rang={info.rang} />
                            </span>
                          ) : (
                            <span className="text-slate">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={couleurValeur(moyenneGenerale) + " font-semibold"}>
                      {moyenneGenerale.toFixed(2)}
                    </td>
                    <td className="tabular-nums">
                      <span className="inline-flex items-center">
                        {rangClasse || "—"}
                        {rangClasse > 0 && <RangBadge rang={rangClasse} />}
                      </span>
                    </td>
                    <td className="tabular-nums">
                      <span className="inline-flex items-center">
                        {rangGeneration || "—"}
                        {rangGeneration > 0 && <RangBadge rang={rangGeneration} />}
                      </span>
                    </td>
                    <td>
                      {progression !== 0 ? (
                        <span className={progression > 0 ? "text-forest" : "text-burgundy"}>
                          {progression > 0 ? "▲" : "▼"} {Math.abs(progression)}
                        </span>
                      ) : (
                        <span className="text-slate">—</span>
                      )}
                    </td>
                    <td className="tabular-nums">{Math.round(e.competences.regularite)}/100</td>
                    <td className="tabular-nums">{Math.round(e.assiduite)}/100</td>
                    <td className="text-slate capitalize">{e.statut}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none hover:text-ink transition-colors"
    >
      {children}
    </th>
  );
}
