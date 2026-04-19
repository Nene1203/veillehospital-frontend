# VeilleHospital — Plateforme de suivi des veilles hospitalières

Application React permettant la gestion centralisée des saisies de veilles hospitalières et la visualisation des KPIs.

## Structure du projet

```
src/
├── App.jsx                  # Composant racine + navigation
├── index.jsx                # Point d'entrée React
├── styles.css               # Styles globaux (variables CSS, composants)
├── components/
│   └── Sidebar.jsx          # Barre de navigation latérale
├── pages/
│   ├── Accueil.jsx          # Page d'accueil avec actions rapides
│   ├── Dashboard.jsx        # Dashboard avec KPIs, graphiques et filtres
│   └── Saisie.jsx           # Formulaire de saisie patients (tableau)
└── data/
    └── mockData.js          # Données de démonstration et constantes
```

## Installation et démarrage

### Prérequis
- Node.js >= 18
- npm ou yarn

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:5173
```

### Build de production

```bash
npm run build
npm run preview
```

## Fonctionnalités

### Page d'accueil
- Statistiques rapides de la campagne en cours
- Raccourcis vers la saisie et le dashboard
- Historique de l'activité récente
- Liste des campagnes en cours et passées

### Dashboard
- **8 KPIs** : hospitalisations, durée moyenne de séjour, attente avant opération, taux de remplissage, patients sortis/présents, transferts, réhospitalisations
- **Filtres dynamiques** : par établissement et par période (semaine / mois / année)
- **5 graphiques** : évolution temporelle (ligne), pathologies (donut), durée séjour par établissement (barre), attente avant op (barre), statuts des patients (donut)
- **Tableau détaillé** par établissement avec tous les indicateurs

### Formulaire de saisie
- Métadonnées de campagne : établissement, responsable, semaine, date
- **Tableau patient** avec toutes les colonnes :
  - Identité : nom, prénom, âge, chambre
  - Médical : pathologie, opération subie
  - Temporel : date d'entrée, date de sortie, **durée calculée automatiquement**
  - Opératoire : temps d'attente avant op., temps après op.
  - Logistique : mode d'entrée, statut, destination de sortie, réhospitalisation
- Ajout/suppression de lignes
- Statistiques calculées en temps réel

## Prochaines étapes recommandées

1. **Backend** : connecter une API FastAPI (Python) ou Supabase
2. **Authentification** : login par établissement (JWT ou Supabase Auth)
3. **Base de données** : PostgreSQL pour stocker les saisies
4. **Export** : génération Excel/CSV des données saisies
5. **Notifications** : alertes pour les saisies en retard
