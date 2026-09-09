import React, { useState, useEffect } from 'react';
import { useDriver } from '../../context/DriverContext';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import {
  MapPin, Phone, Package, Navigation, CheckCircle, XCircle,
  Truck, AlertTriangle, Clock, RefreshCw, AlertCircle, Route, ArrowLeft
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Couleurs ──────────────────────────────────────────────────────────────────
const C = {
  primary: '#f48c06',
  success: '#50afa8',
  danger: '#e07070',
  warning: '#f3b137',
  bg: '#f5f0e8',
  card: 'rgba(255,253,248,0.95)',
  border: '#ede8df',
  textDark: '#2d2a22',
  textMuted: '#7c7667',
  gray: '#969696',
};

const SPEED_KMH = { MOTO: 35, VOITURE: 30, VELO: 15 };

const driverIcon = L.divIcon({
  html: `<div style="background:${C.primary};color:#fff;border:2.5px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏍</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17],
});
const destIcon = L.divIcon({
  html: `<div style="background:${C.danger};color:#fff;border:2.5px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📦</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17],
});
const depotIcon = L.divIcon({
  html: `<div style="background:#3a6fa8;color:#fff;border:2.5px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏭</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17],
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2)
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: true, duration: 0.8 });
  }, [bounds, map]);
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDuration(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const getRealCoordsForAddress = (address) => {
  const addr = (address || '').toLowerCase();
  if (addr.includes('agdal'))    return { lat: 34.0084, lng: -6.8485 };
  if (addr.includes('riad'))     return { lat: 33.9682, lng: -6.8778 };
  if (addr.includes('souissi'))  return { lat: 33.9744, lng: -6.8294 };
  if (addr.includes('medina') || addr.includes('marrakech')) return { lat: 31.6265, lng: -7.9890 };
  if (addr.includes('maarif') || addr.includes('casablanca')) return { lat: 33.5883, lng: -7.6534 };
  return { lat: 34.0208, lng: -6.8416 };
};

// ── Hook responsive ───────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

// ─────────────────────────────────────────────────────────────────────────────
const DriverOrdersPage = () => {
  const { orders, selectedOrder, setSelectedOrder, updateOrderStatus, selectedDriver, acceptOrder } = useDriver();
  const isMobile = useIsMobile();

  const [driverPos, setDriverPos]         = useState(null);
  const [posError, setPosError]           = useState(null);
  const [route, setRoute]                 = useState(null);
  const [routeLoading, setRouteLoading]   = useState(false);
  const [routeError, setRouteError]       = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason]   = useState('Client injoignable');
  const [customReason, setCustomReason]   = useState('');
  // Mobile: show detail panel instead of list
  const [mobileView, setMobileView]       = useState('list'); // 'list' | 'detail'
  const [activeTarget, setActiveTarget]   = useState(null);

  const activeOrders = orders.filter(o =>
    ['Affectée', 'En livraison', 'Acceptée', 'Récupération', 'En route'].includes(o.status)
  );

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      if (selectedDriver?.currentLatitude)
        setDriverPos({ lat: selectedDriver.currentLatitude, lng: selectedDriver.currentLongitude });
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setPosError(null); },
      () => {
        setPosError('GPS indisponible — position de référence utilisée.');
        if (selectedDriver?.currentLatitude)
          setDriverPos({ lat: selectedDriver.currentLatitude, lng: selectedDriver.currentLongitude });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedDriver]);

  // Coords de destination
  const orderCoords = selectedOrder
    ? (selectedOrder.lat && selectedOrder.lng
        ? { lat: Number(selectedOrder.lat), lng: Number(selectedOrder.lng) }
        : selectedOrder.latitude != null
          ? { lat: selectedOrder.latitude, lng: selectedOrder.longitude }
          : getRealCoordsForAddress(selectedOrder.address || selectedOrder.deliveryAddress))
    : null;

  // Dépôts de tous les produits de la commande
  const depotCoordsList = (selectedOrder?.items || []).reduce((acc, item) => {
    const p = item.product;
    if (!p?.depotLatitude || !p?.depotLongitude) return acc;
    const lat = Number(p.depotLatitude);
    const lng = Number(p.depotLongitude);
    const key = `${lat},${lng}`;
    if (acc.some((d) => `${d.lat},${d.lng}` === key)) return acc;
    acc.push({
      lat,
      lng,
      address: p.depotAddress,
      productName: p.name,
    });
    return acc;
  }, []);

  // Route OSRM
  useEffect(() => {
    let targetCoords = orderCoords;
    let targetType = 'client';
    
    if (activeTarget) {
      targetCoords = activeTarget.coords;
      targetType = activeTarget.type;
    } else if (depotCoordsList.length > 0) {
      targetCoords = { lat: depotCoordsList[0].lat, lng: depotCoordsList[0].lng };
      targetType = 'depot';
    }

    if (!selectedOrder || !driverPos || !targetCoords) { setRoute(null); return; }
    
    const fetchRoute = async () => {
      setRouteLoading(true); setRouteError(null);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driverPos.lng},${driverPos.lat};${targetCoords.lng},${targetCoords.lat}?overview=full&geometries=geojson&steps=false`;
        const res = await fetch(url), data = await res.json();
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const r = data.routes[0];
          setRoute({ coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), distKm: r.distance / 1000, durationMin: r.duration / 60, source: 'osrm', targetType });
        } else throw new Error('no route');
      } catch {
        setRouteError("Routage indisponible — distance à vol d'oiseau.");
        const dist = haversineKm(driverPos.lat, driverPos.lng, targetCoords.lat, targetCoords.lng);
        const speed = SPEED_KMH[(selectedDriver?.vehicle || 'MOTO').toUpperCase()] || 35;
        setRoute({ coords: [[driverPos.lat, driverPos.lng], [targetCoords.lat, targetCoords.lng]], distKm: dist, durationMin: (dist / speed) * 60, source: 'haversine', targetType });
      } finally { setRouteLoading(false); }
    };
    fetchRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder, driverPos, activeTarget]);

  const mapBounds = driverPos && orderCoords ? [[driverPos.lat, driverPos.lng], [orderCoords.lat, orderCoords.lng]] : null;
  // Si on a un dépôt, inclure dans les bounds
  const allBounds = driverPos && orderCoords
    ? [
        [driverPos.lat, driverPos.lng],
        ...depotCoordsList.map((d) => [d.lat, d.lng]),
        [orderCoords.lat, orderCoords.lng],
      ]
    : null;
  const mapCenter = driverPos ? [driverPos.lat, driverPos.lng] : orderCoords ? [orderCoords.lat, orderCoords.lng] : [34.0208, -6.8416];

  // Handlers
  // "Récupérer le colis" — accepte la commande → backend: driverAccepted=true + status EN_LIVRAISON
  const handleAccept = () => {
    if (!selectedOrder) return;
    (acceptOrder
      ? acceptOrder(selectedOrder.id)
      : updateOrderStatus(selectedOrder.id, 'EN_LIVRAISON')
    ).catch(err => alert('Erreur : ' + (err.response?.data?.message || err.message)));
  };

  // "Commencer la livraison" (depuis Récupération) → même endpoint accept
  const handleStartRoute = () => {
    if (!selectedOrder) return;
    (acceptOrder
      ? acceptOrder(selectedOrder.id)
      : updateOrderStatus(selectedOrder.id, 'EN_LIVRAISON')
    ).catch(err => alert('Erreur : ' + (err.response?.data?.message || err.message)));
  };

  // "Confirmer la livraison" → LIVRÉE
  const handleConfirmDone = () => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, 'LIVRÉE')
      .catch(err => alert('Erreur : ' + (err.response?.data?.message || err.message)));
  };

  // "Signaler retour" → RETOURNEE
  const handleConfirmReturn = () => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, 'RETOURNEE')
      .then(() => { setShowReturnModal(false); if (isMobile) setMobileView('list'); })
      .catch(err => alert('Erreur : ' + (err.response?.data?.message || err.message)));
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setActiveTarget(null);
    if (isMobile) setMobileView('detail');
  };

  // ── Composant liste ────────────────────────────────────────────────────────
  const ListPanel = () => (
    <div style={{
      background: C.card, borderRadius: isMobile ? 0 : 16,
      border: isMobile ? 'none' : `1px solid ${C.border}`, padding: isMobile ? '16px 12px' : 20,
      boxShadow: isMobile ? 'none' : '0 2px 12px rgba(180,140,80,0.06)',
      display: 'flex', flexDirection: 'column', gap: 14,
      overflowY: 'auto', minHeight: isMobile ? 'calc(100vh - 120px)' : 'auto',
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textDark }}>Commandes en cours</h3>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.gray }}>Gérer vos livraisons attribuées</p>
      </div>
      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', border: `1px dashed ${C.border}`, borderRadius: 10, color: C.gray, fontSize: 12 }}>
          <Truck size={28} style={{ marginBottom: 8, opacity: 0.4 }} /><br />
          Aucune livraison en cours d'acheminement.
        </div>
      ) : (
        activeOrders.map(order => (
          <div
            key={order.id}
            onClick={() => selectOrder(order)}
            style={{
              padding: '12px 16px', borderRadius: 12,
              border: selectedOrder?.id === order.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              background: selectedOrder?.id === order.id ? '#fffaf3' : '#fff',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>#{order.id}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                background: ['Affectée','Acceptée'].includes(order.status) ? '#e8f0fe' : ['En livraison','Récupération','En route'].includes(order.status) ? '#fef7e0' : '#fce8e6',
                color: ['Affectée','Acceptée'].includes(order.status) ? '#1a73e8' : ['En livraison','Récupération','En route'].includes(order.status) ? '#b06000' : '#c5221f',
              }}>{order.status}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.textDark }}>{order.client || order.clientUsername}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.gray, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} /> {order.address || order.deliveryAddress}
            </p>
            {/* Produits de la commande */}
            {order.items && order.items.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.bg, borderRadius: 6, padding: '3px 6px' }}>
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 3 }} />
                    ) : (
                      <span style={{ fontSize: 12 }}>📦</span>
                    )}
                    <span style={{ fontSize: 10, color: C.textDark, fontWeight: 600 }}>{item.product?.name || 'Produit'}</span>
                    <span style={{ fontSize: 9, color: C.gray }}>×{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <span style={{ fontSize: 10, color: C.gray, alignSelf: 'center' }}>+{order.items.length - 3}</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, borderTop: `1px solid ${C.bg}`, paddingTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textDark }}>{order.amount || `${Number(order.totalPrice || 0).toFixed(2)} MAD`}</span>
              <span style={{ fontSize: 10, color: C.gray, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={10} /> ETA: {order.eta || (route ? fmtDuration(route.durationMin) : '—')}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── Composant détail ───────────────────────────────────────────────────────
  const DetailPanel = () => (
    <div style={{
      flex: 1, background: C.card, borderRadius: isMobile ? 0 : 16,
      border: isMobile ? 'none' : `1px solid ${C.border}`,
      padding: isMobile ? '12px' : 20,
      boxShadow: isMobile ? 'none' : '0 2px 12px rgba(180,140,80,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto',
      minHeight: isMobile ? 'calc(100vh - 120px)' : 'auto',
    }}>
      {/* Bouton retour liste */}
      <button
        onClick={() => {
          setSelectedOrder(null);
          if (isMobile) setMobileView('list');
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '4px 0', marginBottom: 4 }}
      >
        <ArrowLeft size={16} /> Retour aux commandes
      </button>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>DETAIL DE LA LIVRAISON</span>
          <h2 style={{ margin: '2px 0 0', fontSize: isMobile ? 16 : 18, fontWeight: 800, color: C.textDark }}>{selectedOrder.id}</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: C.gray, display: 'block' }}>Montant à percevoir</span>
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: C.primary }}>
            {selectedOrder.amount || `${Number(selectedOrder.totalPrice || 0).toFixed(2)} MAD`}
          </span>
        </div>
      </div>

      {/* Infos client */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, background: '#fff', padding: 12, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div>
          <span style={{ fontSize: 9, color: C.gray, fontWeight: 700, textTransform: 'uppercase' }}>Client</span>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: C.textDark }}>{selectedOrder.client || selectedOrder.clientUsername}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.gray, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} /> {selectedOrder.address || selectedOrder.deliveryAddress}
          </p>
        </div>
        <div style={{ borderTop: isMobile ? `1px solid ${C.border}` : 'none', borderLeft: isMobile ? 'none' : `1px solid ${C.border}`, paddingTop: isMobile ? 10 : 0, paddingLeft: isMobile ? 0 : 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: C.gray, fontWeight: 700, textTransform: 'uppercase' }}>Contact client</span>
          <a href={`tel:${selectedOrder.phone || selectedOrder.contactPhone || '+2126000000'}`}
            style={{ textDecoration: 'none', color: C.success, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Phone size={12} /> Appeler le client
          </a>
        </div>
      </div>

      {/* Produits de la commande */}
      {selectedOrder.items && selectedOrder.items.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 12 }}>
          <span style={{ fontSize: 9, color: C.gray, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Produits à livrer</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedOrder.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', background: C.bg, borderRadius: 8 }}>
                {/* Image produit */}
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}`, background: '#fff' }}>
                  {item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                  )}
                </div>
                {/* Infos produit */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product?.name || 'Produit'}
                  </p>
                  {item.product?.description && (
                    <p style={{ margin: '1px 0 0', fontSize: 10, color: C.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.description}
                    </p>
                  )}
                </div>
                {/* Qté & Prix */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.primary }}>×{item.quantity}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 10, color: C.textMuted }}>{Number(item.price || 0).toFixed(2)} MAD</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carte */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDark, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Navigation size={14} style={{ color: C.primary }} /> Itinéraire vers la commande
        </span>
        {posError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.3)', fontSize: 11, color: C.danger }}>
            <AlertCircle size={13} /> {posError}
          </div>
        )}
        {routeError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(243,177,55,0.1)', border: '1px solid rgba(243,177,55,0.3)', fontSize: 11, color: C.warning }}>
            <AlertCircle size={13} /> {routeError}
          </div>
        )}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, height: isMobile ? 220 : 260, position: 'relative' }}>
          <MapContainer center={mapCenter} zoom={driverPos ? 13 : 6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {allBounds && <FitBounds bounds={allBounds} />}
            {driverPos && (
              <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
                <Popup><div style={{ fontSize: 12 }}><strong style={{ color: C.primary }}>📍 Votre position</strong><br />{selectedDriver?.name}</div></Popup>
              </Marker>
            )}
            {depotCoordsList.map((depot, index) => {
              const isTarget = route?.targetType === 'depot' && (!activeTarget ? index === 0 : activeTarget.coords.lat === depot.lat);
              return (
                <Marker key={`depot-${depot.lat}-${depot.lng}-${index}`} position={[depot.lat, depot.lng]} icon={depotIcon} eventHandlers={{ click: () => setActiveTarget({ type: 'depot', coords: {lat: depot.lat, lng: depot.lng} }) }}>
                  <Popup>
                    <div style={{ fontSize: 12 }}>
                      <strong style={{ color: '#3a6fa8' }}>🏭 Dépôt de récupération</strong>
                      <br />
                      {depot.productName && <span>{depot.productName}<br /></span>}
                      {depot.address || 'Dépôt'}
                      {route && isTarget && (
                        <div style={{marginTop: 6, fontSize: 11, color: C.textDark}}>
                          <strong>Distance:</strong> {route.distKm.toFixed(2)} km<br/>
                          <strong>ETA:</strong> {fmtDuration(route.durationMin)}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {orderCoords && (
              <Marker position={[orderCoords.lat, orderCoords.lng]} icon={destIcon} eventHandlers={{ click: () => setActiveTarget({ type: 'client', coords: orderCoords }) }}>
                <Popup><div style={{ fontSize: 12 }}><strong style={{ color: C.danger }}>📦 #{selectedOrder.id}</strong><br />{selectedOrder.client || selectedOrder.clientUsername}
                  {route && route.targetType === 'client' && (
                    <div style={{marginTop: 6, fontSize: 11, color: C.textDark}}>
                      <strong>Distance:</strong> {route.distKm.toFixed(2)} km<br/>
                      <strong>ETA:</strong> {fmtDuration(route.durationMin)}
                    </div>
                  )}
                </div></Popup>
              </Marker>
            )}
            {route && route.coords.length > 1 && (
              <Polyline positions={route.coords} pathOptions={{ color: route.targetType === 'depot' ? '#3a6fa8' : C.primary, weight: route.source === 'osrm' ? 5 : 3, opacity: 0.85, dashArray: route.source === 'haversine' ? '8 6' : undefined }} />
            )}
          </MapContainer>
          {/* Légende */}
          <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 1000, background: 'rgba(255,253,248,0.92)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '5px 8px', fontSize: 10, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: C.primary, display: 'inline-block' }} /><span style={{ color: C.textDark, fontWeight: 600 }}>Vous</span></div>
            {depotCoordsList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a6fa8', display: 'inline-block' }} /><span style={{ color: C.textDark, fontWeight: 600 }}>Dépôt{depotCoordsList.length > 1 ? 's' : ''}</span></div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: C.danger, display: 'inline-block' }} /><span style={{ color: C.textDark, fontWeight: 600 }}>Destination</span></div>
          </div>
          {routeLoading && (
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000, background: 'rgba(255,253,248,0.9)', padding: '4px 8px', borderRadius: 8, fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Calcul...
            </div>
          )}
        </div>
        {route && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', background: '#fff', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, gap: 8 }}>
            <span style={{ color: C.textDark, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Navigation size={13} color={C.primary} /> Vers : <strong style={{ color: route.targetType === 'depot' ? '#3a6fa8' : C.danger, marginLeft: 2 }}>{route.targetType === 'depot' ? 'Dépôt' : 'Client'}</strong>
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: C.textDark, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Route size={13} color={C.primary} /> <strong style={{ color: C.primary }}>{route.distKm.toFixed(2)} km</strong>
              </span>
              <span style={{ color: C.textDark, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} color={C.success} /> <strong style={{ color: C.success }}>{fmtDuration(route.durationMin)}</strong>
              </span>
            </div>
          </div>
        )}


      </div>

      {/* Suivi statut + Boutons action */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 'auto' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Suivi d'état</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedOrder.status === 'Livrée' ? C.success : selectedOrder.status === 'Retournée' ? '#e05555' : C.primary }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>Statut : {selectedOrder.status}</span>
          </div>
          <span style={{ fontSize: 11, color: C.gray }}>{selectedOrder.progress}%</span>
        </div>
        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${selectedOrder.progress}%`, height: '100%', background: selectedOrder.status === 'Livrée' ? C.success : selectedOrder.status === 'Retournée' ? '#e05555' : `linear-gradient(90deg, ${C.primary}, #e05555)`, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>

        {/* Boutons selon statut */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Affectée / Acceptée → Récupérer le colis (appel accept) */}
          {['Affectée', 'Acceptée'].includes(selectedOrder.status) && (
            <button onClick={handleAccept}
              style={{ flex: 1, minWidth: 140, padding: '11px 16px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 10px rgba(244,140,6,0.25)`, fontSize: 13 }}>
              <Package size={16} /> Récupérer le colis
            </button>
          )}
          {/* Récupération → Commencer la livraison (appel accept également) */}
          {selectedOrder.status === 'Récupération' && (
            <button onClick={handleStartRoute}
              style={{ flex: 1, minWidth: 140, padding: '11px 16px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 10px rgba(244,140,6,0.25)`, fontSize: 13 }}>
              <Navigation size={16} /> Commencer la livraison
            </button>
          )}
          {/* En livraison / En route → Confirmer ou Retourner */}
          {['En livraison', 'En route'].includes(selectedOrder.status) && (
            <>
              <button onClick={handleConfirmDone}
                style={{ flex: 2, minWidth: 140, padding: '11px 16px', borderRadius: 10, border: 'none', background: C.success, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, boxShadow: `0 4px 10px rgba(80,175,168,0.3)` }}>
                <CheckCircle size={16} /> Confirmer la livraison
              </button>
              <button onClick={() => setShowReturnModal(true)}
                style={{ flex: 1, minWidth: 100, padding: '11px 12px', borderRadius: 10, border: '2px solid #e05555', background: '#fff', color: '#e05555', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                <XCircle size={16} /> Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>
      <Side />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{
          flex: 1, overflowY: 'auto', padding: isMobile ? 0 : 24,
          display: isMobile ? 'block' : 'grid',
          gridTemplateColumns: isMobile ? undefined : '1.2fr 1.8fr',
          gap: isMobile ? 0 : 20,
        }}>
          {/* Mobile : afficher liste ou détail selon mobileView */}
          {isMobile ? (
            mobileView === 'list' ? <ListPanel /> : (selectedOrder ? <DetailPanel /> : <ListPanel />)
          ) : (
            <>
              <ListPanel />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {selectedOrder ? <DetailPanel /> : (
                  <div style={{ flex: 1, background: 'rgba(255,253,248,0.8)', borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffaf3', border: `1.5px solid ${C.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, marginBottom: 16 }}>
                      <Truck size={28} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textDark }}>Aucune commande sélectionnée</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.gray, maxWidth: 260 }}>
                      Cliquez sur une commande pour voir les détails et gérer la livraison.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Modal Retour ──────────────────────────────────────────────── */}
      {showReturnModal && (
        <div
          onClick={() => setShowReturnModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(45,42,34,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fffaf3', border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 420, padding: isMobile ? 20 : 28, boxShadow: '0 12px 32px rgba(45,42,34,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textDark, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={18} style={{ color: '#e05555' }} /> Signaler un retour
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.gray }}>Spécifiez le motif du retour au dépôt.</p>
              </div>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray, padding: 4, fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textDark }}>Motif du retour :</label>
              <select value={returnReason} onChange={e => setReturnReason(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, color: C.textDark, outline: 'none', width: '100%' }}>
                <option value="Client injoignable">Client injoignable (Téléphone coupé/Pas de réponse)</option>
                <option value="Adresse incorrecte">Adresse de livraison incorrecte ou incomplète</option>
                <option value="Client absent">Client absent au moment du passage</option>
                <option value="Client refuse la commande">Client refuse d'accepter le colis</option>
                <option value="Produit endommagé">Produit endommagé durant le trajet</option>
                <option value="Autre">Autre motif (Préciser ci-dessous)</option>
              </select>
            </div>
            {returnReason === 'Autre' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textDark }}>Précisez le motif :</label>
                <textarea rows="3" value={customReason} onChange={e => setCustomReason(e.target.value)}
                  placeholder="Décrivez brièvement le problème..."
                  style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.textDark, outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowReturnModal(false)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.textDark, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Annuler
              </button>
              <button onClick={handleConfirmReturn}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', background: '#e05555', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 10px rgba(224,85,85,0.3)' }}>
                Valider le retour
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DriverOrdersPage;
