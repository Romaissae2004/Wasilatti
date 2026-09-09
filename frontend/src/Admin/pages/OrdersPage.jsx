import React, { useState, useEffect, useCallback } from 'react';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import axios from '../../api/axiosConfig';
import {
  ShoppingBag, Search, RefreshCw, CheckCircle, XCircle, Truck,
  Trash2, ChevronDown, ChevronUp, Eye, X, User, MapPin, Phone,
  Package, AlertCircle, Clock, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  primary:       '#f48c06',
  primaryLight:  'rgba(244,140,6,0.10)',
  success:       '#50afa8',
  successLight:  'rgba(80,175,168,0.10)',
  danger:        '#e07070',
  dangerLight:   'rgba(224,112,112,0.10)',
  warning:       '#f3b137',
  warningLight:  'rgba(243,177,55,0.10)',
  gray:          '#969696',
  grayLight:     '#ede8df',
  bg:            '#f5f0e8',
  card:          '#ffffff',
  textDark:      '#2d2a22',
  textMuted:     '#7c7667',
};

const card = {
  background: C.card,
  borderRadius: 16,
  border: `1px solid ${C.grayLight}`,
  boxShadow: '0 2px 12px rgba(180,140,80,0.06)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META = {
  EN_ATTENTE:   { label: 'En attente',   color: C.warning,  bg: C.warningLight,  icon: Clock        },
  CONFIRMÉE:    { label: 'Confirmée',    color: C.success,  bg: C.successLight,  icon: CheckCircle  },
  EN_LIVRAISON: { label: 'En livraison', color: C.primary,  bg: C.primaryLight,  icon: Truck        },
  LIVRÉE:       { label: 'Livrée',       color: '#4caf50',  bg: 'rgba(76,175,80,0.10)', icon: CheckCircle },
  ANNULÉE:      { label: 'Annulée',      color: C.danger,   bg: C.dangerLight,   icon: XCircle      },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: C.gray, bg: 'rgba(150,150,150,0.1)', icon: AlertCircle };
  const Icon = meta.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 8,
      fontSize: 11, fontWeight: 700,
      background: meta.bg, color: meta.color,
    }}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-MA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

