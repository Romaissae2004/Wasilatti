// Fichier de stockage et de simulation pour la gestion des livreurs
// Gère la persistance locale via localStorage et simule les comportements d'API.

const DEFAULT_DRIVERS = [
  {
    id: "LVR001",
    name: "Ahmed Tazi",
    phone: "+212 661-234567",
    cin: "JM12345",
    email: "ahmed.tazi@wasilatti.ma",
    adresse: "Hay Riad, Rabat",
    vehicle: "Moto",
    zone: "Rabat Centre",
    status: "Disponible", // Disponible, En livraison, Hors ligne, Suspendu
    deliveries: 148,
    rating: 4.8,
    revenue: 1480,
    photo: null
  },
  {
    id: "LVR002",
    name: "Yassine Mansouri",
    phone: "+212 662-789012",
    cin: "G678901",
    email: "yassine.m@wasilatti.ma",
    adresse: "Gueliz, Marrakech",
    vehicle: "Moto",
    zone: "Marrakech Medina",
    status: "En livraison",
    deliveries: 92,
    rating: 4.6,
    revenue: 920,
    photo: null
  },
  {
    id: "LVR003",
    name: "Sara Alami",
    phone: "+212 663-456789",
    cin: "A456789",
    email: "sara.alami@wasilatti.ma",
    adresse: "Maarif, Casablanca",
    vehicle: "Voiture",
    zone: "Casablanca Anfa",
    status: "Hors ligne",
    deliveries: 215,
    rating: 4.9,
    revenue: 2150,
    photo: null
  },
  {
    id: "LVR004",
    name: "Omar Bennani",
    phone: "+212 664-012345",
    cin: "K345678",
    email: "omar.b@wasilatti.ma",
    adresse: "Agdal, Rabat",
    vehicle: "Vélo",
    zone: "Rabat Agdal",
    status: "Suspendu",
    deliveries: 34,
    rating: 3.5,
    revenue: 340,
    photo: null
  }
];

const DEFAULT_ORDERS = [
  {
    id: "CMD-881",
    client: "Meryem Khabazi",
    address: "Agdal Rue 12, Rabat",
    amount: "150 MAD",
    date: "Aujourd'hui, 14:10",
    status: "En attente", // En attente, Acceptée, Récupération, En route, Livrée
    driverId: null,
    progress: 0,
    lat: 10,
    lng: 20,
    eta: "--"
  },
  {
    id: "CMD-882",
    client: "Khalid Jamil",
    address: "Hay Riad Ave Mohammed VI, Rabat",
    amount: "85 MAD",
    date: "Aujourd'hui, 14:25",
    status: "En attente",
    driverId: null,
    progress: 0,
    lat: 30,
    lng: 15,
    eta: "--"
  },
  {
    id: "CMD-883",
    client: "Nadia Fassi",
    address: "Souissi Villa 4, Rabat",
    amount: "430 MAD",
    date: "Aujourd'hui, 14:40",
    status: "En attente",
    driverId: null,
    progress: 0,
    lat: 80,
    lng: 40,
    eta: "--"
  },
  {
    id: "CMD-879",
    client: "Youssef Alaoui",
    address: "Medina Rue Souk, Marrakech",
    amount: "120 MAD",
    date: "Aujourd'hui, 13:55",
    status: "En route",
    driverId: "LVR002",
    progress: 60,
    lat: 160,
    lng: 45,
    eta: "6 min"
  }
];

const DEFAULT_COMPLAINTS = [
  {
    id: "REC-001",
    client: "Fatima Z.",
    driverId: "LVR004",
    driverName: "Omar Bennani",
    type: "Retard important",
    detail: "Le livreur est arrivé avec plus de 45 minutes de retard sans prévenir.",
    date: "28/05/2026",
    status: "En attente", // En attente, Résolu
    severity: "Moyenne"
  },
  {
    id: "REC-002",
    client: "Anass M.",
    driverId: "LVR001",
    driverName: "Ahmed Tazi",
    type: "Commande endommagée",
    detail: "La boîte à pizza était complètement renversée dans le sac de livraison.",
    date: "29/05/2026",
    status: "En attente",
    severity: "Élevée"
  }
];

