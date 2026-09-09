import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Side from '../../components/layout/Side';
import authService from '../../services/authService';
import api from '../../api/axiosConfig';
import TopBar from '../../components/layout/TopBar';
import axios from '../../api/axiosConfig';
import {
  Users, MapPin, TrendingUp, Plus, Search, Edit, Trash2, Play, Check,
  AlertTriangle, UserCheck, CreditCard, Clock, Star, Navigation, Truck,
  Eye, Bike, Car, Settings, X, Award, FileText, CheckCircle2, RotateCcw,
  RefreshCw, Download, Filter, ChevronDown, Banknote, BarChart2,
  Calendar, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getPayments, advanceDeliverySimulation,
} from '../../Driver/data/driversStore';
import { retryAutoAssign, fetchPendingOrders } from '../../services/deliveryService';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  primary:      '#f48c06',
  primaryLight: 'rgba(244,140,6,0.10)',
  success:      '#50afa8',
  successLight: 'rgba(80,175,168,0.10)',
  danger:       '#e07070',
  dangerLight:  'rgba(224,112,112,0.10)',
  warning:      '#f3b137',
  warningLight: 'rgba(243,177,55,0.10)',
  gray:         '#969696',
  grayLight:    '#ede8df',
  background:   '#f5f0e8',
  card:         '#ffffff',
  textDark:     '#2d2a22',
  textMuted:    '#7c7667',
};

const card = {
  background:   C.card,
  borderRadius: 16,
  padding:      '20px 24px',
  border:       `1px solid ${C.grayLight}`,
  boxShadow:    '0 2px 12px rgba(180,140,80,0.06)',
};

const tabStyle = (active) => ({
  padding:        '12px 20px',
  borderRadius:   10,
  border:         'none',
  fontSize:       13,
  fontWeight:     600,
  cursor:         'pointer',
  transition:     'all 0.2s ease',
  background:     active ? C.primary : 'transparent',
  color:          active ? '#ffffff' : C.textMuted,
  boxShadow:      active ? `0 4px 12px ${C.primary}44` : 'none',
  display:        'flex',
  alignItems:     'center',
  gap:            8,
});

const inputStyle = {
  width:        '100%',
  padding:      '8px 10px',
  borderRadius: 6,
  border:       `1.5px solid ${C.grayLight}`,
  fontSize:     12,
  color:        C.textDark,
  background:   '#ffffff',
  outline:      'none',
  boxSizing:    'border-box',
};

const labelStyle = {
  display:      'block',
  fontSize:     11,
  fontWeight:   700,
  color:        C.textMuted,
  marginBottom: 4,
};

const statusLabel = {
  DISPONIBLE:   'Disponible',
  EN_LIVRAISON: 'En livraison',
  HORS_LIGNE:   'Hors ligne',
  SUSPENDU:     'Suspendu',
};

// ─── Payment status helpers ───────────────────────────────────────────────────
const payStatusMap = {
  EN_ATTENTE: { label: 'En attente',  bg: C.warningLight, text: C.warning },
  VALIDE:     { label: 'Validé',      bg: C.successLight, text: C.success },
  REJETE:     { label: 'Rejeté',      bg: C.dangerLight,  text: C.danger  },
  // fallbacks for any raw string the backend might return
  'En attente': { label: 'En attente', bg: C.warningLight, text: C.warning },
  'Validé':     { label: 'Validé',     bg: C.successLight, text: C.success },
  'Rejeté':     { label: 'Rejeté',     bg: C.dangerLight,  text: C.danger  },
};

const getPayStatus = (s) =>
  payStatusMap[s] ?? { label: s, bg: 'rgba(150,150,150,0.1)', text: C.gray };

