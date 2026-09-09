import api from '../api/axiosConfig';

const unwrap = (res) => res.data?.data ?? res.data;

export const DRIVER_STATUS_LABEL = {
  DISPONIBLE: 'Disponible',
  EN_LIVRAISON: 'En livraison',
  HORS_LIGNE: 'Hors ligne',
  SUSPENDU: 'Suspendu',
};

export const DRIVER_STATUS_BACKEND = {
  Disponible: 'DISPONIBLE',
  'En livraison': 'EN_LIVRAISON',
  'Hors ligne': 'HORS_LIGNE',
};

export function mapBackendOrder(o) {
  let uiStatus = 'En attente';
  let progress = 20;

  if (o.status === 'EN_LIVRAISON') {
    uiStatus = o.driverAccepted ? 'En route' : 'Acceptée';
    progress = o.driverAccepted ? 70 : 35;
  } else if (o.status === 'LIVRÉE') {
    uiStatus = 'Livrée';
    progress = 100;
  } else if (o.status === 'ANNULÉE') {
    uiStatus = 'Retournée';
    progress = 100;
  }

  return {
    id: `#${o.id}`,
    rawId: o.id,
    client: o.clientUsername,
    address: o.deliveryAddress || 'Adresse non spécifiée',
    amount: `${Number(o.totalPrice || 0).toFixed(2)} DH`,
    status: uiStatus,
    backendStatus: o.status,
    driverAccepted: !!o.driverAccepted,
    latitude: o.latitude,
    longitude: o.longitude,
    merchantLatitude: o.merchantLatitude,
    merchantLongitude: o.merchantLongitude,
    contactPhone: o.contactPhone,
    progress,
    eta: o.status === 'EN_LIVRAISON' ? '15 min' : '--',
    date: o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : "Aujourd'hui",
  };
}

export function mapBackendDriver(d) {
  const online = d.online === true;
  let backendStatus = d.status;
  if (backendStatus !== 'SUSPENDU' && !online) {
    backendStatus = 'HORS_LIGNE';
  } else if (online && backendStatus !== 'SUSPENDU' && (d.currentOrdersCount ?? 0) > 0) {
    backendStatus = 'EN_LIVRAISON';
  } else if (online && backendStatus !== 'SUSPENDU' && backendStatus !== 'EN_LIVRAISON') {
    backendStatus = 'DISPONIBLE';
  }

  return {
    id: d.id,
    appUserId: d.appUserId,
    name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.username,
    username: d.username,
    vehicle: d.vehicle || 'MOTO',
    zone: d.zone || 'Non spécifié',
    status: DRIVER_STATUS_LABEL[backendStatus] || backendStatus,
    backendStatus,
    deliveries: d.deliveries ?? 0,
    revenue: d.revenue ?? 0,
    rating: d.rating ?? 5,
    currentLatitude: d.currentLatitude,
    currentLongitude: d.currentLongitude,
    currentOrdersCount: d.currentOrdersCount ?? 0,
    maxCapacity: d.maxCapacity ?? 3,
    online,
    lastSeenAt: d.lastSeenAt,
  };
}

export async function fetchMyDriverProfile() {
  const res = await api.get('/api/drivers/me');
  return mapBackendDriver(res.data);
}

export async function fetchAllDrivers() {
  const res = await api.get('/api/drivers');
  return (res.data || []).map(mapBackendDriver);
}

export async function fetchMyDeliveryOrders({ isAdmin = false, appUserId = null } = {}) {
  if (isAdmin && appUserId) {
    const res = await api.get('/api/admin/orders');
    const orders = (unwrap(res) || []).filter((o) => o.livreur?.id === appUserId);
    return orders.map(mapBackendOrder);
  }
  const res = await api.get('/api/delivery/orders');
  return (unwrap(res) || []).map(mapBackendOrder);
}

export async function acceptOrder(orderId) {
  const res = await api.patch(`/api/delivery/orders/${orderId}/accept`);
  return unwrap(res);
}

export async function markOrderDelivered(orderId) {
  const res = await api.post(`/api/delivery/orders/${orderId}/deliver`);
  return unwrap(res);
}

export async function markDriverOnline() {
  const res = await api.post('/api/drivers/me/online');
  return mapBackendDriver(res.data);
}

export async function markDriverOffline() {
  await api.post('/api/drivers/me/offline');
}

export async function updateMyStatus(statusBackend) {
  const res = await api.patch('/api/drivers/me/status', { status: statusBackend });
  return mapBackendDriver(res.data);
}

export async function updateDriverLocation(driverId, latitude, longitude) {
  await api.patch(`/api/drivers/${driverId}/location`, { latitude, longitude });
}

export async function fetchPendingOrders() {
  const res = await api.get('/api/admin/orders/pending');
  return unwrap(res) || [];
}

export async function retryAutoAssign(orderId) {
  const res = await api.post(`/api/admin/orders/${orderId}/retry-assign`);
  return res.data;
}

export function getOrdersForDriver(orders, driverAppUserId) {
  if (!driverAppUserId || !Array.isArray(orders)) return [];
  return orders.filter((o) => o.livreur?.id === driverAppUserId);
}

export const ZONE_COORDS = {
  'Rabat Centre': { latitude: 34.0209, longitude: -6.8416 },
  Agdal: { latitude: 33.9747, longitude: -6.8497 },
  'Hay Riad': { latitude: 33.9596, longitude: -6.8704 },
  Souissi: { latitude: 33.959, longitude: -6.852 },
  Casablanca: { latitude: 33.5731, longitude: -7.5898 },
  Maarif: { latitude: 33.589, longitude: -7.637 },
  Marrakech: { latitude: 31.6295, longitude: -7.9811 },
  Gueliz: { latitude: 31.634, longitude: -8.0089 },
};

export function resolveZoneCoords(zone) {
  if (!zone) return null;
  const normalized = zone.trim().toLowerCase();
  const exact = Object.entries(ZONE_COORDS).find(([name]) => name.toLowerCase() === normalized);
  if (exact) return exact[1];
  const partial = Object.entries(ZONE_COORDS).find(([name]) =>
    normalized.includes(name.toLowerCase()) || name.toLowerCase().includes(normalized)
  );
  return partial ? partial[1] : null;
}

export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
