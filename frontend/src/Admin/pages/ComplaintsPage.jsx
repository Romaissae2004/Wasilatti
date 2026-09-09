import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import complaintService from '../../services/complaintService';
import {
  STATUS_META, SEVERITY_META, COMPLAINT_STATUSES, COMPLAINT_TYPES,
} from '../../features/complaints/constants';
import { fmtDate, getApiErrorMessage } from '../../features/complaints/complaintUtils';
import {
  AlertTriangle, Search, RefreshCw, Eye, X, MessageSquare,
  Clock, CheckCircle2, XCircle, Filter, ChevronLeft, ChevronRight,
  Send, User, Package, Truck,
} from 'lucide-react';

const C = {
  primary: '#f48c06',
  primaryLight: 'rgba(244,140,6,0.10)',
  success: '#50afa8',
  successLight: 'rgba(80,175,168,0.10)',
  danger: '#e07070',
  dangerLight: 'rgba(224,112,112,0.10)',
  warning: '#f3b137',
  warningLight: 'rgba(243,177,55,0.10)',
  gray: '#969696',
  grayLight: '#ede8df',
  bg: '#f5f0e8',
  card: '#ffffff',
  textDark: '#2d2a22',
  textMuted: '#7c7667',
};

const card = {
  background: C.card,
  borderRadius: 16,
  border: `1px solid ${C.grayLight}`,
  boxShadow: '0 2px 12px rgba(180,140,80,0.06)',
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: C.gray, bg: 'rgba(150,150,150,0.1)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 8,
      fontSize: 11, fontWeight: 700,
      background: meta.bg, color: meta.color,
    }}>
      {meta.label}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const meta = SEVERITY_META[severity] || SEVERITY_META.MOYENNE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6,
      fontSize: 10, fontWeight: 700,
      background: meta.bg, color: meta.color,
    }}>
      {meta.label}
    </span>
  );
};

const Modal = ({ open, onClose, title, children, width = 560 }) => {
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
      }} onClick={(e) => e.stopPropagation()}>
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