const DEFAULT_PAYMENTS = [
  {
    id: "PAY-001",
    driverId: "LVR001",
    driverName: "Ahmed Tazi",
    period: "Mai 2026",
    deliveries: 45,
    amount: 450, // 45 * 10 DH
    status: "Validé", // En attente, Validé
    date: "25/05/2026"
  },
  {
    id: "PAY-002",
    driverId: "LVR002",
    driverName: "Yassine Mansouri",
    period: "Mai 2026",
    deliveries: 38,
    amount: 380,
    status: "En attente",
    date: "--"
  },
  {
    id: "PAY-003",
    driverId: "LVR003",
    driverName: "Sara Alami",
    period: "Mai 2026",
    deliveries: 62,
    amount: 620,
    status: "Validé",
    date: "26/05/2026"
  }
];

// Initialise le localStorage si vide
function initializeStorage() {
  if (!localStorage.getItem("wsl_drivers")) {
    localStorage.setItem("wsl_drivers", JSON.stringify(DEFAULT_DRIVERS));
  }
  if (!localStorage.getItem("wsl_orders")) {
    localStorage.setItem("wsl_orders", JSON.stringify(DEFAULT_ORDERS));
  }
  if (!localStorage.getItem("wsl_complaints")) {
    localStorage.setItem("wsl_complaints", JSON.stringify(DEFAULT_COMPLAINTS));
  }
  if (!localStorage.getItem("wsl_payments")) {
    localStorage.setItem("wsl_payments", JSON.stringify(DEFAULT_PAYMENTS));
  }
}

// Chargeurs et Sauvegardes génériques
export const getDrivers = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem("wsl_drivers"));
};

export const saveDrivers = (drivers) => {
  localStorage.setItem("wsl_drivers", JSON.stringify(drivers));
};

export const getOrders = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem("wsl_orders"));
};

export const saveOrders = (orders) => {
  localStorage.setItem("wsl_orders", JSON.stringify(orders));
};

export const getComplaints = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem("wsl_complaints"));
};

export const saveComplaints = (complaints) => {
  localStorage.setItem("wsl_complaints", JSON.stringify(complaints));
};

export const getPayments = () => {
  initializeStorage();
  const rawPayments = JSON.parse(localStorage.getItem("wsl_payments")) || [];
  const drivers = getDrivers() || [];
  
  // 1. Delete payments for non-existing drivers (ghost drivers)
  const validPayments = rawPayments.filter(p => drivers.some(d => String(d.id) === String(p.driverId)));
  
  // 2. Synchronize existing drivers' payments
  const now = new Date();
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const dynamicPeriod = `${months[now.getMonth()]} ${now.getFullYear()}`;
  
  const updatedPayments = [...validPayments];
  
  drivers.forEach(driver => {
    const driverPayments = updatedPayments.filter(p => String(p.driverId) === String(driver.id));
    if (driverPayments.length === 0) {
      // Create a payment record for the current period
      const newPayment = {
        id: `PAY-${String(updatedPayments.length + 1).padStart(3, "0")}`,
        driverId: String(driver.id),
        driverName: driver.name,
        period: dynamicPeriod,
        deliveries: driver.deliveries || 0,
        amount: driver.revenue || 0,
        status: "En attente",
        phone: driver.phone || null,
        iban: "MA6400012345678901234567"
      };
      updatedPayments.push(newPayment);
    } else {
      // Update existing payment(s)
      driverPayments.forEach(p => {
        p.driverName = driver.name;
        p.phone = driver.phone;
        if (p.period === dynamicPeriod || driverPayments.length === 1) {
          p.deliveries = driver.deliveries || 0;
          p.amount = driver.revenue || 0;
        }
      });
    }
  });
  
  localStorage.setItem("wsl_payments", JSON.stringify(updatedPayments));
  return updatedPayments;
};

export const savePayments = (payments) => {
  localStorage.setItem("wsl_payments", JSON.stringify(payments));
};

// --- SERVICES DE LIVREURS ---

export const addDriver = (driverData) => {
  const drivers = getDrivers();
  const newId = `LVR${String(drivers.length + 1).padStart(3, "0")}`;
  const newDriver = {
    id: newId,
    name: `${driverData.firstName} ${driverData.lastName}`,
    phone: driverData.phone,
    cin: driverData.cin,
    email: driverData.email,
    adresse: driverData.adresse,
    vehicle: driverData.vehicle || "Moto",
    zone: driverData.zone,
    status: "Disponible",
    deliveries: 0,
    rating: 5.0,
    revenue: 0,
    photo: driverData.photo || null
  };
  drivers.push(newDriver);
  saveDrivers(drivers);

  // Générer aussi une ligne de paiement en attente pour lui
  const payments = getPayments();
  payments.push({
    id: `PAY-${String(payments.length + 1).padStart(3, "0")}`,
    driverId: newId,
    driverName: newDriver.name,
    period: "En cours",
    deliveries: 0,
    amount: 0,
    status: "En attente",
    date: "--"
  });
  savePayments(payments);

  return { driver: newDriver, password: driverData.password || "Wsl@2026!" };
};

