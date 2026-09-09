import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosConfig';

const DriverContext = createContext(null);

const formatDriver = (d) => ({
  id: String(d.id),
  appUserId: d.appUserId ? String(d.appUserId) : null,
  username: d.username || '',
  name: d.name || `${d.firstName} ${d.lastName}`,
  vehicle: d.vehicle || 'MOTO',
  zone: d.zone || 'Non spécifié',
  status: ['EN_LIVRAISON', 'IN_DELIVERY'].includes(d.status)
    ? 'En livraison'
    : ['HORS_LIGNE', 'OFFLINE', 'INACTIVE'].includes(d.status)
      ? 'Hors ligne'
      : 'Disponible',
  deliveries: d.deliveries || 0,
  revenue: d.revenue || 0,
  rating: d.rating || 5.0,
  email: d.email || '',
  username: d.username || ''
});

const formatOrder = (o) => {
  let orderStatus = 'En attente';
  if (o.status === 'CONFIRMÉE') {
    orderStatus = o.livreur ? 'Affectée' : 'Acceptée';
  }
  if (o.status === 'EN_LIVRAISON') {
    orderStatus = 'En livraison';
  }
  if (o.status === 'LIVRÉE') orderStatus = 'Livrée';
  if (o.status === 'ANNULÉE') orderStatus = 'Annulée';
  if (o.status === 'RETOURNÉE') orderStatus = 'Retournée';

  return {
    id: String(o.id),
    client: o.clientUsername || o.client?.username || 'Client',
    address: o.deliveryAddress || 'Adresse',
    amount: `${o.totalPrice || o.totalAmount || 0} MAD`,
    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Aujourd'hui",
    status: orderStatus,
    driverAccepted: o.driverAccepted,
    driverId: o.livreur?.id ? String(o.livreur.id) : null,
    progress: o.status === 'LIVRÉE' ? 100 : (o.status === 'EN_LIVRAISON') ? 60 : (o.status === 'CONFIRMÉE' && o.livreur) ? 30 : 0,
    lat: o.latitude,
    lng: o.longitude,
    eta: o.status === 'EN_LIVRAISON' ? '--' : '--',
    phone: o.contactPhone || o.client?.phoneNumber || '',
    // Produits de la commande
    items: (o.items || []).map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        imageUrl: item.product.imageUrl || item.product.image || item.product.imageUrls?.[0] || null,
        price: item.product.price,
        // ── Dépôt de stockage ──
        depotAddress: item.product.depotAddress || null,
        depotLatitude: item.product.depotLatitude || null,
        depotLongitude: item.product.depotLongitude || null,
      } : null,
    })),
  };
};

export const DriverProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const setOnlineOnLogin = useCallback(async () => {
    if (!user || isAdmin) return;
    try {
      // /me/online met lastSeenAt à jour immédiatement (contrairement à /me/status
      // qui exige que le livreur soit déjà "online", donc échoue toujours au premier login)
      await api.post('/api/drivers/me/online');
    } catch (err) {
      console.warn('Impossible de passer en ligne automatiquement:', err);
    }
  }, [user, isAdmin]);

  const sendHeartbeat = useCallback(async () => {
    if (!user || isAdmin) return;
    try {
      let coords = null;
      if (navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }
      await api.patch('/api/drivers/me/location', coords || {});
    } catch (err) {
      console.warn('Heartbeat livreur échoué:', err);
    }
  }, [user, isAdmin]);

  const reloadProfile = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const res = await api.get('/api/drivers');
        const formatted = res.data.map(formatDriver);
        setAvailableDrivers(formatted);
        setSelectedDriver(prev => formatted.find(d => d.id === prev?.id) || formatted[0] || null);
      } else {
        const res = await api.get('/api/drivers/me');
        const driver = formatDriver(res.data);
        setSelectedDriver(driver);
      }
    } catch (err) {
      console.error("Erreur de rechargement du profil:", err);
    }
  }, [user, isAdmin]);

  const reloadOrders = useCallback(async () => {
    if (!selectedDriver) return;
    try {
      let apiOrders = [];
      if (isAdmin) {
        const res = await api.get('/api/admin/orders');
        apiOrders = (res.data?.data || res.data || []).filter(o => 
          (o.livreur?.id && selectedDriver.appUserId && String(o.livreur.id) === String(selectedDriver.appUserId)) || 
          (o.livreur?.username && selectedDriver.username && o.livreur.username === selectedDriver.username)
        );
      } else {
        const res = await api.get('/api/delivery/orders');
        apiOrders = res.data?.data || res.data || [];
      }
      const formatted = apiOrders.map(formatOrder);
      setOrders(formatted);
      setSelectedOrder(prev => (prev && formatted.find(o => o.id === prev.id)) || null);
    } catch (err) {
      console.error("Erreur de chargement des commandes du livreur:", err);
    }
  }, [selectedDriver, isAdmin]);

  const handlePresenceChange = async (newStatus) => {
    if (!selectedDriver) return;
    try {
      let dbStatus = 'DISPONIBLE';
      if (newStatus === 'En livraison') dbStatus = 'EN_LIVRAISON';
      if (newStatus === 'Hors ligne') dbStatus = 'HORS_LIGNE';
      const res = await api.patch(`/api/drivers/${selectedDriver.id}/status`, { status: dbStatus });
      setSelectedDriver(formatDriver(res.data));
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de présence : " + (err.response?.data?.message || err.message));
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    await api.post(`/api/delivery/orders/${orderId}/status?status=${status}`);
    await reloadOrders();
    await reloadProfile();
  };

  const acceptOrder = async (orderId) => {
    await api.patch(`/api/delivery/orders/${orderId}/accept`);
    await reloadOrders();
    await reloadProfile();
  };

  useEffect(() => {
    if (user && !isAdmin) {
      setOnlineOnLogin().then(() => reloadProfile());

      const heartbeatInterval = setInterval(sendHeartbeat, 60000); // < seuil de 3 min côté backend

      const goOffline = () => {
        const token = localStorage.getItem('token');
        const base = process.env.REACT_APP_API_URL || 'http://localhost:8082';
        fetch(`${base}/api/drivers/me/offline`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          keepalive: true,
        }).catch(() => { });
      };
      window.addEventListener('beforeunload', goOffline);

      return () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener('beforeunload', goOffline);
      };
    } else {
      reloadProfile();
    }
  }, [user]);
  useEffect(() => { reloadOrders(); }, [selectedDriver]);

  const value = {
    availableDrivers, selectedDriver, setSelectedDriver,
    orders, selectedOrder, setSelectedOrder,
    reloadProfile, reloadOrders, handlePresenceChange, updateOrderStatus, acceptOrder,
    isAdmin
  };

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
};

export const useDriver = () => {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used within DriverProvider');
  return ctx;
};

export default DriverContext;