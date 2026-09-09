// src/Admin/data/driversStore.js
// Store local pour les données non encore gérées par le backend :
// paiements des livreurs, réclamations clients, simulation de livraison.

// ── Paiements ────────────────────────────────────────────────────────────────
let payments = [
    { id: 'PAY-001', driverId: '1', driverName: 'Yassine Benali', period: 'Juin 2026', deliveries: 12, amount: 120, status: 'En attente' },
    { id: 'PAY-002', driverId: '2', driverName: 'Sara Alaoui', period: 'Juin 2026', deliveries: 8, amount: 80, status: 'En attente' },
    { id: 'PAY-003', driverId: '3', driverName: 'Mehdi Tazi', period: 'Mai 2026', deliveries: 21, amount: 210, status: 'Validé' },
    { id: 'PAY-004', driverId: '4', driverName: 'Fatima Zahra', period: 'Mai 2026', deliveries: 15, amount: 150, status: 'Validé' },
];

export const getPayments = () => [...payments];

export const validatePayment = (payId) => {
    payments = payments.map(p =>
        p.id === payId ? { ...p, status: 'Validé' } : p
    );
};

// ── Réclamations ─────────────────────────────────────────────────────────────
let complaints = [
    {
        id: 'REC-001',
        driverId: '1',
        driverName: 'Yassine Benali',
        type: 'Colis endommagé',
        detail: 'Le client a reçu sa commande avec l emballage déchiré et un produit cassé.',
        severity: 'Élevée',
        date: '18/06/2026',
        status: 'En attente',
    },
    {
        id: 'REC-002',
        driverId: '2',
        driverName: 'Sara Alaoui',
        type: 'Retard important',
        detail: 'Livraison effectuée avec 2h de retard sans notification préalable.',
        severity: 'Moyenne',
        date: '17/06/2026',
        status: 'En attente',
    },
    {
        id: 'REC-003',
        driverId: '3',
        driverName: 'Mehdi Tazi',
        type: 'Comportement irrespectueux',
        detail: 'Le client signale un ton agressif lors de la remise du colis.',
        severity: 'Élevée',
        date: '15/06/2026',
        status: 'Résolu',
    },
];

export const getComplaints = () => [...complaints];

export const resolveComplaint = (recId) => {
    complaints = complaints.map(c =>
        c.id === recId ? { ...c, status: 'Résolu' } : c
    );
};

// ── Simulation de livraison ───────────────────────────────────────────────────
// Avance artificiellement la progression des livraisons actives (usage démo).
// Retourne { updated: true } si un changement a eu lieu.
let simulationStep = 0;

export const advanceDeliverySimulation = () => {
    simulationStep += 1;
    // On signale une mise à jour toutes les 2 étapes pour ne pas surcharger
    const updated = simulationStep % 2 === 0;
    return { updated };
};

export const resetSimulation = () => {
    simulationStep = 0;
};