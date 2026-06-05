# Feuille de Route (Roadmap) - MyMarkdown

Cette roadmap définit les étapes clés pour faire évoluer MyMarkdown vers un outil d'élite pour le développement piloté par les spécifications.

## Phase 1 : Fondations & Expérience de Rédaction (Court Terme)
*Objectif : Rendre la rédaction de spécifications techniques fluide et visuelle.*

- [ ] **Intégration Mermaid.js** : Support des diagrammes (flowcharts, sequence diagrams).
- [x] **Amélioration des Tableaux** : Passage à l'extension `table` de Milkdown pour une édition facilitée.
- [x] **Table des matières** : Widget de navigation interne au document.
- [x] **Export PDF** : Première version de l'export pour partage.

## Phase 2 : Connexion & Organisation (Moyen Terme)
*Objectif : Transformer une collection de fichiers MD en un système de connaissances cohérent.*

- [x] **Recherche Globale** : Indexation et recherche rapide dans tout le projet.
- [x] **Backlinks & Wiki-links** : Navigation entre les fichiers facilitée.
- [x] **Système de Templates** : Bibliothèque de modèles (RFC, User Stories).
- [x] **Support YAML Frontmatter** : Pour ajouter des métadonnées aux specs (Status, Owner, Priority).

## Phase 3 : Intelligence Artificielle & Automatisation (Long Terme)
*Objectif : Utiliser l'IA pour l'aide à la conception et la réduction des erreurs.*

- [x] **Intégration IA (Configurable)** : Support multi-provider (OpenAI, Anthropic, Ollama).
- [x] **Générateur de Tests** : Création automatique de scénarios de test (Gherkin) à partir du texte.
- [x] **Vérificateur de Cohérence** : Analyse par IA pour détecter les contradictions entre specs.

## Phase 4 : Collaboration & Écosystème
*Objectif : Ouvrir l'outil au travail d'équipe et à l'intégration externe.*

- [ ] **Édition Temps Réel** : Support du multi-utilisateur via Y.js.
- [ ] **Commentaires & Annotations** : Système de feedback sur les documents.
- [ ] **Plugin CLI** : Pour valider les liens ou extraire des données en CI/CD.
