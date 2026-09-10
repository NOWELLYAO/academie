"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { MATIERES } from "@/lib/data/subjects";
import { derniereMoyenneMatiere } from "@/lib/engines/ranking";
import { Eleve, SubjectKey } from "@/lib/models/types";
import Avatar from "@/components/Avatar";
import { listerPromos, elevesDeLaPromo, parcoursResume } from "@/lib/engines/promotions";
import { formaterFCFA } from "@/lib/engines/finances";
import { LIBELLE_RESPONSABILITE } from "@/lib/data/metiers";

type Mode = "classes" | "eleve" | "eleves" | "promos";

function moyenneClassePourMatiere(eleves: Eleve[], matiereKey: SubjectKey): number | null {
  const valeurs = eleves
    .map((e) => derniereMoyenneMatiere(e, matiereKey))
    .filter((v): v is number => v !== null);
  if (valeurs.length === 0) return null;
  return Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 100) / 100;
}

export default function ComparateurPage() {
  const session = useAcademyStore((s) => s.session);
  const [mode, setMode] = useState<Mode>("classes");
  const [classeA, setClasseA] = useState("");
  const [classeB, setClasseB] = useState("");
  const [matriculeEleve, setMatriculeEleve] = useState("");
  const [matriculeEleveA, setMatriculeEleveA] = useState("");
  const [matriculeEleveB, setMatriculeEleveB] = useState("");
  const [promoA, setPromoA] = useState("");
  const [promoB, setPromoB] = useState("");

  const classeAInfo = session?.classes.find((c) => c.id === classeA);
  const classeBInfo = session?.classes.find((c) => c.id === classeB);
  const eleve = matriculeEleve ? session?.eleves[matriculeEleve] : undefined;
  const eleveA = matriculeEleveA ? session?.eleves[matriculeEleveA] : undefined;
  const eleveB = matriculeEleveB ? session?.eleves[matriculeEleveB] : undefined;

  const dataClasses = useMemo(() => {
    if (!session || !classeAInfo || !classeBInfo) return [];
    const elevesA = classeAInfo.matricules.map((m) => session.eleves[m]).filter(Boolean);
    const elevesB = classeBInfo.matricules.map((m) => session.eleves[m]).filter(Boolean);

    return MATIERES.map((m) => {
      const moyA = moyenneClassePourMatiere(elevesA, m.key);
      const moyB = moyenneClassePourMatiere(elevesB, m.key);
      if (moyA === null && moyB === null) return null;
      return { matiere: m.nom, [classeAInfo.nom]: moyA ?? 0, [classeBInfo.nom]: moyB ?? 0 };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [session, classeAInfo, classeBInfo]);

  const dataEleve = useMemo(() => {
    if (!session || !eleve) return [];
    const classe = session.classes.find((c) => c.id === eleve.classeId);
    const eleves = classe ? classe.matricules.map((m) => session.eleves[m]).filter(Boolean) : [];

    return MATIERES.map((m) => {
      const moyEleve = derniereMoyenneMatiere(eleve, m.key);
      const moyClasse = moyenneClassePourMatiere(eleves, m.key);
      if (moyEleve === null && moyClasse === null) return null;
      return {
        matiere: m.nom,
        [`${eleve.nom} ${eleve.prenom}`]: moyEleve ?? 0,
        "Moyenne de la classe": moyClasse ?? 0,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [session, eleve]);

  const dataElevesVs = useMemo(() => {
    if (!eleveA || !eleveB) return [];
    return MATIERES.map((m) => {
      const moyA = derniereMoyenneMatiere(eleveA, m.key);
      const moyB = derniereMoyenneMatiere(eleveB, m.key);
      if (moyA === null && moyB === null) return null;
      return {
        matiere: m.nom,
        [`${eleveA.nom} ${eleveA.prenom}`]: moyA ?? 0,
        [`${eleveB.nom} ${eleveB.prenom}`]: moyB ?? 0,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [eleveA, eleveB]);

  const promos = useMemo(() => (session ? listerPromos(session) : []), [session]);
  const elevesPromoA = useMemo(() => (session && promoA ? elevesDeLaPromo(session, promoA) : []), [session, promoA]);
  const elevesPromoB = useMemo(() => (session && promoB ? elevesDeLaPromo(session, promoB) : []), [session, promoB]);

  function statsPromo(eleves: Eleve[]) {
    const avecCarriere = eleves.filter((e) => e.carriere);
    const salaireMoyen = avecCarriere.length
      ? avecCarriere.reduce((a, e) => a + (e.carriere?.salaireMensuel ?? 0), 0) / avecCarriere.length
      : 0;
    const dirigeants = avecCarriere.filter((e) => (e.carriere?.niveauResponsabilite ?? 0) >= 5).length;
    const maries = eleves.filter((e) => e.marie).length;
    const entrepreneurs = avecCarriere.filter((e) => e.carriere?.typeCarriere === "entrepreneur").length;
    const expatries = avecCarriere.filter((e) => e.carriere?.paysExpatriation).length;
    const meilleur = [...avecCarriere].sort(
      (a, b) => (b.carriere?.salaireMensuel ?? 0) - (a.carriere?.salaireMensuel ?? 0)
    )[0];
    return { total: eleves.length, salaireMoyen, dirigeants, maries, entrepreneurs, expatries, meilleur };
  }

  const statsA = useMemo(() => statsPromo(elevesPromoA), [elevesPromoA]);
  const statsB = useMemo(() => statsPromo(elevesPromoB), [elevesPromoB]);

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
    <div className="p-5 md:p-10 max-w-5xl">
      <PageHeader
        eyebrow="Comparateur"
        title="Comparer les performances"
        description="Comparez deux classes matière par matière, un élève à la moyenne de sa propre classe, ou deux élèves face à face."
      />

      <div className="flex border border-line bg-white/60 mb-6 w-fit">
        <button
          onClick={() => setMode("classes")}
          className={`px-4 py-2 text-sm ${mode === "classes" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
        >
          Classe vs Classe
        </button>
        <button
          onClick={() => setMode("eleve")}
          className={`px-4 py-2 text-sm ${mode === "eleve" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
        >
          Élève vs sa classe
        </button>
        <button
          onClick={() => setMode("eleves")}
          className={`px-4 py-2 text-sm ${mode === "eleves" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
        >
          Élève vs Élève
        </button>
        <button
          onClick={() => setMode("promos")}
          className={`px-4 py-2 text-sm ${mode === "promos" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
        >
          🎓 Promo vs Promo
        </button>
      </div>

      {mode === "classes" ? (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Classe A</label>
              <select
                value={classeA}
                onChange={(e) => setClasseA(e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {session.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Classe B</label>
              <select
                value={classeB}
                onChange={(e) => setClasseB(e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {session.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dataClasses.length === 0 ? (
            <p className="text-sm text-slate">Sélectionnez deux classes pour lancer la comparaison.</p>
          ) : (
            <div className="border border-line bg-white/60 p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataClasses}>
                  <CartesianGrid stroke="#DCD9CE" vertical={false} />
                  <XAxis dataKey="matiere" tick={{ fontSize: 11, fill: "#55607A" }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} width={28} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey={classeAInfo?.nom ?? "Classe A"} fill="#101B33" radius={[2, 2, 0, 0]} />
                  <Bar dataKey={classeBInfo?.nom ?? "Classe B"} fill="#C9A227" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : mode === "eleve" ? (
        <>
          <div className="mb-6">
            <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">
              Matricule de l&apos;élève
            </label>
            <input
              value={matriculeEleve}
              onChange={(e) => setMatriculeEleve(e.target.value.toUpperCase())}
              placeholder="ex: A27"
              className="border border-line bg-white px-3 py-2 text-sm w-40"
            />
          </div>

          {!eleve ? (
            <p className="text-sm text-slate">Saisissez un matricule valide pour lancer la comparaison.</p>
          ) : (
            <>
              <p className="text-sm text-ink mb-4">
                {eleve.nom} {eleve.prenom} —{" "}
                {session.classes.find((c) => c.id === eleve.classeId)?.nom ?? eleve.classeId}
              </p>
              <div className="border border-line bg-white/60 p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataEleve}>
                    <CartesianGrid stroke="#DCD9CE" vertical={false} />
                    <XAxis dataKey="matiere" tick={{ fontSize: 11, fill: "#55607A" }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} width={28} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={`${eleve.nom} ${eleve.prenom}`} fill="#101B33" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Moyenne de la classe" fill="#C9A227" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">
                Matricule élève A
              </label>
              <input
                value={matriculeEleveA}
                onChange={(e) => setMatriculeEleveA(e.target.value.toUpperCase())}
                placeholder="ex: A27"
                className="border border-line bg-white px-3 py-2 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">
                Matricule élève B
              </label>
              <input
                value={matriculeEleveB}
                onChange={(e) => setMatriculeEleveB(e.target.value.toUpperCase())}
                placeholder="ex: D14"
                className="border border-line bg-white px-3 py-2 text-sm w-40"
              />
            </div>
          </div>

          {!eleveA || !eleveB ? (
            <p className="text-sm text-slate">Saisissez deux matricules valides pour lancer la comparaison.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg">
                {[eleveA, eleveB].map((e) => {
                  const derniere = e.moyennes[e.moyennes.length - 1];
                  const nomClasse = session.classes.find((c) => c.id === e.classeId)?.nom ?? e.classeId;
                  return (
                    <div key={e.matricule} className="border border-line bg-white/60 px-4 py-3">
                      <div className="flex items-center gap-3 mb-1">
                        <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={32} />
                        <Link href={`/eleves/${e.matricule}`} className="text-sm font-medium text-ink hover:text-gold">
                          {e.nom} {e.prenom}
                        </Link>
                      </div>
                      <div className="text-xs text-slate mt-0.5">
                        {e.matricule} · {nomClasse}
                      </div>
                      <div className="font-display text-2xl text-ink mt-1">
                        {derniere ? derniere.moyenneGenerale.toFixed(2) : "—"}
                      </div>
                      {derniere && (
                        <div className="text-[11px] text-slate">
                          Rang {derniere.rangClasse} classe · {derniere.rangGeneration} génération
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {dataElevesVs.length === 0 ? (
                <p className="text-sm text-slate">
                  Aucune matière commune pour l&apos;instant entre ces deux élèves.
                </p>
              ) : (
                <div className="border border-line bg-white/60 p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataElevesVs}>
                      <CartesianGrid stroke="#DCD9CE" vertical={false} />
                      <XAxis dataKey="matiere" tick={{ fontSize: 11, fill: "#55607A" }} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} width={28} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey={`${eleveA.nom} ${eleveA.prenom}`} fill="#101B33" radius={[2, 2, 0, 0]} />
                      <Bar dataKey={`${eleveB.nom} ${eleveB.prenom}`} fill="#C9A227" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {(eleveA.carriere || eleveB.carriere) && (
                <>
                  <h2 className="font-display text-lg text-ink mt-10 mb-3">💼 Vie active</h2>
                  <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
                    <table className="ledger-table text-xs">
                      <thead>
                        <tr>
                          <th></th>
                          <th>{eleveA.nom} {eleveA.prenom}</th>
                          <th>{eleveB.nom} {eleveB.prenom}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-slate">Poste actuel</td>
                          <td>{eleveA.carriere?.nom ?? "—"}</td>
                          <td>{eleveB.carriere?.nom ?? "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-slate">Entreprise</td>
                          <td>{eleveA.carriere?.entreprise ?? "—"}</td>
                          <td>{eleveB.carriere?.entreprise ?? "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-slate">Secteur</td>
                          <td>{eleveA.carriere?.secteur ?? "—"}</td>
                          <td>{eleveB.carriere?.secteur ?? "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-slate">Niveau de responsabilité</td>
                          <td>
                            {eleveA.carriere
                              ? LIBELLE_RESPONSABILITE[eleveA.carriere.niveauResponsabilite as 1 | 2 | 3 | 4 | 5]
                              : "—"}
                          </td>
                          <td>
                            {eleveB.carriere
                              ? LIBELLE_RESPONSABILITE[eleveB.carriere.niveauResponsabilite as 1 | 2 | 3 | 4 | 5]
                              : "—"}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-slate">Salaire actuel</td>
                          <td className="font-medium">
                            {eleveA.carriere ? formaterFCFA(eleveA.carriere.salaireMensuel) : "—"}
                          </td>
                          <td className="font-medium">
                            {eleveB.carriere ? formaterFCFA(eleveB.carriere.salaireMensuel) : "—"}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-slate">Situation</td>
                          <td>
                            {eleveA.marie
                              ? `💍 Marié(e) depuis ${eleveA.anneeMariage}`
                              : "Célibataire"}
                          </td>
                          <td>
                            {eleveB.marie
                              ? `💍 Marié(e) depuis ${eleveB.anneeMariage}`
                              : "Célibataire"}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-slate align-top">Parcours</td>
                          <td className="align-top">
                            {parcoursResume(eleveA)
                              .map((p) => p.poste)
                              .join(" → ") || "—"}
                          </td>
                          <td className="align-top">
                            {parcoursResume(eleveB)
                              .map((p) => p.poste)
                              .join(" → ") || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {mode === "promos" && (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Promo A</label>
              <select
                value={promoA}
                onChange={(e) => setPromoA(e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {promos.map((p) => (
                  <option key={p} value={p}>
                    Promo {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Promo B</label>
              <select
                value={promoB}
                onChange={(e) => setPromoB(e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {promos.map((p) => (
                  <option key={p} value={p}>
                    Promo {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!promoA || !promoB ? (
            <p className="text-sm text-slate">Sélectionnez deux promotions pour lancer la comparaison.</p>
          ) : (
            <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
              <table className="ledger-table text-sm">
                <thead>
                  <tr>
                    <th></th>
                    <th>Promo {promoA}</th>
                    <th>Promo {promoB}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-slate">Diplômés</td>
                    <td className="font-medium">{statsA.total}</td>
                    <td className="font-medium">{statsB.total}</td>
                  </tr>
                  <tr>
                    <td className="text-slate">Salaire moyen actuel</td>
                    <td className="font-medium">{formaterFCFA(statsA.salaireMoyen)}</td>
                    <td className="font-medium">{formaterFCFA(statsB.salaireMoyen)}</td>
                  </tr>
                  <tr>
                    <td className="text-slate">Meilleur salaire</td>
                    <td>
                      {statsA.meilleur ? formaterFCFA(statsA.meilleur.carriere!.salaireMensuel) : "—"}
                    </td>
                    <td>
                      {statsB.meilleur ? formaterFCFA(statsB.meilleur.carriere!.salaireMensuel) : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-slate">Cadres dirigeants</td>
                    <td>{statsA.dirigeants}</td>
                    <td>{statsB.dirigeants}</td>
                  </tr>
                  <tr>
                    <td className="text-slate">Entrepreneurs</td>
                    <td>{statsA.entrepreneurs}</td>
                    <td>{statsB.entrepreneurs}</td>
                  </tr>
                  <tr>
                    <td className="text-slate">Expatriés</td>
                    <td>{statsA.expatries}</td>
                    <td>{statsB.expatries}</td>
                  </tr>
                  <tr>
                    <td className="text-slate">Mariés</td>
                    <td>{statsA.maries}</td>
                    <td>{statsB.maries}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
