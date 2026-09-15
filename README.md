# Académie — Génération 2026

Simulateur de gestion scolaire et d'orientation. Générez une promotion de
600 élèves en 3e et accompagnez-la, trimestre après trimestre, jusqu'à
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

- `generation.ts` — génère les 600 élèves et les 10 classes de 3e
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

- Les 600 élèves sont générés à partir d'une seed aléatoire à chaque
  nouvelle session : deux sessions ne donnent jamais la même promotion,
  mais une même session reste reproductible.
- La saisie manuelle de notes ("Gérer les notes") est disponible via le
  menu **Notes**. La progression automatique de la timeline génère aussi
  des évaluations et des notes de façon réaliste sans saisie manuelle.

## V2 — Direction stratégique

La simulation intègre désormais une couche de jeu stratégique :

- **Direction stratégique** : budget annuel, réputation et décisions à impact réel ;
- **Psychologie cachée** : créativité, leadership, discipline, ambition, résilience, gestion du stress ;
- **Relations** : premiers réseaux d'amitié et de mentorat entre élèves ;
- **Monde évolutif** : économie, emploi, technologie, international et coût de la vie ;
- **Missions** : objectifs de direction avec récompenses et progression ;
- **Journal narratif** : décisions, actualités et moments marquants de la génération ;
- **Page `/direction`** : nouveau centre de commandement de l'académie.

La logique est isolée dans `lib/engines/directeur.ts` afin de préserver les moteurs scolaires existants.

## V2 — Jeu des destinées
La V2 ajoute une couche de gameplay au simulateur : modes Libre/Histoire/Ironman, psychologie latente, relations, événements narratifs à choix, protégés, missions, réputation, monde évolutif, décisions stratégiques, chronique et archives des destinées.

## V4 — Simulation profonde

La V4 ajoute une couche de simulation de destinée indépendante des moteurs scolaires historiques :
- psychologie et archétypes latents ;
- réputation, influence, satisfaction, réseau et risque ;
- relations qui évoluent et peuvent devenir mentorat/rivalité ;
- économie, technologie, emploi et secteurs porteurs ;
- effets du monde sur les carrières et les salaires ;
- secrets émergents et moments déterminants ;
- chronique annuelle de la génération ;
- projection de destinée individuelle dans les fiches élèves.

Le moteur est dans `lib/engines/deepSimulation.ts` et s'exécute à la fin de chaque année scolaire, après orientation.

## V6 — Monde vivant & héritage

La V6 transforme la simulation en monde persistant à l'échelle d'une génération :
- macro-économie et chronologie mondiale ;
- entreprises créées par les élèves, croissance, emplois et valorisation ;
- archive des alumni, influence et patrimoine ;
- familles/dynasties lorsque les trajectoires matrimoniales se croisent ;
- score de legacy de la génération ;
- événements historiques et secrets émergents ;
- nouvelle page **Monde vivant** ;
- simulation profonde automatiquement exécutée au passage à une nouvelle année.

## V8 — Civilisation

La V8 ajoute une couche de simulation longue durée :
- ères historiques et indice de civilisation ;
- familles et dynasties suivies sur plusieurs générations ;
- entreprises avec transmission de direction ;
- universités concurrentes, recherche, bourses et recrutements ;
- événements historiques et crises ;
- patrimoine et influence globaux ;
- simulation prospective de 1 à 5 années depuis la page Civilisation.

## V10 — Le jeu des destinées

Refonte gameplay : centre de jeu, actions à points d'action, objectifs par chapitres, score/combo, conséquences visibles, ciblage d'élèves, bourses de rupture, coaching, défis, projets et concours stratégiques. Le système reste compatible avec les moteurs V8/V9 et initialise automatiquement le nouvel état de jeu pour les anciennes sauvegardes.