// ─── Leaflet markers / helpers ─────────────────────────────────────────────────
const createDriverIcon = (status, initials) => {
  const color = status === 'DISPONIBLE' ? C.success : status === 'EN_LIVRAISON' ? C.primary : C.gray;
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 11px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">${initials}</div>`,
    className: 'custom-driver-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const customerIcon = L.divIcon({
  html: `<div style="
    background-color: #2d2a22;
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  ">👤</div>`,
  className: 'custom-customer-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const LivreursPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  // ── Global data ─────────────────────────────────────────────────────────────
  const [drivers,       setDrivers]       = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [payments,      setPayments]      = useState([]);

  // ── Payment-specific state ───────────────────────────────────────────────────
  const [payLoading,       setPayLoading]       = useState(false);
  const [payError,         setPayError]         = useState(null);
  const [paySearch,        setPaySearch]        = useState('');
  const [payStatusFilter,  setPayStatusFilter]  = useState('Tous');
  const [payPeriodFilter,  setPayPeriodFilter]  = useState('Tous');
  const [payStats,         setPayStats]         = useState({ pending: 0, validated: 0, total: 0, pendingCount: 0 });
  const [validatingId,     setValidatingId]     = useState(null);

  // ── Simulation ───────────────────────────────────────────────────────────────
  const [isSimulating, setIsSimulating] = useState(false);
  const simInterval = useRef(null);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [showAddModal,          setShowAddModal]          = useState(false);
  const [showEditModal,         setShowEditModal]         = useState(false);
  const [showDeleteModal,       setShowDeleteModal]       = useState(false);
  const [showAssignModal,       setShowAssignModal]       = useState(false);
  const [showInvoiceModal,      setShowInvoiceModal]      = useState(false);
  const [showDriverOrdersModal, setShowDriverOrdersModal] = useState(false);
  const [credentialsModal,      setCredentialsModal]      = useState(null);

  // ── Targets ──────────────────────────────────────────────────────────────────
  const [selectedDriver,  setSelectedDriver]  = useState(null);
  const [selectedOrder,   setSelectedOrder]   = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // ── Drivers filters ──────────────────────────────────────────────────────────
  const [searchTerm,    setSearchTerm]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState('Tous');
  const [vehicleFilter, setVehicleFilter] = useState('Tous');
  const [autoAssigningOrderId, setAutoAssigningOrderId] = useState(null);

  // ── Map state ────────────────────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState([34.6867, -1.9114]);
  const [mapZoom,   setMapZoom]   = useState(12);

  // ── Forms ────────────────────────────────────────────────────────────────────
  const [addForm, setAddForm] = useState({
    firstName: '', lastName: '', cin: '', phone: '', email: '',
    adresse: '', vehicle: 'Moto', zone: 'Rabat Centre', password: ''
  });
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', cin: '', phone: '', email: '',
    adresse: '', vehicle: 'MOTO', zone: '', status: 'HORS_LIGNE', photo: null
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  DATA LOADING
  // ════════════════════════════════════════════════════════════════════════════

  const loadDrivers = async () => {
    try {
      const res = await axios.get('/api/drivers');
      setDrivers((res.data || []).map(d => ({
        id:         String(d.id),
        appUserId:  String(d.appUserId),
        name:       d.name || `${d.firstName} ${d.lastName}`,
        firstName:  d.firstName  || '',
        lastName:   d.lastName   || '',
        username:   d.username   || '',
        phone:      d.phone      || 'Non spécifié',
        cin:        d.cin        || '--',
        email:      d.email      || '',
        adresse:    d.adresse    || '',
        vehicle:    d.vehicle    || 'MOTO',
        zone:       d.zone       || 'Non spécifié',
        // SUSPENDU is an admin lock; otherwise status only counts while the driver is online
        status:     (d.status === 'SUSPENDU' ? 'SUSPENDU' : (d.online === true ? d.status : 'HORS_LIGNE')) || 'HORS_LIGNE',
        online:     d.online === true,
        deliveries: d.deliveries || 0,
        rating:     d.rating     || 5.0,
        revenue:    d.revenue    || 0,
        photo:      d.photo      || null,
        currentLatitude:  d.currentLatitude,
        currentLongitude: d.currentLongitude,
        hasGps:     d.currentLatitude != null && d.currentLongitude != null,
      })));
    } catch (err) {
      console.error('Erreur drivers:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders');
      const apiOrders = res.data?.data || [];
      setOrders(apiOrders.map((o) => {
        let status = 'En attente confirmation';
        if (o.status === 'CONFIRMÉE' && !o.livreur) status = 'En attente';
        if (o.status === 'CONFIRMÉE' && o.livreur)  status = 'Confirmée';
        if (o.status === 'EN_LIVRAISON')            status = 'En route';
        if (o.status === 'LIVRÉE')                  status = 'Livrée';
        if (o.status === 'ANNULÉE')                 status = 'Annulée';
        return {
          id:                String(o.id),
          client:            o.clientUsername || 'Client',
          address:           o.deliveryAddress || 'Adresse',
          amount:            `${Number(o.totalPrice || 0).toFixed(2)} MAD`,
          date:              o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : "Aujourd'hui",
          status,
          backendStatus:     o.status,
          driverId:          o.livreur?.id ? String(o.livreur.id) : null,
          livreurAppUserId:  o.livreur?.id ? String(o.livreur.id) : null,
          progress:          o.status === 'LIVRÉE' ? 100 : o.status === 'EN_LIVRAISON' ? 60 : 0,
          lat:               o.latitude  || 34.6867,
          lng:               o.longitude || -1.9114,
          eta:               o.status === 'EN_LIVRAISON' ? '10 min' : '--',
        };
      }));
    } catch (err) {
      console.error('Erreur commandes:', err);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const pending = await fetchPendingOrders();
      setPendingOrders((pending || []).map((o) => ({
        id:      String(o.id),
        client:  o.client?.username || o.clientUsername || 'Client',
        address: o.deliveryAddress || 'Adresse',
        amount:  `${Number(o.totalPrice || 0).toFixed(2)} MAD`,
        date:    o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : "Aujourd'hui",
        status:  'En attente',
        backendStatus: o.status,
      })));
    } catch (err) {
      console.warn('Pending orders unavailable, falling back to local orders list', err);
      setPendingOrders((prev) => prev); // leave untouched; reloadAllData will reconcile via orders
    }
  };

  // ── Payments: fetch from real API ────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    setPayLoading(true);
    setPayError(null);
    try {
      const res = await axios.get('/api/admin/payments');
      const raw = res.data?.data ?? res.data ?? [];

      const formatted = raw.map(p => ({
        id:          String(p.id),
        driverId:    String(p.driverId ?? p.livreurId ?? ''),
        driverName:  p.driverName ?? p.livreurName ?? p.nomLivreur ?? '—',
        period:      p.period      ?? p.periode     ?? '—',
        deliveries:  p.deliveries  ?? p.nbLivraisons ?? 0,
        amount:      p.amount      ?? p.montant      ?? 0,
        status:      p.status      ?? p.statut       ?? 'EN_ATTENTE',
        createdAt:   p.createdAt   ?? p.dateCreation ?? null,
        iban:        p.iban        ?? null,
        phone:       p.phone       ?? p.telephone    ?? null,
      }));

      setPayments(formatted);

      const pending   = formatted.filter(p => ['EN_ATTENTE', 'En attente'].includes(p.status));
      const validated = formatted.filter(p => ['VALIDE', 'Validé'].includes(p.status));
      setPayStats({
        pending:      pending.reduce((s, p) => s + Number(p.amount), 0),
        validated:    validated.reduce((s, p) => s + Number(p.amount), 0),
        total:        formatted.reduce((s, p) => s + Number(p.amount), 0),
        pendingCount: pending.length,
      });
    } catch (err) {
      console.error('Erreur paiements (API), repli sur les données locales:', err);
      // Fallback to the local mock store so the tab stays usable in dev / offline
      try {
        const local = getPayments() || [];
        setPayments(local);
        const pending   = local.filter(p => ['EN_ATTENTE', 'En attente'].includes(p.status));
        const validated = local.filter(p => ['VALIDE', 'Validé'].includes(p.status));
        setPayStats({
          pending:      pending.reduce((s, p) => s + Number(p.amount), 0),
          validated:    validated.reduce((s, p) => s + Number(p.amount), 0),
          total:        local.reduce((s, p) => s + Number(p.amount), 0),
          pendingCount: pending.length,
        });
        setPayError("Connexion au serveur indisponible — données locales affichées.");
      } catch {
        setPayError("Impossible de charger les paiements. Vérifiez la connexion au serveur.");
      }
    } finally {
      setPayLoading(false);
    }
  }, []);

  const reloadAllData = async () => {
    await Promise.all([loadDrivers(), loadOrders(), loadPendingOrders(), loadPayments()]);
  };

  useEffect(() => {
    axios.post('/api/drivers/migrate-existing')
      .catch(() => {})
      .finally(() => axios.post('/api/drivers/backfill-locations').catch(() => {}))
      .finally(() => reloadAllData());
  }, []);

  // Auto-refresh driver positions + orders every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      reloadAllData();
    }, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  // Reload payments specifically whenever the tab switches to payments
  useEffect(() => {
    if (currentTab === 'payments') loadPayments();
  }, [currentTab]);

  // ── Simulation ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSimulating) {
      simInterval.current = setInterval(() => {
        const res = advanceDeliverySimulation();
        if (res?.updated) reloadAllData();
      }, 2500);
    } else {
      clearInterval(simInterval.current);
    }
    return () => clearInterval(simInterval.current);
  }, [isSimulating]);

  // ════════════════════════════════════════════════════════════════════════════
  //  HANDLERS — DRIVERS CRUD
  // ════════════════════════════════════════════════════════════════════════════

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const passwordToUse = addForm.password || 'Wsl@2026!';
    const raw = `${addForm.firstName}${addForm.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = (raw.length >= 3 ? raw : raw + 'usr').slice(0, 20);
    try {
      await api.post('/api/drivers', {
        username, email: addForm.email, password: passwordToUse,
        firstName: addForm.firstName, lastName: addForm.lastName,
        cin: addForm.cin, phone: addForm.phone, adresse: addForm.adresse,
        vehicle: addForm.vehicle.toUpperCase(), zone: addForm.zone,
      });
      await loadDrivers();
      setShowAddModal(false);
      setCredentialsModal({ email: addForm.email, password: passwordToUse, name: `${addForm.firstName} ${addForm.lastName}` });
      setAddForm({ firstName: '', lastName: '', cin: '', phone: '', email: '', adresse: '', vehicle: 'Moto', zone: 'Rabat Centre', password: '' });
    } catch (err) {
      alert(`Erreur : ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEditClick = (driver) => {
    setSelectedDriver(driver);
    setEditForm({
      firstName: driver.firstName || '',
      lastName:  driver.lastName  || '',
      cin:       driver.cin       || '',
      phone:     driver.phone     || '',
      email:     driver.email     || '',
      adresse:   driver.adresse   || '',
      vehicle:   driver.vehicle   || 'MOTO',
      zone:      driver.zone      || '',
      // DISPONIBLE / EN_LIVRAISON are derived automatically from the driver's online state,
      // so the admin form only lets you toggle between HORS_LIGNE and SUSPENDU.
      status:    driver.status === 'SUSPENDU' ? 'SUSPENDU' : 'HORS_LIGNE',
      photo:     driver.photo || null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/drivers/${selectedDriver.id}`, {
        firstName: editForm.firstName, lastName: editForm.lastName,
        cin: editForm.cin, phone: editForm.phone, email: editForm.email,
        adresse: editForm.adresse, vehicle: editForm.vehicle.toUpperCase(), zone: editForm.zone,
      });
      if (editForm.status !== selectedDriver.status)
        await api.patch(`/api/drivers/${selectedDriver.id}/status`, { status: editForm.status });
      await loadDrivers();
      setShowEditModal(false);
    } catch (err) {
      alert(`Erreur : ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteClick = (d) => { setSelectedDriver(d); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/drivers/${selectedDriver.id}`);
      await loadDrivers();
      setShowDeleteModal(false);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const confirmDeactivate = async () => {
    try {
      await api.patch(`/api/drivers/${selectedDriver.id}/status`, { status: 'SUSPENDU' });
      await loadDrivers();
      setShowDeleteModal(false);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  // ── Assignment ────────────────────────────────────────────────────────────────
  const handleAssignClick = (o) => { setSelectedOrder(o); setShowAssignModal(true); };

  const confirmAssign = async (driverId) => {
    try {
      await axios.post(`/api/admin/orders/${selectedOrder.id}/assign-livreur?livreurId=${driverId}`);
      await reloadAllData();
      setShowAssignModal(false);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleAutoAssign = async (orderId) => {
    setAutoAssigningOrderId(orderId);
    try {
      const res = await retryAutoAssign(orderId);
      await reloadAllData();
      alert(res?.message || (res?.success ? 'Affectation automatique réussie' : 'Aucun livreur disponible'));
    } catch (err) {
      alert(err.response?.data?.message || "Erreur d'affectation automatique");
    } finally {
      setAutoAssigningOrderId(null);
    }
  };

  // ── Payments ──────────────────────────────────────────────────────────────────
  const handleValidatePayment = async (paymentId) => {
    setValidatingId(paymentId);
    try {
      await api.patch(`/api/admin/payments/${paymentId}/validate`, { status: 'VALIDE' });
      await loadPayments();
    } catch (err) {
      try {
        await api.post(`/api/admin/payments/${paymentId}/validate`);
        await loadPayments();
      } catch (err2) {
        alert(`Erreur validation : ${err2.response?.data?.message || err2.message}`);
      }
    } finally {
      setValidatingId(null);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm('Confirmer le rejet de ce paiement ?')) return;
    setValidatingId(paymentId);
    try {
      await api.patch(`/api/admin/payments/${paymentId}/reject`, { status: 'REJETE' });
      await loadPayments();
    } catch (err) {
      alert(`Erreur rejet : ${err.response?.data?.message || err.message}`);
    } finally {
      setValidatingId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'LV';

  const getVehicleIcon = (v) => {
    const u = (v || '').toUpperCase();
    if (u === 'VOITURE') return <Car size={16} />;
    if (u === 'VELO')    return <Bike size={16} />;
    return <Truck size={16} />; // MOTO
  };

  const getVehicleLabel = (v) => {
    const u = (v || '').toUpperCase();
    if (u === 'VOITURE') return 'Voiture';
    if (u === 'VELO')    return 'Vélo';
    return 'Moto';
  };

  const getStatusColor = (s) => ({
    DISPONIBLE:   { bg: C.successLight,          text: C.success, dot: C.success },
    EN_LIVRAISON: { bg: C.primaryLight,          text: C.primary, dot: C.primary },
    HORS_LIGNE:   { bg: 'rgba(150,150,150,0.1)', text: C.gray,    dot: C.gray    },
    SUSPENDU:     { bg: C.dangerLight,           text: C.danger,  dot: C.danger  },
  }[s] ?? { bg: 'rgba(150,150,150,0.1)', text: C.gray, dot: C.gray });

  // A driver can receive a manual/auto assignment only if connected, in an assignable
  // status, and broadcasting a GPS position.
  const isAssignable = (d) => d.online === true && (d.status === 'DISPONIBLE' || d.status === 'EN_LIVRAISON') && d.hasGps !== false;

  const handleViewDriverOrders = (driver) => {
    setSelectedDriver(driver);
    setShowDriverOrdersModal(true);
  };

  const selectedDriverOrders = selectedDriver
    ? orders.filter((o) => o.livreurAppUserId === String(selectedDriver.appUserId))
    : [];

  // ── Filtered lists ────────────────────────────────────────────────────────────
  const filteredDrivers = drivers.filter(d => {
    const term = searchTerm.toLowerCase();
    const match = [`${d.firstName} ${d.lastName}`, d.id, d.cin, d.zone, d.email, d.phone]
      .some(v => String(v).toLowerCase().includes(term));
    return match &&
      (statusFilter  === 'Tous' || d.status === statusFilter) &&
      (vehicleFilter === 'Tous' || (d.vehicle || '').toUpperCase() === vehicleFilter.toUpperCase());
  });

  const filteredPayments = payments.filter(p => {
    const term = paySearch.toLowerCase();
    const matchSearch = [p.id, p.driverName, p.period, String(p.amount)]
      .some(v => String(v).toLowerCase().includes(term));
    const matchStatus = payStatusFilter === 'Tous' || p.status === payStatusFilter;
    const matchPeriod = payPeriodFilter === 'Tous' || p.period === payPeriodFilter;
    return matchSearch && matchStatus && matchPeriod;
  });

  // unique periods for filter dropdown
  const uniquePeriods = [...new Set(payments.map(p => p.period).filter(Boolean))];

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: C.background,
      backgroundImage: `
        radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
        radial-gradient(#d4c9b0 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 24px 24px',
    }}>
      <Side />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textDark, margin: 0 }}>Console de Gestion des Livreurs</h1>
            <p style={{ fontSize: 13, color: C.textMuted, margin: '2px 0 0' }}>
              Pilotez l'activité, gérez vos équipes, affectez les commandes et suivez les gains en temps réel.
            </p>
          </div>
          <button onClick={() => setIsSimulating(v => !v)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1.5px solid ${isSimulating ? C.success : C.primary}`,
            background: isSimulating ? C.successLight : '#ffffff',
            color: isSimulating ? C.success : C.primary,
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}>
            {isSimulating ? <><RotateCcw size={14} className="animate-spin" />Simulation Active</> : <><Play size={14} />Simuler Livraisons</>}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderBottom: `1px solid ${C.grayLight}`, fontFamily: "'Segoe UI', sans-serif" }}>
          {[
            { key: 'overview',   icon: <Navigation size={15} />, label: 'Carte & Suivi' },
            { key: 'drivers',    icon: <Users size={15} />,      label: `Livreurs (${drivers.length})` },
            { key: 'assignment', icon: <Clock size={15} />,      label: `Affectations (${pendingOrders.length})` },
            { key: 'payments',   icon: <CreditCard size={15} />, label: 'Paiements' },
          ].map(({ key, icon, label }) => (
            <button key={key} onClick={() => setSearchParams({ tab: key })} style={tabStyle(currentTab === key)}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', fontFamily: "'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── TAB 1: CARTE & SUIVI (Leaflet, GPS réel) ────────────────────── */}
          {currentTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, height: '100%', minHeight: 480 }}>
              <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={18} color={C.primary} />
                    <span style={{ fontWeight: 700, color: C.textDark }}>Suivi Temps Réel (Rabat & Environs)</span>
                  </div>
                  <span style={{ fontSize: 11, background: '#faf6ef', padding: '4px 10px', borderRadius: 8, color: C.textMuted }}>
                    {orders.filter(o => o.status !== 'Livrée' && o.status !== 'En attente').length} livraison(s) en cours
                  </span>
                </div>

                <div style={{
                  flex: 1, borderRadius: 12, border: `1px solid ${C.grayLight}`,
                  position: 'relative', overflow: 'hidden', minHeight: 300,
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)', zIndex: 0,
                }}>
                  <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapFlyTo center={mapCenter} zoom={mapZoom} />

                    {drivers.map(d => {
                      if (!(d.online && d.currentLatitude != null && d.currentLongitude != null)) return null;
                      const initials = getInitials(d.name);
                      return (
                        <Marker key={d.id} position={[d.currentLatitude, d.currentLongitude]} icon={createDriverIcon(d.status, initials)}>
                          <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                            <div style={{ fontSize: '12px', padding: '2px' }}>
                              <strong style={{ color: C.textDark }}>{d.name}</strong><br />
                              <span>Statut: {statusLabel[d.status] || d.status}</span><br />
                              <span>Véhicule: {getVehicleLabel(d.vehicle)}</span>
                            </div>
                          </Tooltip>
                          <Popup>
                            <div style={{ fontSize: '12px' }}>
                              <strong style={{ color: C.textDark }}>{d.name}</strong><br />
                              <span>Statut: {statusLabel[d.status] || d.status} {d.online ? '● (En ligne)' : '○'}</span><br />
                              <span>Véhicule: {getVehicleLabel(d.vehicle)}</span><br />
                              <span>Zone: {d.zone}</span><br />
                              <span>Livraisons: {d.deliveries} | Note: {d.rating} ⭐</span>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {orders.map(order => {
                      if (!(order.driverId && order.status !== 'Livrée' && order.status !== 'En attente' && order.lat != null && order.lng != null)) return null;
                      return (
                        <Marker key={order.id} position={[order.lat, order.lng]} icon={customerIcon}>
                          <Popup>
                            <div style={{ fontSize: '12px' }}>
                              <strong style={{ color: C.primary }}>Commande {order.id}</strong><br />
                              <span>Client: {order.client}</span><br />
                              <span>Adresse: {order.address}</span><br />
                              <span>Montant: {order.amount}</span><br />
                              <span>Statut: {order.status}</span>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textDark, margin: '0 0 16px' }}>Suivi des Commandes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
                  {orders.filter(o => o.status !== 'Livrée' && o.status !== 'En attente').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: C.gray }}>
                      <Truck size={32} style={{ strokeWidth: 1.5, marginBottom: 8 }} />
                      <p style={{ fontSize: 12, margin: 0 }}>Aucune livraison active.</p>
                      <p style={{ fontSize: 10, marginTop: 4 }}>Affectez des commandes dans l'onglet dédié.</p>
                    </div>
                  ) : orders.map(o => {
                    if (!o.driverId || o.status === 'Livrée' || o.status === 'En attente') return null;
                    const driver = drivers.find(d => String(d.appUserId) === o.livreurAppUserId);
                    const badge = getStatusColor(o.status);
                    return (
                      <div key={o.id} style={{ padding: 12, background: '#fafafa', borderRadius: 10, border: `1px solid ${C.grayLight}`, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: C.primary }}>{o.id}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.text }}>{o.status}</span>
                        </div>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, color: C.textDark }}>Client: {o.client}</p>
                        <p style={{ margin: '0 0 8px', color: C.textMuted, fontSize: 11 }}>Dest: {o.address}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                          <span style={{ color: C.textMuted }}>Livreur : {driver ? driver.name : 'Inconnu'}</span>
                          <span style={{ fontWeight: 700, color: C.primary }}>ETA: {o.eta}</span>
                        </div>
                        <div style={{ height: 6, background: '#edeae4', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ width: `${o.progress}%`, height: '100%', background: C.primary, borderRadius: 3, transition: 'width 1s ease' }} />
                        </div>
                        {driver && driver.currentLatitude != null && driver.currentLongitude != null && (
                          <button
                            onClick={() => { setMapCenter([driver.currentLatitude, driver.currentLongitude]); setMapZoom(15); }}
                            style={{
                              width: '100%', marginTop: 6, padding: '6px 10px', borderRadius: 6,
                              background: C.primaryLight, color: C.primary, border: 'none',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,140,6,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = C.primaryLight}
                          >
                            <MapPin size={12} />Suivre sur la carte
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: LIVREURS ──────────────────────────────────────────────── */}
          {currentTab === 'drivers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.gray }} />
                    <input type="text" placeholder="Rechercher par nom, CIN, zone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      style={{ ...inputStyle, padding: '8px 12px 8px 36px', borderRadius: 8, background: '#faf6ef' }} />
                  </div>
                  <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                    <option value="Tous">Tous véhicules</option>
                    <option value="Moto">Motos</option>
                    <option value="Voiture">Voitures</option>
                    <option value="Vélo">Vélos</option>
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                    <option value="Tous">Tous statuts</option>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="EN_LIVRAISON">En livraison</option>
                    <option value="HORS_LIGNE">Hors ligne</option>
                    <option value="SUSPENDU">Suspendu</option>
                  </select>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{
                  padding: '8px 16px', borderRadius: 8, background: C.primary, color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 12px ${C.primary}33`,
                }}>
                  <Plus size={14} />Créer un compte Livreur
                </button>
              </div>

              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#faf6ef', color: C.textMuted, textTransform: 'uppercase', fontSize: 10, fontWeight: 700, textAlign: 'left', borderBottom: `1px solid ${C.grayLight}` }}>
                      {['Livreur', 'CIN & Contact', 'Véhicule / Zone', 'Livraisons', 'Note', 'Statut', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '16px 20px', textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: C.gray }}>Aucun livreur trouvé.</td></tr>
                    ) : filteredDrivers.map(d => {
                      const sc = getStatusColor(d.status);
                      return (
                        <tr key={d.id} style={{ borderBottom: `1px solid ${C.grayLight}` }}>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primaryLight, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, border: `1.5px solid ${C.primary}33`, overflow: 'hidden' }}>
                                {d.photo ? <img src={d.photo} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(`${d.firstName} ${d.lastName}`)}
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, color: C.textDark, display: 'block' }}>{d.firstName} {d.lastName}</span>
                                <span style={{ fontSize: 10, color: C.textMuted }}>ID: {d.id}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ fontWeight: 600, color: C.textDark, display: 'block' }}>{d.phone}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>CIN: {d.cin} | {d.email}</span>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: C.textDark }}>{getVehicleIcon(d.vehicle)}<span>{getVehicleLabel(d.vehicle)}</span></div>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{d.zone}</span>
                          </td>
                          <td style={{ padding: '12px 20px', fontWeight: 700, color: C.textDark }}>{d.deliveries}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#f3b137' }}>
                              <Star size={14} fill="#f3b137" /><span>{d.rating}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                              {statusLabel[d.status] ?? d.status}
                            </span>
                            {d.online && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: C.success, fontWeight: 600 }}>● En ligne</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                              {d.currentLatitude != null && d.currentLongitude != null && (
                                <button
                                  onClick={() => { setMapCenter([d.currentLatitude, d.currentLongitude]); setMapZoom(15); setSearchParams({ tab: 'overview' }); }}
                                  title="Suivre la localisation"
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.primary, padding: 6, borderRadius: 6, transition: 'background 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  <MapPin size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDriverOrders(d)}
                                title="Voir les commandes"
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.success, padding: 6, borderRadius: 6, transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = C.successLight}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <Eye size={15} />
                              </button>
                              <button onClick={() => handleEditClick(d)} title="Modifier" style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.primary, padding: 6, borderRadius: 6 }}>
                                <Edit size={15} />
                              </button>
                              <button onClick={() => handleDeleteClick(d)} title="Désactiver/Supprimer" style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.danger, padding: 6, borderRadius: 6 }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: AFFECTATIONS ──────────────────────────────────────────── */}
          {currentTab === 'assignment' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textDark, margin: '0 0 16px' }}>
                  Commandes en Attente d'Affectation ({pendingOrders.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: C.gray }}>
                      <CheckCircle2 size={36} color={C.success} style={{ marginBottom: 12 }} />
                      <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>Toutes les commandes sont affectées !</p>
                      <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Revenez plus tard lorsqu'une nouvelle commande sera enregistrée.</p>
                    </div>
                  ) : pendingOrders.map(o => (
                    <div key={o.id} style={{ padding: 16, borderRadius: 12, border: `1.5px solid ${C.grayLight}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: C.primary, fontSize: 14 }}>{o.id}</span>
                          <span style={{ fontSize: 11, color: C.textMuted }}>{o.date}</span>
                        </div>
                        <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.textDark, fontSize: 13 }}>Client: {o.client}</p>
                        <p style={{ margin: '0 0 6px', color: C.textMuted, fontSize: 12 }}>Adresse: {o.address}</p>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#faf6ef', color: C.textDark }}>{o.amount}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => handleAssignClick(o)} disabled={autoAssigningOrderId !== null}
                          style={{ padding: '8px 14px', borderRadius: 8, background: '#fff', border: `1.5px solid ${C.primary}`, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Affecter Manuellement
                        </button>
                        <button onClick={() => handleAutoAssign(o.id)} disabled={autoAssigningOrderId !== null}
                          style={{ padding: '8px 14px', borderRadius: 8, background: C.primary, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {autoAssigningOrderId === o.id ? <><RotateCcw size={12} className="animate-spin" />Affectation...</> : 'Affectation Auto'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...card }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textDark, margin: '0 0 16px' }}>
                  Livreurs assignables ({drivers.filter(isAssignable).length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {drivers.filter(isAssignable).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: C.gray }}>
                      <AlertTriangle size={24} style={{ color: C.warning, marginBottom: 8 }} />
                      <p style={{ fontSize: 12, margin: 0 }}>Aucun livreur assignable.</p>
                      <p style={{ fontSize: 10, marginTop: 4 }}>Connecté + statut DISPONIBLE/EN_LIVRAISON + GPS requis.</p>
                    </div>
                  ) : drivers.filter(isAssignable).map(d => (
                    <div key={d.id} style={{ padding: 10, borderRadius: 8, background: '#fafafa', border: `1px solid ${C.grayLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: C.textDark }}>{d.name}</span>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{d.vehicle} | {d.zone} {d.hasGps ? '📍' : '⚠️ sans GPS'}</div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: C.successLight, color: C.success }}>En ligne</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: PAIEMENTS (filtres, stats, factures, gestion d'erreurs) ── */}
          {currentTab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Commission / Livraison', value: '10 DH', sub: 'Forfait fixe par commande', icon: <Banknote size={18} color={C.primary} />, color: C.primary },
                  { label: 'En attente de validation', value: `${payStats.pending.toLocaleString()} MAD`, sub: `${payStats.pendingCount} livreur(s) en attente`, icon: <Clock size={18} color={C.warning} />, color: C.warning },
                  { label: 'Total validé ce mois', value: `${payStats.validated.toLocaleString()} MAD`, sub: 'Virements confirmés', icon: <CheckCircle2 size={18} color={C.success} />, color: C.success },
                  { label: 'Volume total', value: `${payStats.total.toLocaleString()} MAD`, sub: 'Toutes périodes confondues', icon: <BarChart2 size={18} color={C.textDark} />, color: C.textDark },
                ].map(({ label, value, sub, icon, color }) => (
                  <div key={label} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gray }}>{label}</span>
                      {icon}
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Filters + Refresh bar */}
              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.gray }} />
                    <input type="text" placeholder="Rechercher livreur, période, montant…" value={paySearch} onChange={e => setPaySearch(e.target.value)}
                      style={{ ...inputStyle, padding: '7px 10px 7px 32px', borderRadius: 8, background: '#faf6ef' }} />
                  </div>

                  <select value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '7px 12px', borderRadius: 8, cursor: 'pointer' }}>
                    <option value="Tous">Tous statuts</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="VALIDE">Validé</option>
                    <option value="REJETE">Rejeté</option>
                  </select>

                  {uniquePeriods.length > 0 && (
                    <select value={payPeriodFilter} onChange={e => setPayPeriodFilter(e.target.value)}
                      style={{ ...inputStyle, width: 'auto', padding: '7px 12px', borderRadius: 8, cursor: 'pointer' }}>
                      <option value="Tous">Toutes périodes</option>
                      {uniquePeriods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                </div>

                <button onClick={loadPayments} disabled={payLoading} style={{
                  padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${C.grayLight}`,
                  background: '#fff', color: C.textDark, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {payLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Actualiser
                </button>
              </div>

              {/* Error state */}
              {payError && (
                <div style={{ ...card, background: C.dangerLight, border: `1.5px solid ${C.danger}33`, display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                  <AlertTriangle size={20} color={C.danger} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: C.danger, fontSize: 13 }}>Erreur de chargement</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textDark }}>{payError}</p>
                  </div>
                  <button onClick={loadPayments} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.danger}`, background: '#fff', color: C.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Réessayer
                  </button>
                </div>
              )}

              {/* Payments table */}
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {payLoading && payments.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, color: C.gray }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
                    <p style={{ margin: 0, fontSize: 13 }}>Chargement des paiements…</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#faf6ef', color: C.textMuted, textTransform: 'uppercase', fontSize: 10, fontWeight: 700, textAlign: 'left', borderBottom: `1px solid ${C.grayLight}` }}>
                        {['Référence', 'Livreur', 'Période', 'Livraisons', 'Montant', 'Statut', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '50px 0', color: C.gray }}>
                            <Banknote size={28} style={{ strokeWidth: 1.5, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                            <p style={{ margin: 0, fontSize: 13 }}>Aucun paiement correspondant aux filtres.</p>
                          </td>
                        </tr>
                      ) : filteredPayments.map(p => {
                        const ps = getPayStatus(p.status);
                        const isProcessing = validatingId === p.id;
                        const isPending = ['EN_ATTENTE', 'En attente'].includes(p.status);
                        return (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${C.grayLight}`, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#faf8f4'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontWeight: 700, color: C.primary }}>#{p.id}</span>
                              {p.createdAt && (
                                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Calendar size={10} />
                                  {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primaryLight, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>
                                  {getInitials(p.driverName)}
                                </div>
                                <div>
                                  <span style={{ fontWeight: 600, color: C.textDark, display: 'block' }}>{p.driverName}</span>
                                  {p.phone && <span style={{ fontSize: 10, color: C.textMuted }}>{p.phone}</span>}
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 20px', color: C.textMuted }}>{p.period}</td>

                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontWeight: 700, color: C.textDark }}>{p.deliveries}</span>
                              <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 4 }}>livraisons</span>
                            </td>

                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: C.textDark }}>{Number(p.amount).toLocaleString('fr-MA')}</span>
                              <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>MAD</span>
                            </td>

                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.text, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ps.text }} />
                                {ps.label}
                              </span>
                            </td>

                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {isPending && (
                                  <>
                                    <button onClick={() => handleValidatePayment(p.id)} disabled={isProcessing}
                                      style={{ padding: '5px 10px', borderRadius: 6, background: C.success, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: isProcessing ? 0.7 : 1 }}>
                                      {isProcessing ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                      Valider
                                    </button>
                                    <button onClick={() => handleRejectPayment(p.id)} disabled={isProcessing}
                                      style={{ padding: '5px 10px', borderRadius: 6, background: 'none', border: `1.5px solid ${C.danger}`, color: C.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
                                      Rejeter
                                    </button>
                                  </>
                                )}
                                <button onClick={() => { setSelectedPayment(p); setShowInvoiceModal(true); }}
                                  style={{ padding: '5px 10px', borderRadius: 6, background: '#fff', border: `1px solid ${C.gray}`, color: C.textDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <FileText size={11} />Facture
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Table footer */}
                {!payLoading && filteredPayments.length > 0 && (
                  <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.grayLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.textMuted }}>
                    <span>{filteredPayments.length} résultat(s) affiché(s) sur {payments.length} paiement(s)</span>
                    <span style={{ fontWeight: 600, color: C.textDark }}>
                      Total filtré : {filteredPayments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString('fr-MA')} MAD
                    </span>
                  </div>
                )}
              </div>

              {/* Inline spinner keyframe */}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL: AJOUT LIVREUR ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...card, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textDark }}>Créer un Compte Livreur</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Nom *</label><input required type="text" value={addForm.lastName} onChange={e => setAddForm({ ...addForm, lastName: e.target.value })} style={inputStyle} placeholder="Ex: Benali" /></div>
              <div><label style={labelStyle}>Prénom *</label><input required type="text" value={addForm.firstName} onChange={e => setAddForm({ ...addForm, firstName: e.target.value })} style={inputStyle} placeholder="Ex: Yassine" /></div>
              <div><label style={labelStyle}>CIN *</label><input required type="text" value={addForm.cin} onChange={e => setAddForm({ ...addForm, cin: e.target.value })} style={inputStyle} placeholder="Ex: BE123456" /></div>
              <div><label style={labelStyle}>Téléphone *</label><input required type="text" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} style={inputStyle} placeholder="Ex: 06XXXXXXXX" /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Email *</label><input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Adresse *</label><input required type="text" value={addForm.adresse} onChange={e => setAddForm({ ...addForm, adresse: e.target.value })} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Véhicule</label>
                <select value={addForm.vehicle} onChange={e => setAddForm({ ...addForm, vehicle: e.target.value })} style={inputStyle}>
                  <option value="Moto">🏍 Moto</option><option value="Voiture">🚗 Voiture</option><option value="Vélo">🚲 Vélo</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zone *</label><input required type="text" value={addForm.zone} onChange={e => setAddForm({ ...addForm, zone: e.target.value })} style={inputStyle} placeholder="Ex: Rabat Centre" /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Mot de passe (vide = auto)</label><input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} style={inputStyle} placeholder="Wsl@2026!" /></div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.grayLight}`, background: '#fff', color: C.textDark, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREDENTIALS ───────────────────────────────────────────────── */}
      {credentialsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ ...card, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <Award size={36} color={C.success} style={{ alignSelf: 'center' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textDark }}>Compte Créé avec Succès</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted }}>Identifiants pour <strong>{credentialsModal.name}</strong> :</p>
            </div>
            <div style={{ background: '#faf6ef', padding: 12, borderRadius: 8, textAlign: 'left', fontSize: 12, border: `1px dashed ${C.primary}` }}>
              <p style={{ margin: '0 0 6px' }}><strong>Email :</strong> {credentialsModal.email}</p>
              <p style={{ margin: 0 }}><strong>Mot de passe :</strong> <span style={{ color: C.primary, fontWeight: 700 }}>{credentialsModal.password}</span></p>
            </div>
            <button onClick={() => setCredentialsModal(null)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: C.success, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Fermer & Copier</button>
          </div>
        </div>
      )}

      {/* ── MODAL: ÉDITION LIVREUR ───────────────────────────────────────────── */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...card, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textDark }}>Modifier Profil Livreur</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowEditModal(false)} />
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Nom *</label><input required type="text" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Prénom *</label><input required type="text" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>CIN</label><input type="text" value={editForm.cin} onChange={e => setEditForm({ ...editForm, cin: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Téléphone *</label><input required type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Email *</label><input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Adresse</label><input type="text" value={editForm.adresse} onChange={e => setEditForm({ ...editForm, adresse: e.target.value })} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Véhicule</label>
                <select value={editForm.vehicle} onChange={e => setEditForm({ ...editForm, vehicle: e.target.value })} style={inputStyle}>
                  <option value="MOTO">🏍 Moto</option><option value="VOITURE">🚗 Voiture</option><option value="VELO">🚲 Vélo</option>
                </select>
              </div>
              <div><label style={labelStyle}>Zone de travail</label><input required type="text" value={editForm.zone} onChange={e => setEditForm({ ...editForm, zone: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Statut (administration)</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                  <option value="HORS_LIGNE">💤 Hors ligne</option>
                  <option value="SUSPENDU">🚫 Suspendu</option>
                </select>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: C.textMuted }}>
                  Disponible / En livraison sont gérés automatiquement quand le livreur se connecte à l'app.
                </p>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.grayLight}`, background: '#fff', color: C.textDark, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${C.primary}44` }}>💾 Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUSPENDRE / SUPPRIMER ────────────────────────────────────── */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...card, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textDark }}>Désactiver / Supprimer</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowDeleteModal(false)} />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>Action sur <strong>{selectedDriver?.firstName} {selectedDriver?.lastName}</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button onClick={confirmDeactivate} style={{ padding: 12, borderRadius: 8, border: `1px solid ${C.warning}`, background: C.warningLight, color: C.textDark, textAlign: 'left', cursor: 'pointer', fontSize: 12 }}>
                <strong>Désactiver Temporairement</strong>
                <span style={{ display: 'block', fontSize: 10, color: C.textMuted, marginTop: 2 }}>Le compte reste actif sans recevoir de commandes.</span>
              </button>
              <button onClick={confirmDelete} style={{ padding: 12, borderRadius: 8, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.textDark, textAlign: 'left', cursor: 'pointer', fontSize: 12 }}>
                <strong>Supprimer Définitivement</strong>
                <span style={{ display: 'block', fontSize: 10, color: C.textMuted, marginTop: 2 }}>Effacement permanent de la base de données.</span>
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gray}`, background: '#fff', color: C.textDark, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AFFECTATION MANUELLE ─────────────────────────────────────── */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...card, width: '100%', maxWidth: 450, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textDark }}>Affecter commande {selectedOrder?.id}</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAssignModal(false)} />
            </div>
            <div style={{ background: '#faf6ef', padding: 10, borderRadius: 8, fontSize: 12 }}>
              <p style={{ margin: '0 0 2px' }}><strong>Client :</strong> {selectedOrder?.client}</p>
              <p style={{ margin: 0 }}><strong>Adresse :</strong> {selectedOrder?.address}</p>
            </div>

            <h4 style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 700, color: C.textMuted }}>Livreurs disponibles pour affectation</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {drivers.filter(isAssignable).length === 0 ? (
                <p style={{ fontSize: 12, color: C.danger, textAlign: 'center', padding: '10px 0' }}>
                  Aucun livreur assignable (connecté + disponible/en livraison + GPS requis).
                </p>
              ) : drivers.filter(isAssignable).map(d => (
                <div key={d.id} onClick={() => confirmAssign(d.id)}
                  style={{ padding: 10, borderRadius: 8, border: `1.5px solid ${C.grayLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = '#fff6ea'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.grayLight; e.currentTarget.style.background = 'none'; }}>
                  <div>
                    <span style={{ fontWeight: 700, color: C.textDark, fontSize: 12 }}>{d.firstName} {d.lastName}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, display: 'block' }}>{d.vehicle} | Zone: {d.zone}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>Sélectionner</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAssignModal(false)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gray}`, background: '#fff', color: C.textDark, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FACTURE ───────────────────────────────────────────────────── */}
      {showInvoiceModal && selectedPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...card, width: '100%', maxWidth: 520, padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${C.primary}`, paddingBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.primary }}>WASILATTI</h2>
                <span style={{ fontSize: 10, color: C.textMuted }}>Livraisons Express Maroc</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textDark }}>FACTURE DE PRESTATION</h3>
                <span style={{ fontSize: 10, color: C.textMuted }}>Réf: FACT-{selectedPayment.id}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 11 }}>
              <div>
                <span style={{ color: C.textMuted, display: 'block', textTransform: 'uppercase', fontSize: 9, fontWeight: 700 }}>Émetteur :</span>
                <strong>Wasilatti SARL</strong>
                <p style={{ margin: '2px 0 0', color: C.textMuted }}>Hay Riad, Avenue Annakhil<br />Rabat, Maroc</p>
              </div>
              <div>
                <span style={{ color: C.textMuted, display: 'block', textTransform: 'uppercase', fontSize: 9, fontWeight: 700 }}>Prestataire :</span>
                <strong>{selectedPayment.driverName}</strong>
                <p style={{ margin: '2px 0 0', color: C.textMuted }}>
                  ID: {selectedPayment.driverId}<br />
                  Période: {selectedPayment.period}
                  {selectedPayment.iban && <><br />IBAN: {selectedPayment.iban}</>}
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#faf6ef', borderBottom: `1px solid ${C.grayLight}`, textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: 8 }}>Description</th>
                  <th style={{ padding: 8, textAlign: 'center' }}>Qté</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>P.U.</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${C.grayLight}` }}>
                  <td style={{ padding: 8 }}>Prestations de livraison à domicile</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{selectedPayment.deliveries}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>10.00 MAD</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{Number(selectedPayment.amount).toLocaleString('fr-MA')} MAD</td>
                </tr>
              </tbody>
            </table>

            <div style={{ alignSelf: 'flex-end', width: 220, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.grayLight}`, paddingBottom: 4 }}>
                <span style={{ color: C.textMuted }}>Total Brut :</span>
                <span>{Number(selectedPayment.amount).toLocaleString('fr-MA')} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.grayLight}`, paddingBottom: 4 }}>
                <span style={{ color: C.textMuted }}>Commission :</span><span>0.00 MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                <span>Net à Payer :</span>
                <span style={{ color: C.primary }}>{Number(selectedPayment.amount).toLocaleString('fr-MA')} MAD</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: C.textMuted }}>
              <span>Statut : <strong style={{ color: getPayStatus(selectedPayment.status).text }}>{getPayStatus(selectedPayment.status).label}</strong></span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => window.print()} style={{ border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', color: C.primary }}>Imprimer</button>
                <button onClick={() => setShowInvoiceModal(false)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gray}`, background: '#fff', color: C.textDark, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: COMMANDES DU LIVREUR ──────────────────────────────────────── */}
      {showDriverOrdersModal && selectedDriver && (
        <div 
          onClick={() => setShowDriverOrdersModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ ...card, width: '100%', maxWidth: 680, maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.grayLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textDark }}>
                  Commandes de {selectedDriver.firstName} {selectedDriver.lastName}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted }}>
                  {selectedDriver.zone} · {selectedDriverOrders.length} commande(s) assignée(s)
                </p>
              </div>
              <button 
                onClick={() => setShowDriverOrdersModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 22px' }}>
              {selectedDriverOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.gray }}>
                  <Truck size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Aucune commande assignée à ce livreur.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: 700, textAlign: 'left' }}>
                      <th style={{ padding: '0 0 10px' }}>ID</th>
                      <th style={{ padding: '0 0 10px' }}>Client</th>
                      <th style={{ padding: '0 0 10px' }}>Adresse</th>
                      <th style={{ padding: '0 0 10px' }}>Montant</th>
                      <th style={{ padding: '0 0 10px' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDriverOrders.map((o) => (
                      <tr key={o.id} style={{ borderTop: `1px solid ${C.grayLight}` }}>
                        <td style={{ padding: '10px 0', fontWeight: 700, color: C.primary }}>{o.id}</td>
                        <td style={{ padding: '10px 0', color: C.textDark }}>{o.client}</td>
                        <td style={{ padding: '10px 0', color: C.textMuted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.address}</td>
                        <td style={{ padding: '10px 0', fontWeight: 600, color: C.textDark }}>{o.amount}</td>
                        <td style={{ padding: '10px 0' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: C.primaryLight, color: C.primary }}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer with Close Button */}
            <div style={{ padding: '12px 22px', borderTop: `1px solid ${C.grayLight}`, display: 'flex', justifyContent: 'flex-end', background: '#fafafa' }}>
              <button 
                onClick={() => setShowDriverOrdersModal(false)} 
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.gray}`, background: '#fff', color: C.textDark, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LivreursPage;
