# 15 août, 15 heures — Vingt minutes pour choisir

Animation en trois dimensions d’un scénario fictif de tsunami à Antibes.

Cette version comprend les silhouettes humaines sans traits du visage, les quatre choix et leurs conséquences explicites, la marche corrigée vers le parking et le plan du retrait de la mer sans personnages.

## Publier sur GitHub Pages

1. Extraire le ZIP sur votre ordinateur.
2. Créer un dépôt GitHub public, par exemple `tsunami-antibes`.
3. Ajouter **le contenu du dossier extrait** à la racine du dépôt : `index.html`, les fichiers `.js`, `style.css`, `README.md`, `.nojekyll` et le dossier `vendor` complet. Ne pas déposer seulement le fichier ZIP.
4. Enregistrer les fichiers avec **Commit changes**.
5. Ouvrir **Settings → Pages**.
6. Dans **Build and deployment**, choisir **Source → Deploy from a branch**.
7. Choisir la branche **main**, le dossier **/(root)**, puis **Save**.
8. Lorsque GitHub Pages indique l’adresse du site, ouvrir cette adresse pour consulter et partager l’animation.

Le fichier `index.html` doit se trouver directement à la racine sélectionnée, avec le dossier `vendor` à côté. Aucun outil de compilation ni aucune installation n’est nécessaire pour cette publication.

Documentation officielle : https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Utiliser l’animation

- **Lancer le film** : lecture complète, environ trois minutes.
- **Les choix** et **Les conséquences** : accès direct aux écrans de comparaison.
- **Le retrait** : scène du retrait de la mer, sans personnages.
- **Plan précédent / Plan suivant** : navigation entre les vingt plans.
- **Vue libre** : observation des scènes simples en trois dimensions.
- **Ambiance sonore** : activation facultative du son.

## Cadre

Fiction pédagogique. Le décor, les itinéraires et la submersion sont schématiques. Les délais et la vague de trois mètres reprennent le synopsis fourni. Aucun bilan ni itinéraire réel d’évacuation n’est calculé. Les consignes réelles et leurs sources sont accessibles dans « Le réflexe à retenir ».

Les fichiers sont autonomes pour un hébergement statique. Ils ne nécessitent pas de compte ChatGPT pour la consultation du site publié sur GitHub Pages.

## Dépendance incluse

Three.js, distribué sous licence MIT. La licence est conservée dans `vendor/LICENSE-three.txt`.