export const updateDriver = (id, updatedFields) => {
  const drivers = getDrivers();
  const index = drivers.findIndex(d => d.id === id);
  if (index !== -1) {
    drivers[index] = { ...drivers[index], ...updatedFields };
    saveDrivers(drivers);
    return drivers[index];
  }
  return null;
};

export const deleteDriver = (id) => {
  const drivers = getDrivers();
  const updated = drivers.filter(d => d.id !== id);
  saveDrivers(updated);
  return true;
};

// --- SERVICES D'AFFECTATION ---

export const assignOrder = (orderId, driverId) => {
  const orders = getOrders();
  const drivers = getDrivers();
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  const driverIndex = drivers.findIndex(d => d.id === driverId);

  if (orderIndex !== -1 && driverIndex !== -1) {
    const driver = drivers[driverIndex];
    
    // Mettre à jour l'ordre
    orders[orderIndex].driverId = driverId;
    orders[orderIndex].status = "Acceptée";
    orders[orderIndex].progress = 10;
    orders[orderIndex].eta = "15 min";
    
    // Mettre à jour la coordonnée initiale du livreur sur la mini carte SVG
    orders[orderIndex].lat = Math.floor(Math.random() * 200) + 20;
    orders[orderIndex].lng = Math.floor(Math.random() * 80) + 10;

    // Mettre à jour le livreur en "En livraison"
    drivers[driverIndex].status = "En livraison";

    saveOrders(orders);
    saveDrivers(drivers);
    return { order: orders[orderIndex], driver };
  }
  return null;
};

// Simulation d'affectation automatique
export const autoAssignOrder = (orderId) => {
  const drivers = getDrivers();
  // Trouver un livreur disponible
  const availableDriver = drivers.find(d => d.status === "Disponible");
  
  if (availableDriver) {
    return assignOrder(orderId, availableDriver.id);
  }
  return null;
};

// --- SIMULATION DU TRAJET EN DIRECT ---

export const advanceDeliverySimulation = () => {
  const orders = getOrders();
  const drivers = getDrivers();
  let updatedCount = 0;

  const newOrders = orders.map(order => {
    if (order.driverId && order.status !== "Livrée" && order.status !== "En attente") {
      updatedCount++;
      const currentProgress = order.progress;
      let nextProgress = currentProgress + 15;
      let nextStatus = order.status;
      let nextEta = order.eta;

      // Changer les états selon la progression
      if (nextProgress >= 100) {
        nextProgress = 100;
        nextStatus = "Livrée";
        nextEta = "Livre !";

        // Mettre à jour le livreur : incrémenter livraisons et gains (10 DH par livraison)
        const driverIdx = drivers.findIndex(d => d.id === order.driverId);
        if (driverIdx !== -1) {
          drivers[driverIdx].deliveries += 1;
          drivers[driverIdx].revenue += 10;
          drivers[driverIdx].status = "Disponible"; // Redeveint disponible

          // Mettre à jour le récapitulatif des paiements
          const payments = getPayments();
          const pIdx = payments.findIndex(p => p.driverId === order.driverId && p.status === "En attente");
          if (pIdx !== -1) {
            payments[pIdx].deliveries += 1;
            payments[pIdx].amount += 10;
          } else {
            payments.push({
              id: `PAY-${String(payments.length + 1).padStart(3, "0")}`,
              driverId: order.driverId,
              driverName: drivers[driverIdx].name,
              period: "En cours",
              deliveries: 1,
              amount: 10,
              status: "En attente",
              date: "--"
            });
          }
          savePayments(payments);
        }
      } else if (nextProgress > 70) {
        nextStatus = "En route";
        nextEta = "3 min";
      } else if (nextProgress > 30) {
        nextStatus = "En cours de récupération";
        nextEta = "9 min";
      }

      // Faire bouger aléatoirement les coordonnées GPS sur le SVG
      const nextLat = order.lat + (Math.random() * 20 - 5);
      const nextLng = order.lng + (Math.random() * 10 - 2);

      return {
        ...order,
        progress: nextProgress,
        status: nextStatus,
        eta: nextEta,
        lat: Math.min(Math.max(nextLat, 10), 230), // Bornes de carte SVG
        lng: Math.min(Math.max(nextLng, 10), 90)
      };
    }
    return order;
  });

  if (updatedCount > 0) {
    saveOrders(newOrders);
    saveDrivers(drivers);
  }

  return { orders: newOrders, drivers, updated: updatedCount > 0 };
};

