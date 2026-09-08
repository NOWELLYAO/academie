# Académie — Génération 2026

Simulateur de gestion scolaire et d'orientation. Générez une promotion de
500 élèves en 3e et accompagnez-la, trimestre après trimestre, jusqu'à
l'université ou une école d'ingénieurs.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000), cliquez sur
**« Nouvelle session »** pour générer la promotion, puis utilisez le
contrôle de timeline sur le tableau de bord pour avancer étape par étape
(Trimestre 1 → Trimestre 2 → Trimestre 3 → Examen → Orientation → Année
suivante).

## Déployer sur Vercel

1. Poussez ce dossier sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), cliquez sur **Add New → Project**
   et importez le dépôt.
3. Vercel détecte automatiquement Next.js — aucune configuration
   supplémentaire n'est nécessaire. Cliquez sur **Deploy**.

## Architecture

Toute la logique de simulation est isolée dans `/lib/engines`, indépendante
de l'interface :

- `generation.ts` — génère les 500 élèves et les 10 classes de 3e
- `potential.ts` — potentiel caché et volatilité (fait diverger deux
  élèves ayant la même moyenne aujourd'hui)
- `progression.ts` — évolution des compétences avec inertie
- `events.ts` — événements scolaires aléatoires (déclic, baisse, etc.)
- `grading.ts` — évaluations, notes, moyennes
- `orientation.ts` — orientation multi-critères
- `ranking.ts` — classements (classe, établissement, génération)
- `simulation.ts` — orchestration de la timeline annuelle

L'état de la session est géré par un store Zustand (`/lib/store`) persisté
dans le `localStorage` du navigateur — aucune base de données n'est requise
pour l'instant, mais la séparation moteurs / stockage permet d'en brancher
une facilement plus tard (Postgres + Prisma, par exemple).

## Notes

- Les 500 élèves sont générés à partir d'une seed aléatoire à chaque
  nouvelle session : deux sessions ne donnent jamais la même promotion,
  mais une même session reste reproductible.
- La saisie manuelle de notes ("Gérer les notes") est disponible via le
  menu **Notes**. La progression automatique de la timeline génère aussi
  des évaluations et des notes de façon réaliste sans saisie manuelle.
