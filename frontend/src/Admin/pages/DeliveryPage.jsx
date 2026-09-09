import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import {
  fetchMyDriverProfile,
  fetchAllDrivers,
  fetchMyDeliveryOrders,
  acceptOrder,
  markOrderDelivered,
  updateMyStatus,
  markDriverOnline,
  markDriverOffline,
  updateDriverLocation,
  getBrowserLocation,
  resolveZoneCoords,
  DRIVER_STATUS_BACKEND,
} from '../../services/deliveryService';
import {
  MapPin, Phone, Package, Navigation, CheckCircle, Truck, Star, DollarSign, Clock, AlertTriangle,
} from 'lucide-react';

const cardStyle = {
  background: 'rgba(255, 253, 248, 0.95)',
  borderRadius: 16,
  border: '1px solid #ede8df',
  padding: 20,
  boxShadow: '0 2px 12px rgba(180,140,80,0.06)',
};

const DeliveryPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [driver, setDriver] = useState(null);
  const [allDrivers, setAllDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      let profile = null;
      if (isAdmin) {
        const drivers = await fetchAllDrivers();
        setAllDrivers(drivers);
        profile = drivers[0] || null;
      } else {
        profile = await fetchMyDriverProfile();
      }
      setDriver(profile);

      if (profile) {
        const list = await fetchMyDeliveryOrders({
          isAdmin,
          appUserId: profile.appUserId,
        });
        setOrders(list);
        setSelectedOrder((prev) => {
          if (!prev) return list[0] || null;
          return list.find((o) => o.rawId === prev.rawId) || list[0] || null;
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (isAdmin || !user) return undefined;

    let cancelled = false;
    markDriverOnline()
      .then((profile) => { if (!cancelled) setDriver(profile); })
      .catch((err) => console.warn('Connexion livreur:', err));

    const goOffline = () => {
      const token = localStorage.getItem('token');
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8082';
      fetch(`${base}/api/drivers/me/offline`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', goOffline);
    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', goOffline);
      markDriverOffline().catch(() => {});
    };
  }, [isAdmin, user]);

  useEffect(() => {
    if (!driver?.id || driver.backendStatus === 'HORS_LIGNE' || driver.online === false) return undefined;

    const pushLocation = async () => {
      try {
        const coords = await getBrowserLocation();
        await updateDriverLocation(driver.id, coords.latitude, coords.longitude);
        setGpsStatus(`GPS envoyé (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
      } catch {
        const fallback = resolveZoneCoords(driver.zone) || { latitude: 34.0209, longitude: -6.8416 };
        await updateDriverLocation(driver.id, fallback.latitude, fallback.longitude);
        setGpsStatus(`GPS estimé (${driver.zone || 'Rabat'}) — autorisez la géolocalisation pour plus de précision`);
      }
    };

    pushLocation();
    const gpsInterval = setInterval(pushLocation, 30000);
    return () => clearInterval(gpsInterval);
  }, [driver?.id, driver?.backendStatus, driver?.online, driver?.zone]);

  const handleStatusChange = async (label) => {
    try {
      if (label === 'Hors ligne') {
        await markDriverOffline();
        setDriver((prev) => prev ? { ...prev, status: 'Hors ligne', backendStatus: 'HORS_LIGNE', online: false } : prev);
        return;
      }
      if (label === 'Disponible') {
        const updated = await markDriverOnline();
        setDriver(updated);
        return;
      }
      const backend = DRIVER_STATUS_BACKEND[label];
      if (!backend) return;
      const updated = await updateMyStatus(backend);
      setDriver(updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Impossible de changer le statut');
    }
  };

  const handleAccept = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await acceptOrder(selectedOrder.rawId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await markOrderDelivered(selectedOrder.rawId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la livraison');
    } finally {
      setActionLoading(false);
    }
  };

  const activeOrders = orders.filter((o) => o.backendStatus === 'EN_LIVRAISON');
  const completedOrders = orders.filter((o) => ['LIVRÉE', 'ANNULÉE'].includes(o.backendStatus));

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8' }}>
        <p style={{ color: '#969696' }}>Chargement de l'espace livreur...</p>
      </div>
    );
  }

  if (error && !driver) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8', flexDirection: 'column', gap: 12 }}>
        <AlertTriangle size={32} color="#e05555" />
        <p style={{ color: '#2d2a22', fontWeight: 600 }}>{error}</p>
        <p style={{ color: '#969696', fontSize: 13, maxWidth: 420, textAlign: 'center' }}>
          Assurez-vous d'avoir un profil livreur (POST /api/drivers/migrate-existing en admin).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f0e8' }}>
      <Side />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {driver && (
              <div style={{ ...cardStyle, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f48c06', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {(driver.name || 'L').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{driver.name}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#969696' }}>
                        <Truck size={12} style={{ display: 'inline' }} /> {driver.vehicle} • {driver.zone}
                        {driver.online && <span style={{ color: '#50afa8', marginLeft: 8 }}>● En ligne</span>}
                      </p>
                    </div>
                  </div>
                  <select
                    value={driver.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 8, border: '1px solid #ede8df' }}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="En livraison">En livraison</option>
                    <option value="Hors ligne">Hors ligne</option>
                  </select>
                </div>

                {isAdmin && allDrivers.length > 1 && (
                  <select
                    value={driver.id}
                    onChange={(e) => setDriver(allDrivers.find((d) => d.id === Number(e.target.value)))}
                    style={{ width: '100%', marginTop: 10, fontSize: 12, padding: 6, borderRadius: 6, border: '1px solid #ede8df' }}
                  >
                    {allDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                    ))}
                  </select>
                )}

                {gpsStatus && (
                  <p style={{ margin: '10px 0 0', fontSize: 10, color: '#50afa8' }}>{gpsStatus}</p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, borderTop: '1px solid #ede8df', paddingTop: 12, marginTop: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 9, color: '#969696', fontWeight: 600 }}>LIVRAISONS</span>
                    <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700 }}>{driver.deliveries}</p>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #ede8df', borderRight: '1px solid #ede8df' }}>
                    <span style={{ fontSize: 9, color: '#969696', fontWeight: 600 }}>GAINS</span>
                    <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700 }}>{driver.revenue} DH</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 9, color: '#969696', fontWeight: 600 }}>NOTE</span>
                    <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Star size={14} fill="#f48c06" stroke="#f48c06" /> {driver.rating}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ ...cardStyle, flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Commandes affectées</h3>
              <p style={{ margin: '2px 0 16px', fontSize: 11, color: '#969696' }}>Synchronisé avec le backend (actualisation 12s)</p>

              <span style={{ fontSize: 10, fontWeight: 700, color: '#969696' }}>EN COURS ({activeOrders.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {activeOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, border: '1px dashed #ede8df', borderRadius: 10, color: '#969696', fontSize: 12 }}>
                    Aucune livraison assignée. Restez disponible pour recevoir des commandes.
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <div
                      key={order.rawId}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                        border: selectedOrder?.rawId === order.rawId ? '2px solid #f48c06' : '1px solid #ede8df',
                        background: selectedOrder?.rawId === order.rawId ? '#fffaf3' : '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f48c06' }}>{order.id}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 6, background: '#e8f0fe', color: '#1a73e8' }}>
                          {order.driverAccepted ? 'Acceptée' : 'Nouvelle'}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 700 }}>{order.client}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#969696' }}><MapPin size={11} /> {order.address}</p>
                      <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600 }}>{order.amount}</p>
                    </div>
                  ))
                )}
              </div>

              <span style={{ fontSize: 10, fontWeight: 700, color: '#969696', display: 'block', marginTop: 16 }}>HISTORIQUE ({completedOrders.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
                {completedOrders.map((order) => (
                  <div key={order.rawId} onClick={() => setSelectedOrder(order)} style={{ padding: 10, borderRadius: 10, border: '1px solid #ede8df', cursor: 'pointer', fontSize: 12 }}>
                    {order.id} • {order.client} — <strong>{order.status}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {selectedOrder ? (
              <div style={{ ...cardStyle, minHeight: 420 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f48c06' }}>DÉTAIL LIVRAISON</span>
                <h2 style={{ margin: '4px 0 16px', fontSize: 18 }}>{selectedOrder.id}</h2>

                <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #ede8df', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{selectedOrder.client}</p>
                  <p style={{ margin: '4px 0', fontSize: 12, color: '#969696' }}><MapPin size={12} /> {selectedOrder.address}</p>
                  {selectedOrder.contactPhone && (
                    <a href={`tel:${selectedOrder.contactPhone}`} style={{ fontSize: 12, color: '#50afa8', fontWeight: 700, textDecoration: 'none' }}>
                      <Phone size={12} /> {selectedOrder.contactPhone}
                    </a>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 800, color: '#f48c06' }}>{selectedOrder.amount}</p>
                </div>

                <div style={{ background: '#faf6ef', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 12 }}>
                  <p style={{ margin: 0 }}><strong>Statut backend:</strong> {selectedOrder.backendStatus}</p>
                  <p style={{ margin: '4px 0 0' }}><strong>Client GPS:</strong> {selectedOrder.latitude?.toFixed(4)}, {selectedOrder.longitude?.toFixed(4)}</p>
                  <p style={{ margin: '4px 0 0' }}><strong>Point retrait:</strong> {selectedOrder.merchantLatitude?.toFixed(4)}, {selectedOrder.merchantLongitude?.toFixed(4)}</p>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  {selectedOrder.backendStatus === 'EN_LIVRAISON' && !selectedOrder.driverAccepted && (
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#1a73e8', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Package size={16} style={{ verticalAlign: 'middle' }} /> Accepter la commande
                    </button>
                  )}
                  {selectedOrder.backendStatus === 'EN_LIVRAISON' && selectedOrder.driverAccepted && (
                    <button
                      onClick={handleDeliver}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#50afa8', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <CheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Confirmer la livraison
                    </button>
                  )}
                  {selectedOrder.backendStatus === 'LIVRÉE' && (
                    <div style={{ flex: 1, padding: 12, borderRadius: 10, background: '#e6f4ea', color: '#137333', textAlign: 'center', fontWeight: 700 }}>
                      Livraison terminée
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ ...cardStyle, minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Navigation size={32} color="#f48c06" />
                <p style={{ marginTop: 12, color: '#969696' }}>Sélectionnez une commande pour gérer la livraison</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeliveryPage;