// --- SERVICES DE PAIEMENTS ---

export const validatePayment = (paymentId) => {
  const payments = getPayments();
  const idx = payments.findIndex(p => p.id === paymentId);
  if (idx !== -1) {
    payments[idx].status = "Validé";
    payments[idx].date = new Date().toLocaleDateString("fr-FR");
    savePayments(payments);
    return payments[idx];
  }
  return null;
};

// --- SERVICES DE RECLAMATIONS ---

export const addComplaint = (complaintData) => {
  const complaints = getComplaints();
  const drivers = getDrivers();
  const driver = drivers.find(d => d.id === complaintData.driverId);

  const newComplaint = {
    id: `REC-${String(complaints.length + 1).padStart(3, "0")}`,
    client: complaintData.client,
    driverId: complaintData.driverId,
    driverName: driver ? driver.name : "Inconnu",
    type: complaintData.type,
    detail: complaintData.detail,
    date: new Date().toLocaleDateString("fr-FR"),
    status: "En attente",
    severity: complaintData.severity || "Moyenne"
  };

  complaints.push(newComplaint);
  saveComplaints(complaints);

  // Mettre à jour la note du livreur (baisse légère si plainte grave)
  if (driver) {
    const driverIdx = drivers.findIndex(d => d.id === complaintData.driverId);
    let penalty = 0.1;
    if (complaintData.severity === "Élevée") penalty = 0.3;
    drivers[driverIdx].rating = Math.max(1.0, parseFloat((drivers[driverIdx].rating - penalty).toFixed(1)));
    saveDrivers(drivers);
  }

  return newComplaint;
};

export const resolveComplaint = (complaintId) => {
  const complaints = getComplaints();
  const idx = complaints.findIndex(c => c.id === complaintId);
  if (idx !== -1) {
    complaints[idx].status = "Résolu";
    saveComplaints(complaints);
    return complaints[idx];
  }
  return null;
};

// --- SERVICES DÉDIÉS AUX LIVREURS CONNECTÉS ---

export const getDriverByEmail = (email) => {
  const drivers = getDrivers();
  return drivers.find(d => d.email?.toLowerCase() === email?.toLowerCase());
};

export const getOrdersByDriver = (driverId) => {
  const orders = getOrders();
  return orders.filter(o => o.driverId === driverId);
};

export const updateOrderStatus = (orderId, status, progress, eta) => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = status;
    orders[idx].progress = progress;
    if (eta !== undefined) orders[idx].eta = eta;
    saveOrders(orders);
    return orders[idx];
  }
  return null;
};

export const confirmDelivery = (orderId) => {
  const orders = getOrders();
  const drivers = getDrivers();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    const order = orders[idx];
    order.status = "Livrée";
    order.progress = 100;
    order.eta = "Livrée !";

    if (order.driverId) {
      const driverIdx = drivers.findIndex(d => d.id === order.driverId);
      if (driverIdx !== -1) {
        drivers[driverIdx].deliveries += 1;
        drivers[driverIdx].revenue += 10;
        drivers[driverIdx].status = "Disponible"; // Redeveint disponible
      }

      // Mettre à jour le récapitulatif des paiements
      const payments = getPayments();
      const pIdx = payments.findIndex(p => p.driverId === order.driverId && p.status === "En attente");
      if (pIdx !== -1) {
        payments[pIdx].deliveries += 1;
        payments[pIdx].amount += 10;
      } else {
        payments.push({
          id: `PAY-${String(payments.length + 1).padStart(3, "0")}`,
          driverId: order.driverId,
          driverName: drivers[driverIdx]?.name || "Livreur",
          period: "En cours",
          deliveries: 1,
          amount: 10,
          status: "En attente",
          date: "--"
        });
      }
      savePayments(payments);
    }
    saveOrders(orders);
    saveDrivers(drivers);
    return order;
  }
  return null;
};

export const returnDelivery = (orderId, reason) => {
  const orders = getOrders();
  const drivers = getDrivers();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    const order = orders[idx];
    order.status = "Retournée";
    order.progress = 100;
    order.eta = "--";
    order.returnReason = reason;

    if (order.driverId) {
      const driverIdx = drivers.findIndex(d => d.id === order.driverId);
      if (driverIdx !== -1) {
        drivers[driverIdx].status = "Disponible"; // Redevient disponible après retour
      }
    }
    saveOrders(orders);
    saveDrivers(drivers);
    return order;
  }
  return null;
};
