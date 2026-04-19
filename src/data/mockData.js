export const ETABLISSEMENTS = [
  "Résidence du Parc",
  "Les Jardins d'Automne",
  "Villa Soleil",
  "Maison de repos Nord",
  "Résidence Belle-Vue",
];

export const ETAB_DATA = [
  { nom: "Résidence du Parc", hospit: 12, duree: 5.8, attente: 1.8, tauxRemplissage: 88, sortis: 9, transferts: 1, rehospit: 1, statut: "Complété" },
  { nom: "Les Jardins d'Automne", hospit: 8, duree: 6.1, attente: 2.3, tauxRemplissage: 79, sortis: 5, transferts: 1, rehospit: 0, statut: "Complété" },
  { nom: "Villa Soleil", hospit: 15, duree: 7.2, attente: 2.5, tauxRemplissage: 91, sortis: 10, transferts: 1, rehospit: 2, statut: "À valider" },
  { nom: "Maison de repos Nord", hospit: 7, duree: 5.4, attente: 1.9, tauxRemplissage: 74, sortis: 5, transferts: 0, rehospit: 1, statut: "En attente" },
  { nom: "Résidence Belle-Vue", hospit: 5, duree: 5.9, attente: 2.0, tauxRemplissage: 82, sortis: 2, transferts: 0, rehospit: 0, statut: "En attente" },
];

export const PATHOLOGIES = [
  "Chute",
  "Infection respiratoire",
  "Problème cardiovasculaire",
  "AVC",
  "Fracture",
  "Troubles cognitifs",
  "Infection urinaire",
  "Diabète",
  "Autre",
];

export const MODES_ENTREE = ["Urgences", "Programmé", "Transfert", "Autre"];
export const STATUTS_PATIENT = ["Hospitalisé", "Sorti", "Transféré", "Décédé"];
export const DESTINATIONS_SORTIE = ["Domicile", "Autre EHPAD", "Hôpital", "Famille", "Décès"];

export const PATIENTS_DEFAUT = [
  {
    nom: "Dupont", prenom: "Jean", age: "82", chambre: "12A",
    pathologie: "Chute", operation: "Prothèse de hanche",
    dateEntree: "2025-03-17", dateSortie: "2025-03-23",
    attenteAvantOp: "2", tempsApresOp: "4",
    modeEntree: "Urgences", statut: "Sorti",
    destinationSortie: "Domicile", rehospitalisation: "Non",
  },
  {
    nom: "Martin", prenom: "Suzanne", age: "76", chambre: "08B",
    pathologie: "Infection respiratoire", operation: "Aucune",
    dateEntree: "2025-03-18", dateSortie: "",
    attenteAvantOp: "0", tempsApresOp: "",
    modeEntree: "Urgences", statut: "Hospitalisé",
    destinationSortie: "", rehospitalisation: "Non",
  },
  {
    nom: "Bernard", prenom: "Henri", age: "89", chambre: "15C",
    pathologie: "Problème cardiovasculaire", operation: "Pose de stent",
    dateEntree: "2025-03-19", dateSortie: "2025-03-24",
    attenteAvantOp: "1", tempsApresOp: "3",
    modeEntree: "Programmé", statut: "Sorti",
    destinationSortie: "Domicile", rehospitalisation: "Non",
  },
];

export const PERIODE_MULTIPLICATEUR = { semaine: 1, mois: 4, annee: 48 };

export const COULEURS_GRAPHIQUES = {
  blue: "#3B82F6",
  teal: "#14B8A6",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#22C55E",
  purple: "#8B5CF6",
  gray: "#9CA3AF",
  coral: "#F97316",
};
