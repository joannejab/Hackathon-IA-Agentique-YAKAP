# Contexte — Hackathon IA Agentique (GDG + Alumni) x EPITA

> Document de cadrage. Source : page événement AI Tinkerers Paris.

## L'événement

- **Nom** : Hackathon IA Agentique : (GDG + Alumni) x EPITA — AI Tinkerers Paris
- **Date** : mercredi 17 juin 2026, 13h30 → 20h30 (CEST)
- **Lieu** : 14-16 rue Voltaire, Le Kremlin-Bicêtre, 94270 (Campus EPITA/Epitech)
- **Co-organisateurs** : GDG EPITA, EPITA Alumni, AI Tinkerers Paris
- **Sponsors / partenaires** : Scalingo, EPITA, Exalt
- **Jury** : experts d'Exalt + communauté AI Tinkerers

## Thème

Passer des simples interfaces de chat à des **systèmes agentiques autonomes**.
Thème central de la grille de notation : **agentic AI appliquée à l'éducation**.

Axes priorisés par l'événement :
- **Frameworks agentiques** (LangGraph, CrewAI, AutoGen…)
- **Workflows autonomes** : tâches long-horizon sans intervention humaine
- **Outils de production** : observabilité, benchmarks, boucles de feedback
- **Modèles frontier** pour le raisonnement complexe

## ⏱️ Planning du jour (CONTRAINTE FORTE)

| Heure | Activité |
|-------|----------|
| 13h30 | Accueil, installation |
| **14h00** | **Début du hackathon — les équipes codent** |
| **17h00** | **🔴 Gel des soumissions** |
| 17h15 | Pitchs (5 min / équipe + Q&A jury) |
| 18h30 | Délibération + résultats + remise des prix |
| 19h00 | Buffet & networking |
| 20h30 | Fin |

➡️ **Fenêtre de build réelle ≈ 3 h** (14h00–17h00). Le code doit **tourner** à la démo.

## 🏋️ Grille de notation (à viser explicitement)

| Critère | Poids | Ce que le jury regarde | Comment on le coche |
|---|---|---|---|
| **Theme Alignment** | **25%** | Agentic AI + cas d'usage éducation, profondeur du design agentique | Audit continu de curriculum = pile dans le thème ; 5 agents collaboratifs |
| **Real-World Impact & Business Viability** | **20%** | Vrai problème, viabilité, clients identifiables | Écoles/universités/orga de formation paient pour rester pertinentes ; **EPITA = client dans la salle** |
| **Pitch Quality** | **20%** | Clarté, storytelling, valeur en 5 min | Démo en 2 vues (chef de majeure / prof), narratif "audit continu vs révision annuelle" |
| **Agent Autonomy** | **15%** | Décision, planning, exécution multi-étapes sans humain | Pipeline 5 agents qui s'enchaîne tout seul jusqu'au rapport validé |
| **Technical Complexity** | **10%** | Sophistication, combinaison modèles/frameworks | Multi-agents + structured outputs + agent anti-hallucination (fact-check) |
| **Code Quality & Demo** | **10%** | La démo marche, l'agent est fonctionnel | App Next.js qui tourne, données reproductibles, zéro dépendance fragile |

## Implications pour nous (décisions de cadrage)

1. **La démo doit marcher** (Code Quality + Demo = 10%, mais une démo cassée plombe Pitch 20% et Autonomy 15%). → données pré-collectées, pas de scraping live.
2. **Parler éducation ET business** dès le pitch → cibler un **vrai cursus EPITA** (le jury se reconnaît).
3. **Montrer l'autonomie** → le pipeline d'agents s'exécute de bout en bout sans intervention.
4. **Différenciateur technique** → le **5ᵉ agent Fact-Checker** (anti-hallucination) coche "observabilité / feedback loops" + "technical complexity".
5. **Hiérarchie** (chef de majeure / prof) → 2 vues = storytelling fort pour le pitch.

## Pitch — structure cible (5 min)

1. **Problème** (45s) : les programmes ont des années de retard sur le marché & l'IA.
2. **Solution** (45s) : un audit *continu* automatisé du curriculum par des agents.
3. **Démo live** (2min30) : vue Chef de majeure (heatmap des gaps) → drill dans un cours → vue Prof (rapport + modules suggérés + fact-check) → bouton Valider.
4. **Business** (45s) : qui paie (EPITA, universités, OF), pourquoi maintenant.
5. **Tech + autonomie** (15s) : 5 agents, anti-hallucination, Next.js + Claude.
