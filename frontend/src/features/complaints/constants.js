export const COMPLAINT_TYPES = [
  { value: 'LIVRAISON', label: 'Problème de livraison' },
  { value: 'PRODUIT', label: 'Produit défectueux ou incorrect' },
  { value: 'SERVICE', label: 'Service client' },
  { value: 'PAIEMENT', label: 'Problème de paiement' },
  { value: 'AUTRE', label: 'Autre' },
];

export const COMPLAINT_SEVERITIES = [
  { value: 'FAIBLE', label: 'Faible' },
  { value: 'MOYENNE', label: 'Moyenne' },
  { value: 'ELEVEE', label: 'Élevée' },
];

export const COMPLAINT_STATUSES = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'RESOLU', label: 'Résolu' },
  { value: 'REJETE', label: 'Rejeté' },
];

export const STATUS_META = {
  EN_ATTENTE: { label: 'En attente', color: '#f3b137', bg: 'rgba(243,177,55,0.12)' },
  EN_COURS: { label: 'En cours', color: '#f48c06', bg: 'rgba(244,140,6,0.12)' },
  RESOLU: { label: 'Résolu', color: '#50afa8', bg: 'rgba(80,175,168,0.12)' },
  REJETE: { label: 'Rejeté', color: '#e07070', bg: 'rgba(224,112,112,0.12)' },
};

export const SEVERITY_META = {
  FAIBLE: { label: 'Faible', color: '#50afa8', bg: 'rgba(80,175,168,0.12)' },
  MOYENNE: { label: 'Moyenne', color: '#f3b137', bg: 'rgba(243,177,55,0.12)' },
  ELEVEE: { label: 'Élevée', color: '#e07070', bg: 'rgba(224,112,112,0.12)' },
};

export const TYPE_LABELS = Object.fromEntries(COMPLAINT_TYPES.map((t) => [t.value, t.label]));
