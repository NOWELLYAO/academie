"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import { LIBELLE_RESPONSABILITE, SECTEURS, NiveauResponsabilite } from "@/lib/data/metiers";
import { formaterFCFA } from "@/lib/engines/finances";

const TYPES_CARRIERE = [
  { id: "tous", label: "Tous" },
  { id: "salarie", label: "Salarié" },
  { id: "entrepreneur", label: "Entrepreneur" },
  { id: "expatrie", label: "Expatrié" },
];

export default function CarrieresPage() {
  const session = useAcademyStore((s) => s.session);
  const [secteur, setSecteur] = useState("Tous");
  const [niveauMin, setNiveauMin] = useState(1);
  const [typeCarriereFiltre, setTypeCarriereFiltre] = useState("tous");

  const enPoste = useMemo(() => {
    if (!session) return [];
    return Object.values(session.eleves).filter(
      (e) => (e.statut === "diplome" || e.statut === "retraite") && e.carriere
    );
  }, [session]);

  const diplomes = useMemo(() => {
    return enPoste
      .filter((e) => secteur === "Tous" || e.carriere!.secteur === secteur)
      .filter((e) => e.carriere!.niveauResponsabilite >= niveauMin)
      .filter((e) => {
        if (typeCarriereFiltre === "tous") return true;
        if (typeCarriereFiltre === "expatrie") return !!e.carriere!.paysExpatriation;
        if (typeCarriereFiltre === "entrepreneur") return e.carriere!.typeCarriere === "entrepreneur";
        return e.carriere!.typeCarriere === "salarie" && !e.carriere!.paysExpatriation;
      })
      .sort((a, b) => {
        if (b.carriere!.niveauResponsabilite !== a.carriere!.niveauResponsabilite) {
          return b.carriere!.niveauResponsabilite - a.carriere!.niveauResponsabilite;
        }
        return b.carriere!.salaireMensuel - a.carriere!.salaireMensuel;
      });
  }, [enPoste, secteur, niveauMin, typeCarriereFiltre]);

  const mariages = useMemo(() => {
    if (!session) return [];
    const vus = new Set<string>();
    const paires: { a: (typeof enPoste)[number]; b: (typeof enPoste)[number] }[] = [];
    Object.values(session.eleves).forEach((e) => {
      if (!e.marie || !e.conjointMatricule || vus.has(e.matricule)) return;
      const conjoint = session.eleves[e.conjointMatricule];
      if (!conjoint) return;
      vus.add(e.matricule);
      vus.add(conjoint.matricule);
      paires.push({ a: e, b: conjoint });
    });
    return paires.sort((a, b) => (b.a.anneeMariage ?? "").localeCompare(a.a.anneeMariage ?? ""));
  }, [session, enPoste]);

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

  const tousDiplomes = enPoste;
  const salaireMoyen = tousDiplomes.length
    ? tousDiplomes.reduce((a, e) => a + (e.carriere?.salaireMensuel ?? 0), 0) / tousDiplomes.length
    : 0;
  const dirigeants = tousDiplomes.filter((e) => e.carriere!.niveauResponsabilite === 5).length;
  const meilleurSalaire = [...tousDiplomes].sort(
    (a, b) => (b.carriere?.salaireMensuel ?? 0) - (a.carriere?.salaireMensuel ?? 0)
  )[0];

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <PageHeader
        eyebrow="💼 Débouchés professionnels"
        title="Carrières"
        description="Les diplômés de la génération, orientés selon leurs compétences dominantes, classés par niveau de responsabilité et salaire."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Diplômés en poste" value={tousDiplomes.length} />
        <StatCard label="Salaire moyen" value={formaterFCFA(salaireMoyen)} accent="gold" />
        <StatCard label="Cadres dirigeants" value={dirigeants} accent="forest" />
        <StatCard
          label="Meilleur salaire"
          value={meilleurSalaire ? formaterFCFA(meilleurSalaire.carriere!.salaireMensuel) : "—"}
          accent="gold"
          sub={meilleurSalaire ? meilleurSalaire.carriere!.nom : ""}
        />
      </div>

      <div className="flex gap-3 mb-8 flex-wrap items-center">
        <select
          value={secteur}
          onChange={(e) => setSecteur(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="Tous">Tous les secteurs</option>
          {SECTEURS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex border border-line bg-white/60">
          {([1, 2, 3, 4, 5] as NiveauResponsabilite[]).map((n) => (
            <button
              key={n}
              onClick={() => setNiveauMin(n)}
              title={LIBELLE_RESPONSABILITE[n]}
              className={`px-3 py-2 text-sm ${niveauMin === n ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
            >
              {n}+
            </button>
          ))}
        </div>
        <span className="text-xs text-slate">à partir de : {LIBELLE_RESPONSABILITE[niveauMin as NiveauResponsabilite]}</span>

        <div className="flex border border-line bg-white/60">
          {TYPES_CARRIERE.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeCarriereFiltre(t.id)}
              className={`px-3 py-2 text-sm ${typeCarriereFiltre === t.id ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {diplomes.length === 0 ? (
        <p className="text-sm text-slate">
          Aucun diplômé pour ces filtres — avancez la timeline jusqu&apos;à ce que des élèves
          terminent leur cursus post-bac.
        </p>
      ) : (
        <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
          <table className="ledger-table">
            <thead>
              <tr>
                <th></th>
                <th>Élève</th>
                <th>Métier</th>
                <th>Secteur</th>
                <th>Statut</th>
                <th>Responsabilité</th>
                <th>Salaire / mois</th>
                <th>Depuis</th>
              </tr>
            </thead>
            <tbody>
              {diplomes.slice(0, 100).map((e) => (
                <tr key={e.matricule}>
                  <td>
                    <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={28} />
                  </td>
                  <td>
                    <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                      {e.nom} {e.prenom}
                    </Link>
                  </td>
                  <td className="font-medium">{e.carriere!.nom}</td>
                  <td className="text-slate">{e.carriere!.secteur}</td>
                  <td className="text-xs text-slate whitespace-nowrap">
                    {e.statut === "retraite"
                      ? "🌅 Retraité(e)"
                      : e.carriere!.paysExpatriation
                      ? `🌍 ${e.carriere!.paysExpatriation}`
                      : e.carriere!.typeCarriere === "entrepreneur"
                      ? e.carriere!.statutEntreprise === "succes"
                        ? "💡 Succès"
                        : e.carriere!.statutEntreprise === "faillite"
                        ? "🔁 Reconverti(e)"
                        : "💡 Entrepreneur"
                      : "Salarié"}
                  </td>
                  <td>
                    <span
                      className={`text-xs px-2 py-0.5 border whitespace-nowrap ${
                        e.carriere!.niveauResponsabilite >= 4
                          ? "border-gold text-ink bg-gold-soft/40"
                          : e.carriere!.niveauResponsabilite === 3
                          ? "border-forest text-forest bg-forest-soft/30"
                          : "border-line text-slate"
                      }`}
                    >
                      {LIBELLE_RESPONSABILITE[e.carriere!.niveauResponsabilite as NiveauResponsabilite]}
                    </span>
                  </td>
                  <td className="font-medium tabular-nums">{formaterFCFA(e.carriere!.salaireMensuel)}</td>
                  <td className="text-slate">{e.carriere!.anneeDebut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mariages.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-lg text-ink mb-3">💍 Mariages de la génération</h2>
          <div className="border border-line bg-white/60 divide-y divide-line">
            {mariages.slice(0, 20).map(({ a, b }) => (
              <div key={a.matricule} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
                <Avatar matricule={a.matricule} nom={a.nom} prenom={a.prenom} size={26} />
                <Link href={`/eleves/${a.matricule}`} className="text-sm text-ink hover:text-gold">
                  {a.nom} {a.prenom}
                </Link>
                <span className="text-slate">💍</span>
                <Avatar matricule={b.matricule} nom={b.nom} prenom={b.prenom} size={26} />
                <Link href={`/eleves/${b.matricule}`} className="text-sm text-ink hover:text-gold">
                  {b.nom} {b.prenom}
                </Link>
                <span className="text-xs text-slate ml-auto">{a.anneeMariage}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