// ─── Modal générique ──────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        ...card, padding: '28px 32px', width, maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: "'Segoe UI', sans-serif",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textDark }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const OrdersPage = () => {
  const [orders,       setOrders]       = useState([]);
  const [drivers,      setDrivers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading,setActionLoading]= useState(null); // orderId en cours

  // Filtres
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');
  const [searchFocused,setSearchFocused]= useState(false);

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Expanded rows (détail articles)
  const [expanded, setExpanded] = useState(null);

  // Modals
  const [detailModal,  setDetailModal]  = useState(null);  // commande complète
  const [assignModal,  setAssignModal]  = useState(null);  // commande à réaffecter
  const [deleteModal,  setDeleteModal]  = useState(null);  // commande à supprimer
  const [confirmModal, setConfirmModal] = useState(null);  // confirmation action générique
  // { order, action: 'confirm'|'cancel', label, color }

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Chargement données ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resOrders, resDrivers] = await Promise.all([
        axios.get('/api/admin/orders'),
        axios.get('/api/users/livreurs'),
      ]);
      setOrders((resOrders.data?.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setDrivers(resDrivers.data?.data || []);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des données.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const doAction = async (fn, successMsg) => {
    try {
      await fn();
      await fetchAll();
      showToast(successMsg, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Erreur.', 'error');
    }
  };

  const handleConfirmOrder = async (order) => {
    setActionLoading(order.id);
    await doAction(
      () => axios.post(`/api/admin/orders/${order.id}/confirm`),
      `Commande #${order.id} confirmée. La distribution automatique assignera un livreur si disponible.`
    );
    setActionLoading(null);
    setConfirmModal(null);
  };

  const handleCancelOrder = async (order) => {
    setActionLoading(order.id);
    await doAction(
      () => axios.post(`/api/admin/orders/${order.id}/cancel`),
      `Commande #${order.id} annulée. Stocks rétablis.`
    );
    setActionLoading(null);
    setConfirmModal(null);
  };

  const handleDeleteOrder = async (order) => {
    setActionLoading(order.id);
    await doAction(
      () => axios.delete(`/api/admin/orders/${order.id}`),
      `Commande #${order.id} supprimée.`
    );
    setActionLoading(null);
    setDeleteModal(null);
  };

  const handleAssign = async (order, driverId) => {
    setActionLoading(order.id);
    await doAction(
      () => axios.post(`/api/admin/orders/${order.id}/assign-livreur?livreurId=${driverId}`),
      `Livreur réaffecté avec succès sur la commande #${order.id}.`
    );
    setActionLoading(null);
    setAssignModal(null);
  };

  const handleTogglePaid = async (order) => {
    setActionLoading(order.id);
    await doAction(
      () => axios.put(`/api/admin/orders/${order.id}/toggle-paid`),
      `Statut de paiement de la commande #${order.id} modifié.`
    );
    setActionLoading(null);
    if (detailModal && detailModal.id === order.id) {
      setDetailModal(prev => prev ? { ...prev, paid: !prev.paid } : null);
    }
  };

  // ── Filtres & Pagination ──────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch =
      String(o.id).includes(q) ||
      (o.clientUsername || '').toLowerCase().includes(q) ||
      (o.deliveryAddress || '').toLowerCase().includes(q) ||
      (o.contactPhone || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'TOUS' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => setPage(1), [search, statusFilter]);

  // ── Boutons d'action par statut ──────────────────────────────────────────
  const ActionButtons = ({ order }) => {
    const busy = actionLoading === order.id;
    const btnBase = {
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 7, border: 'none',
      fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
      opacity: busy ? 0.6 : 1, transition: 'all 0.15s',
    };

    const actions = [];

    if (order.status === 'EN_ATTENTE') {
      actions.push(
        <button key="confirm" style={{ ...btnBase, background: C.successLight, color: C.success }}
          onClick={() => setConfirmModal({ order, action: 'confirm', label: 'Confirmer la commande', color: C.success })}>
          <CheckCircle size={12} /> Confirmer
        </button>
      );
    }
    if (['EN_ATTENTE', 'CONFIRMÉE', 'EN_LIVRAISON'].includes(order.status) && !order.livreur) {
      actions.push(
        <button key="assign" style={{ ...btnBase, background: C.primaryLight, color: C.primary }}
          onClick={() => setAssignModal(order)}>
          <Truck size={12} /> Affecter livreur
        </button>
      );
    }
    if (!['LIVRÉE', 'ANNULÉE'].includes(order.status)) {
      actions.push(
        <button key="cancel" style={{ ...btnBase, background: C.dangerLight, color: C.danger }}
          onClick={() => setConfirmModal({ order, action: 'cancel', label: 'Annuler la commande', color: C.danger })}>
          <XCircle size={12} /> Annuler
        </button>
      );
    }
    if (['LIVRÉE', 'ANNULÉE'].includes(order.status)) {
      actions.push(
        <button key="delete" style={{ ...btnBase, background: '#f5e0e0', color: '#b94040' }}
          onClick={() => setDeleteModal(order)}>
          <Trash2 size={12} /> Supprimer
        </button>
      );
    }
    actions.push(
      <button key="detail" style={{ ...btnBase, background: '#f0f0f0', color: C.textMuted }}
        onClick={() => setDetailModal(order)}>
        <Eye size={12} /> Détails
      </button>
    );

    return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{actions}</div>;
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: C.bg,
      backgroundImage: `
        radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
        radial-gradient(#d4c9b0 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 24px 24px',
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <Side />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        {/* ── Header ── */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.textDark, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingBag size={22} color={C.primary} />
              Gestion des Commandes
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: C.textMuted }}>
              {filtered.length} commande{filtered.length !== 1 ? 's' : ''} • Confirmez, réaffectez, annulez ou supprimez
            </p>
          </div>
          <button onClick={fetchAll} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.grayLight}`,
            background: '#fff', color: C.textMuted, fontSize: 12, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
        </div>

        {/* ── KPI Strip ── */}
        <div style={{ display: 'flex', gap: 14, padding: '16px 28px 0' }}>
          {[
            { label: 'Total', val: orders.length, color: C.primary },
            { label: 'En attente', val: orders.filter(o => o.status === 'EN_ATTENTE').length, color: C.warning },
            { label: 'Confirmées', val: orders.filter(o => o.status === 'CONFIRMÉE').length, color: C.success },
            { label: 'En livraison', val: orders.filter(o => o.status === 'EN_LIVRAISON').length, color: '#2196f3' },
            { label: 'Livrées', val: orders.filter(o => o.status === 'LIVRÉE').length, color: '#4caf50' },
            { label: 'Annulées', val: orders.filter(o => o.status === 'ANNULÉE').length, color: C.danger },
          ].map(k => (
            <div key={k.label} style={{
              ...card, padding: '10px 18px', flex: 1, textAlign: 'center',
              borderTop: `3px solid ${k.color}`,
            }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: k.color }}>{k.val}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 28px 0', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.gray }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Rechercher : ID, client, adresse, téléphone..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px 9px 36px', borderRadius: 10, fontSize: 13,
                border: `1.5px solid ${searchFocused ? C.primary : C.grayLight}`,
                outline: 'none', background: '#fff', color: C.textDark,
                transition: 'border 0.2s',
              }}
            />
          </div>

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['TOUS', 'EN_ATTENTE', 'CONFIRMÉE', 'EN_LIVRAISON', 'LIVRÉE', 'ANNULÉE'].map(s => {
              const meta = STATUS_META[s] || { label: 'Tous', color: C.primary, bg: C.primaryLight };
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: active ? (s === 'TOUS' ? C.primary : meta.color) : '#fff',
                  color: active ? '#fff' : (s === 'TOUS' ? C.primary : meta.color),
                  border: `1.5px solid ${s === 'TOUS' ? C.primary : meta.color}`,
                  transition: 'all 0.15s',
                }}>
                  {s === 'TOUS' ? 'Tous' : meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: C.primary }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: 12, fontWeight: 600 }}>Chargement...</span>
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ ...card, padding: '60px 0', textAlign: 'center', color: C.gray }}>
              <Package size={48} style={{ marginBottom: 12, opacity: .4 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Aucune commande trouvée</p>
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>Modifiez vos filtres ou actualisez.</p>
            </div>
          ) : (
            <div style={{ ...card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#faf6ef', borderBottom: `1px solid ${C.grayLight}`, color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', width: 32 }}></th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Client</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Adresse</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Livreur</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Montant</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Payé</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Statut</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(order => (
                    <React.Fragment key={order.id}>
                      <tr style={{ borderBottom: `1px solid ${C.grayLight}`, background: expanded === order.id ? '#fafaf7' : '#fff', transition: 'background .15s' }}>
                        {/* Expand toggle */}
                        <td style={{ padding: '12px 8px 12px 16px' }}>
                          <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray, display: 'flex' }}>
                            {expanded === order.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: C.primary }}>#{order.id}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: C.textDark }}>{order.clientUsername || '—'}</div>
                          <div style={{ fontSize: 11, color: C.textMuted }}>{order.contactPhone || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: C.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.deliveryAddress || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {order.livreur ? (
                            <div>
                              <div style={{ fontWeight: 600, color: C.textDark, fontSize: 12 }}>{order.livreur.username}</div>
                              <div style={{ fontSize: 10, color: C.textMuted }}>{order.livreur.phoneNumber}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: C.gray, fontStyle: 'italic' }}>Non affecté</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: C.textDark }}>
                          {order.totalPrice != null ? `${order.totalPrice.toFixed(2)} DH` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleTogglePaid(order)}
                            disabled={actionLoading === order.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: actionLoading === order.id ? 'not-allowed' : 'pointer',
                              background: order.paid ? C.successLight : C.dangerLight,
                              color: order.paid ? C.success : C.danger,
                              border: `1.5px solid ${order.paid ? C.success : C.danger}`,
                              transition: 'all 0.15s',
                            }}
                          >
                            {order.paid ? 'Oui' : 'Non'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={order.status} />
                        </td>
                        <td style={{ padding: '12px 16px', color: C.textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>
                          {fmtDate(order.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <ActionButtons order={order} />
                        </td>
                      </tr>

                      {/* Expanded: articles */}
                      {expanded === order.id && (
                        <tr>
                          <td colSpan={10} style={{ background: '#f9f7f3', padding: '0 16px 16px 56px', borderBottom: `1px solid ${C.grayLight}` }}>
                            <p style={{ margin: '12px 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                              Articles de la commande
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              {(order.items || []).map(item => (
                                <div key={item.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  background: '#fff', borderRadius: 10, padding: '8px 14px',
                                  border: `1px solid ${C.grayLight}`, fontSize: 12,
                                }}>
                                  {item.product?.imageUrls?.[0] && (
                                    <img src={item.product.imageUrls[0]} alt={item.product.name}
                                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, color: C.textDark }}>{item.product?.name || 'Produit'}</div>
                                    <div style={{ color: C.textMuted, fontSize: 11 }}>
                                      x{item.quantity} — {item.price != null ? `${item.price.toFixed(2)} DH/u` : '—'}
                                    </div>
                                    {item.product?.depotAddress && (
                                      <div style={{ color: C.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <MapPin size={10} /> Dépôt : {item.product.depotAddress}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {(!order.items || order.items.length === 0) && (
                                <span style={{ color: C.gray, fontSize: 12 }}>Aucun article.</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${C.grayLight}`, background: '#faf6ef' }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.grayLight}`, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: C.textMuted, opacity: page === 1 ? .4 : 1 }}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page - 2 + i;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={pg} onClick={() => setPage(pg)} style={{
                        padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                        border: `1px solid ${pg === page ? C.primary : C.grayLight}`,
                        background: pg === page ? C.primary : '#fff',
                        color: pg === page ? '#fff' : C.textMuted, cursor: 'pointer',
                      }}>{pg}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.grayLight}`, background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: C.textMuted, opacity: page === totalPages ? .4 : 1 }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════ MODAL : DÉTAIL COMMANDE ════════════════════════════════════════ */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`Détails — Commande #${detailModal?.id}`} width={540}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <InfoBlock icon={<User size={14} />} label="Client" value={`${detailModal.clientUsername} (${detailModal.clientEmail})`} />
              <InfoBlock icon={<Phone size={14} />} label="Téléphone" value={detailModal.contactPhone || '—'} />
            </div>
            <InfoBlock icon={<MapPin size={14} />} label="Adresse de livraison" value={detailModal.deliveryAddress || '—'} />
            <div style={{ display: 'flex', gap: 12 }}>
              <InfoBlock label="Statut" value={<StatusBadge status={detailModal.status} />} />
              <InfoBlock label="Paiement" value={detailModal.paid ? <span style={{ color: C.success, fontWeight: 'bold' }}>Payé</span> : <span style={{ color: C.danger, fontWeight: 'bold' }}>Non payé</span>} />
              <InfoBlock label="Montant total" value={<strong style={{ color: C.primary }}>{detailModal.totalPrice?.toFixed(2)} DH</strong>} />
            </div>
            {detailModal.livreur && (
              <InfoBlock icon={<Truck size={14} />} label="Livreur affecté"
                value={`${detailModal.livreur.username} — ${detailModal.livreur.phoneNumber || 'N/A'}`} />
            )}
            <InfoBlock label="Créée le" value={fmtDate(detailModal.createdAt)} />
            <hr style={{ borderColor: C.grayLight }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.06em' }}>Articles</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(detailModal.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#faf6ef', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.product?.imageUrls?.[0] && (
                      <img src={item.product.imageUrls[0]} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: C.textDark }}>{item.product?.name}</div>
                      <div style={{ color: C.textMuted }}>x{item.quantity}</div>
                      {item.product?.depotAddress && (
                        <div style={{ color: C.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={10} /> Dépôt : {item.product.depotAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: C.textDark }}>{(item.price * item.quantity).toFixed(2)} DH</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ════ MODAL : AFFECTER / RÉAFFECTER LIVREUR ═════════════════════════ */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Affecter un livreur — Commande #${assignModal?.id}`} width={440}>
        {assignModal && (
          <div>
            {assignModal.livreur && (
              <div style={{ background: C.warningLight, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.warning, fontWeight: 600 }}>
                ⚠️ Livreur actuel : <strong>{assignModal.livreur.username}</strong> — sera remplacé.
              </div>
            )}
            <p style={{ margin: '0 0 12px', fontSize: 13, color: C.textMuted }}>Sélectionnez un livreur disponible :</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {drivers.length === 0 ? (
                <p style={{ color: C.gray, fontSize: 12, textAlign: 'center' }}>Aucun livreur disponible.</p>
              ) : drivers.map(d => {
                const isCurrent = assignModal.livreur?.id === d.id;
                return (
                  <button key={d.id} disabled={isCurrent || actionLoading === assignModal.id}
                    onClick={() => handleAssign(assignModal, d.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${isCurrent ? C.primary : C.grayLight}`,
                      background: isCurrent ? C.primaryLight : '#fff', cursor: isCurrent ? 'default' : 'pointer',
                      transition: 'all .15s', fontSize: 13,
                    }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: C.textDark }}>{d.username}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{d.email}</div>
                    </div>
                    {isCurrent
                      ? <span style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>Actuel</span>
                      : <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>Affecter →</span>
                    }
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* ════ MODAL : CONFIRMER ACTION (confirm / cancel) ════════════════════ */}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal?.label} width={400}>
        {confirmModal && (
          <div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textMuted }}>
              {confirmModal.action === 'confirm'
                ? `Voulez-vous confirmer la commande #${confirmModal.order.id} de ${confirmModal.order.clientUsername} ? Une notification par e-mail sera envoyée.`
                : `Voulez-vous annuler la commande #${confirmModal.order.id} ? Les stocks seront rétablis et le client notifié.`
              }
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmModal(null)}
                style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${C.grayLight}`, background: '#fff', color: C.textMuted, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Annuler
              </button>
              <button
                onClick={() => confirmModal.action === 'confirm'
                  ? handleConfirmOrder(confirmModal.order)
                  : handleCancelOrder(confirmModal.order)
                }
                disabled={actionLoading === confirmModal.order.id}
                style={{
                  padding: '9px 20px', borderRadius: 9, border: 'none',
                  background: confirmModal.color, color: '#fff', fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: 13,
                  opacity: actionLoading === confirmModal.order.id ? .6 : 1,
                }}>
                {actionLoading === confirmModal.order.id ? '...' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ════ MODAL : SUPPRIMER ══════════════════════════════════════════════ */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Supprimer la commande" width={400}>
        {deleteModal && (
          <div>
            <div style={{ background: C.dangerLight, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.danger, fontWeight: 600 }}>
              ⚠️ Cette action est <strong>irréversible</strong>. La commande #{deleteModal.id} sera définitivement supprimée.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal(null)}
                style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${C.grayLight}`, background: '#fff', color: C.textMuted, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Annuler
              </button>
              <button onClick={() => handleDeleteOrder(deleteModal)}
                disabled={actionLoading === deleteModal.id}
                style={{
                  padding: '9px 20px', borderRadius: 9, border: 'none',
                  background: C.danger, color: '#fff', fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: 13,
                  opacity: actionLoading === deleteModal.id ? .6 : 1,
                }}>
                {actionLoading === deleteModal.id ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ════ TOAST ══════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 2000,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'error' ? C.danger : C.success,
          color: '#fff', fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'slideIn .3s ease',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Segoe UI', sans-serif",
        }}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

// ─── Petit composant bloc info ─────────────────────────────────────────────
const InfoBlock = ({ icon, label, value }) => (
  <div style={{ flex: 1, background: '#faf6ef', borderRadius: 10, padding: '10px 14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#969696', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2a22' }}>{value}</div>
  </div>
);

export default OrdersPage;