const StatCard = ({ label, value, color, bg, icon: Icon }) => (
  <div style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textDark }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{label}</p>
    </div>
  </div>
);

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [searchFocused, setSearchFocused] = useState(false);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const [detailModal, setDetailModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await complaintService.getAllComplaints();
      setComplaints(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des plaintes.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'EN_ATTENTE').length,
    inProgress: complaints.filter((c) => c.status === 'EN_COURS').length,
    resolved: complaints.filter((c) => c.status === 'RESOLU').length,
  }), [complaints]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return complaints.filter((c) => {
      if (statusFilter !== 'TOUS' && c.status !== statusFilter) return false;
      if (typeFilter !== 'TOUS' && c.type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.reference?.toLowerCase().includes(q)
        || c.clientName?.toLowerCase().includes(q)
        || c.subject?.toLowerCase().includes(q)
        || c.description?.toLowerCase().includes(q)
      );
    });
  }, [complaints, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  const openDetail = (complaint) => {
    setDetailModal(complaint);
    setReplyText(complaint.adminResponse || '');
    setNewStatus(complaint.status);
  };

  const handleUpdateStatus = async () => {
    if (!detailModal || newStatus === detailModal.status) return;
    setActionLoading('status');
    try {
      const updated = await complaintService.updateStatus(detailModal.id, newStatus);
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setDetailModal(updated);
      showToast('Statut mis à jour avec succès.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Erreur lors de la mise à jour du statut.'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReply = async () => {
    if (!detailModal || !replyText.trim()) {
      showToast('Veuillez saisir une réponse.', 'error');
      return;
    }
    setActionLoading('reply');
    try {
      const updated = await complaintService.replyToComplaint(detailModal.id, replyText.trim());
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setDetailModal(updated);
      showToast('Réponse envoyée au client.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Erreur lors de l\'envoi de la réponse.'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${C.grayLight}`, fontSize: 13,
    fontFamily: "'Segoe UI', sans-serif", color: C.textDark,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg }}>
      <Side />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textDark, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={24} color={C.primary} />
                Gestion des Plaintes
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted }}>
                Consultez, traitez et répondez aux réclamations des clients.
              </p>
            </div>
            <button
              onClick={fetchComplaints}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10,
                background: C.primary, color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard label="Total plaintes" value={stats.total} color={C.primary} bg={C.primaryLight} icon={AlertTriangle} />
            <StatCard label="En attente" value={stats.pending} color={C.warning} bg={C.warningLight} icon={Clock} />
            <StatCard label="En cours" value={stats.inProgress} color={C.primary} bg={C.primaryLight} icon={MessageSquare} />
            <StatCard label="Résolues" value={stats.resolved} color={C.success} bg={C.successLight} icon={CheckCircle2} />
          </div>

          {/* Filters */}
          <div style={{ ...card, padding: '16px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={16} color={C.gray} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Rechercher par référence, client, sujet..."
                style={{
                  ...inputStyle,
                  paddingLeft: 38,
                  borderColor: searchFocused ? C.primary : C.grayLight,
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} color={C.gray} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...inputStyle, width: 'auto', minWidth: 140 }}
              >
                <option value="TOUS">Tous les statuts</option>
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ ...inputStyle, width: 'auto', minWidth: 160 }}
              >
                <option value="TOUS">Tous les types</option>
                {COMPLAINT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ ...card, padding: 60, textAlign: 'center', color: C.primary }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>Chargement des plaintes...</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...card, padding: 60, textAlign: 'center' }}>
              <CheckCircle2 size={40} color={C.success} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: C.textDark, margin: 0 }}>Aucune plainte trouvée</p>
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                {complaints.length === 0 ? 'Aucune réclamation n\'a encore été soumise.' : 'Modifiez vos filtres de recherche.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paginated.map((c) => {
                  const severityMeta = SEVERITY_META[c.severity] || SEVERITY_META.MOYENNE;
                  return (
                    <div
                      key={c.id}
                      style={{
                        ...card,
                        padding: '18px 22px',
                        borderLeft: `5px solid ${severityMeta.color}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, color: C.primary, fontSize: 13 }}>{c.reference}</span>
                          <SeverityBadge severity={c.severity} />
                          <StatusBadge status={c.status} />
                          <span style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(c.createdAt)}</span>
                        </div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.textDark, fontSize: 15 }}>{c.subject}</p>
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                          {c.description.length > 120 ? `${c.description.slice(0, 120)}...` : c.description}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: C.textMuted }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={12} /> {c.clientName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Package size={12} /> {c.typeLabel}
                          </span>
                          {c.orderId && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Package size={12} /> Commande #{c.orderId}
                            </span>
                          )}
                          {c.driverName && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Truck size={12} /> {c.driverName}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openDetail(c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 10,
                          background: C.primaryLight, border: `1.5px solid ${C.primary}33`,
                          color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        <Eye size={14} /> Traiter
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ background: 'none', border: 'none', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={20} color={C.textDark} />
                  </button>
                  <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>
                    Page {page} / {totalPages} ({filtered.length} plaintes)
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ background: 'none', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={20} color={C.textDark} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={`Plainte ${detailModal?.reference || ''}`}
        width={620}
      >
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <StatusBadge status={detailModal.status} />
              <SeverityBadge severity={detailModal.severity} />
            </div>

            <div style={{ background: '#faf6ef', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.textDark }}>{detailModal.subject}</h3>
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{detailModal.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div>
                <span style={{ color: C.textMuted, display: 'block', marginBottom: 2 }}>Client</span>
                <strong style={{ color: C.textDark }}>{detailModal.clientName}</strong>
                {detailModal.clientEmail && (
                  <p style={{ margin: '2px 0 0', color: C.textMuted }}>{detailModal.clientEmail}</p>
                )}
              </div>
              <div>
                <span style={{ color: C.textMuted, display: 'block', marginBottom: 2 }}>Date de soumission</span>
                <strong style={{ color: C.textDark }}>{fmtDate(detailModal.createdAt)}</strong>
              </div>
              <div>
                <span style={{ color: C.textMuted, display: 'block', marginBottom: 2 }}>Type</span>
                <strong style={{ color: C.textDark }}>{detailModal.typeLabel}</strong>
              </div>
              {detailModal.orderId && (
                <div>
                  <span style={{ color: C.textMuted, display: 'block', marginBottom: 2 }}>Commande</span>
                  <strong style={{ color: C.textDark }}>#{detailModal.orderId}</strong>
                </div>
              )}
              {detailModal.driverName && (
                <div>
                  <span style={{ color: C.textMuted, display: 'block', marginBottom: 2 }}>Livreur concerné</span>
                  <strong style={{ color: C.textDark }}>{detailModal.driverName}</strong>
                </div>
              )}
            </div>

            {/* Status update */}
            <div style={{ borderTop: `1px solid ${C.grayLight}`, paddingTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.textDark, display: 'block', marginBottom: 8 }}>
                Mettre à jour le statut
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {COMPLAINT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={actionLoading === 'status' || newStatus === detailModal.status}
                  style={{
                    padding: '10px 16px', borderRadius: 10, border: 'none',
                    background: C.success, color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    opacity: (actionLoading === 'status' || newStatus === detailModal.status) ? 0.6 : 1,
                  }}
                >
                  {actionLoading === 'status' ? '...' : 'Appliquer'}
                </button>
              </div>
            </div>

            {/* Reply */}
            <div style={{ borderTop: `1px solid ${C.grayLight}`, paddingTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.textDark, display: 'block', marginBottom: 8 }}>
                Réponse au client
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Rédigez votre réponse au client..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
              />
              {detailModal.adminResponse && (
                <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 10px' }}>
                  Dernière réponse enregistrée le {fmtDate(detailModal.updatedAt || detailModal.resolvedAt)}
                </p>
              )}
              <button
                onClick={handleReply}
                disabled={actionLoading === 'reply' || !replyText.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: C.primary, color: '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  opacity: (actionLoading === 'reply' || !replyText.trim()) ? 0.6 : 1,
                }}
              >
                <Send size={14} />
                {actionLoading === 'reply' ? 'Envoi...' : 'Envoyer la réponse'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          padding: '14px 20px', borderRadius: 12,
          background: toast.type === 'error' ? C.danger : C.success,
          color: '#fff', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
