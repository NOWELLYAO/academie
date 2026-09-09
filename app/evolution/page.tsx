"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";

const GROUPES_NIVEAU: { label: string; niveaux: string[]; couleur: string }[] = [
  { label: "Collège (3e)", niveaux: ["3e"], couleur: "#55607A" },
  { label: "Seconde", niveaux: ["2ndeA", "2ndeC"], couleur: "#2E5C7A" },
  { label: "Première", niveaux: ["1ereA", "1ereC", "1ereD"], couleur: "#101B33" },
  { label: "Terminale", niveaux: ["TermA", "TermC", "TermD"], couleur: "#C9A227" },
  {
    label: "Post-bac",
    niveaux: ["PrepaScientifique", "PrepaLitteraire", "DUT", "Universite", "EcoleIngenieurs"],
    couleur: "#1F5C4B",
  },
];

export default function EvolutionPage() {
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

  const historique = session.historiqueBilans ?? [];

  if (historique.length === 0) {
    return (
      <div className="p-5 md:p-10 max-w-3xl">
        <PageHeader
          eyebrow="Suivi pluriannuel"
          title="Évolution de la génération"
          description="Cette page se remplit automatiquement à chaque fin d'année (étape « Orientation »)."
        />
        <p className="text-sm text-slate">
          Aucune année complète pour l&apos;instant. Avancez la timeline depuis le{" "}
          <Link href="/dashboard" className="text-ink border-b border-gold">
            tableau de bord
          </Link>{" "}
          jusqu&apos;à l&apos;étape « Orientation » pour voir apparaître le premier point de suivi.
        </p>
      </div>
    );
  }

  const dataGroupes = historique.map((h) => {
    const point: Record<string, number | string> = { annee: h.annee };
    GROUPES_NIVEAU.forEach((g) => {
      point[g.label] = g.niveaux.reduce((acc, n) => acc + (h.repartitionNiveaux[n as never] ?? 0), 0);
    });
    return point;
  });

  const dataPostBac = historique.map((h) => ({
    annee: h.annee,
    "École d'ingénieurs": h.ecolesIngenieurs,
    "Prépa scientifique": h.prepaScientifique,
    "Prépa littéraire": h.prepaLitteraire,
    "DUT / BTS": h.dut,
    Université: h.universitaires,
  }));

  const dataResultats = historique.map((h) => ({
    annee: h.annee,
    "Moyenne générale": h.moyenneGenerale,
    "Taux de réussite (%)": h.tauxReussite,
  }));

  const dataAccidents = historique.map((h) => ({
    annee: h.annee,
    Redoublements: h.redoublements,
    Recalés: h.recales,
  }));

  const dernier = historique[historique.length - 1];

  return (
    <div className="p-5 md:p-10 max-w-6xl">
      <PageHeader
        eyebrow="Suivi pluriannuel"
        title="Évolution de la génération"
        description="La progression de la promotion, année après année — du collège jusqu'aux écoles d'ingénieurs, prépas, DUT et université."
      />

      <div className="mb-10">
        <h2 className="font-display text-lg text-ink mb-1">Répartition par grand niveau</h2>
        <p className="text-xs text-slate mb-3">
          Chaque bande représente le nombre d&apos;élèves à ce stade du parcours, année par année.
        </p>
        <div className="border border-line bg-white/60 p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataGroupes}>
              <CartesianGrid stroke="#DCD9CE" vertical={false} />
              <XAxis dataKey="annee" tick={{ fontSize: 11, fill: "#55607A" }} />
              <YAxis tick={{ fontSize: 11, fill: "#55607A" }} width={32} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {GROUPES_NIVEAU.map((g) => (
                <Area
                  key={g.label}
                  type="monotone"
                  dataKey={g.label}
                  stackId="1"
                  stroke={g.couleur}
                  fill={g.couleur}
                  fillOpacity={0.75}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="font-display text-lg text-ink mb-1">Destinations post-bac</h2>
        <p className="text-xs text-slate mb-3">
          Combien d&apos;élèves ont rejoint chaque filière post-bac, cumulés année après année.
        </p>
        {dernier.ecolesIngenieurs + dernier.prepaScientifique + dernier.prepaLitteraire + dernier.dut + dernier.universitaires === 0 ? (
          <p className="text-sm text-slate">
            Aucun élève n&apos;a encore atteint le post-bac dans cette génération — cette section se
            remplira dès les premiers bacheliers.
          </p>
        ) : (
          <div className="border border-line bg-white/60 p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPostBac}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="annee" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55607A" }} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="École d'ingénieurs" stroke="#1F5C4B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Prépa scientifique" stroke="#101B33" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Prépa littéraire" stroke="#7A2E3B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="DUT / BTS" stroke="#2E5C7A" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Université" stroke="#C9A227" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Moyenne & taux de réussite</h2>
          <div className="border border-line bg-white/60 p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataResultats}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="annee" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55607A" }} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Moyenne générale" stroke="#101B33" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Taux de réussite (%)" stroke="#C9A227" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink mb-3">Redoublements & recalages</h2>
          <div className="border border-line bg-white/60 p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataAccidents}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="annee" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55607A" }} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Redoublements" stroke="#7A2E3B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Recalés" stroke="#A23B2E" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="font-display text-lg text-ink mb-3">Détail année par année</h2>
      <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Année</th>
              <th>Moyenne</th>
              <th>Réussite</th>
              <th>Redoublements</th>
              <th>Recalés</th>
              <th>École ing.</th>
              <th>Prépa sci.</th>
              <th>Prépa litt.</th>
              <th>DUT</th>
              <th>Université</th>
            </tr>
          </thead>
          <tbody>
            {historique.map((h) => (
              <tr key={h.annee}>
                <td className="font-medium">{h.annee}</td>
                <td>{h.moyenneGenerale.toFixed(2)}</td>
                <td>{h.tauxReussite}%</td>
                <td className="text-burgundy">{h.redoublements}</td>
                <td className="text-burgundy">{h.recales}</td>
                <td className="text-forest">{h.ecolesIngenieurs}</td>
                <td>{h.prepaScientifique}</td>
                <td>{h.prepaLitteraire}</td>
                <td>{h.dut}</td>
                <td>{h.universitaires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
