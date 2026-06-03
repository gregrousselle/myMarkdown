# Prochaines Fonctionnalités (Next Features)

Pour transformer MyMarkdown en un outil de premier plan pour le **Développement Piloté par les Spécifications (Spec-Driven Development - SDD)**, nous devons aller au-delà de la simple édition de texte. L'objectif est de permettre aux ingénieurs et aux chefs de produit de concevoir, documenter et valider leurs idées efficacement.

## 1. Améliorations de l'Éditeur (Cœur SDD)

### 📊 Support de Mermaid.js
Le SDD nécessite souvent des schémas d'architecture, des diagrammes de séquence et des logigrammes.
- **Fonctionnalité** : Rendu en temps réel des blocs de code `mermaid`.
- **Valeur** : Visualiser les flux logiques directement dans la spécification.

### 📑 Table des Matières (ToC) Dynamique
Les spécifications peuvent être longues et complexes.
- **Fonctionnalité** : Un panneau latéral ou flottant affichant la structure du document (H1-H6).
- **Valeur** : Navigation rapide dans les documents volumineux.

### 📋 Support Avancé des Tableaux
Les spécifications utilisent massivement des tableaux pour les matrices de droits, les définitions d'API, etc.
- **Fonctionnalité** : Éditeur de tableau visuel (ajout de lignes/colonnes facilité).
- **Valeur** : Rendre la manipulation de données structurées moins pénible en Markdown.

## 2. Gestion des Connaissances & Navigation

### 🔗 Liens Internes (Wiki-links)
Le SDD repose sur un réseau de documents (ex: une spec fonctionnelle liée à une spec technique).
- **Fonctionnalité** : Support de la syntaxe `[[nom-du-fichier]]` avec autocomplétion.
- **Valeur** : Créer un "Second Brain" pour le projet.

### 🔍 Recherche Globale (Full-text Search)
- **Fonctionnalité** : Recherche rapide dans tout le dossier ouvert.
- **Valeur** : Retrouver instantanément une définition ou une règle métier éparpillée dans plusieurs fichiers.

### 📁 Modèles de Documents (Templates)
- **Fonctionnalité** : Création de fichiers basés sur des modèles (User Story, RFC, API Spec).
- **Valeur** : Standardiser la rédaction au sein d'une équipe.

## 3. Intelligence Artificielle (AI-Assisted Spec)

### 🤖 Assistant de Rédaction SDD
- **Fonctionnalité** : Intégration de LLM pour :
    - Générer des cas de tests (Gherkin/Cucumber) à partir d'une spec.
    - Vérifier la cohérence des exigences.
    - Résumer des documents longs.
- **Valeur** : Accélérer la rédaction et réduire les zones d'ombre.

### 🧪 Génération de Boilerplate
- **Fonctionnalité** : Transformer une spec de données en code (JSON Schema, TypeScript interfaces).
- **Valeur** : Réduire la friction entre la spécification et l'implémentation.

## 4. Export & Collaboration

### 📤 Export PDF/HTML Professionnel
- **Fonctionnalité** : Exportation utilisant une feuille de style sobre et professionnelle.
- **Valeur** : Partager les spécifications avec des parties prenantes externes.

### 🤝 Édition Collaborative (CRDT)
- **Fonctionnalité** : Utilisation du plugin Milkdown Collaborative (Y.js).
- **Valeur** : Permettre à plusieurs éditeurs de travailler sur la même spec en temps réel.
