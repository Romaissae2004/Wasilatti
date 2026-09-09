import { TYPE_LABELS } from './constants';

export const normalizeComplaint = (raw) => {
  if (!raw) return null;

  return {
    id: raw.id,
    reference: raw.reference || raw.ref || `REC-${String(raw.id).padStart(3, '0')}`,
    clientId: raw.clientId ?? raw.userId ?? null,
    clientName: raw.clientName || raw.client || raw.username || 'Client',
    clientEmail: raw.clientEmail || raw.email || '',
    orderId: raw.orderId ?? null,
    driverId: raw.driverId ?? null,
    driverName: raw.driverName || raw.livreurName || null,
    type: raw.type || 'AUTRE',
    typeLabel: TYPE_LABELS[raw.type] || raw.type || 'Autre',
    subject: raw.subject || raw.title || '',
    description: raw.description || raw.detail || raw.message || '',
    severity: raw.severity || 'MOYENNE',
    status: raw.status || 'EN_ATTENTE',
    adminResponse: raw.adminResponse || raw.response || raw.reply || null,
    createdAt: raw.createdAt || raw.date || null,
    updatedAt: raw.updatedAt || null,
    resolvedAt: raw.resolvedAt || null,
  };
};

export const normalizeComplaints = (list) =>
  (Array.isArray(list) ? list : []).map(normalizeComplaint).filter(Boolean);

export const getApiErrorMessage = (err, fallback = 'Une erreur est survenue.') =>
  err?.response?.data?.message
  || err?.response?.data?.erreur
  || err?.response?.data?.error
  || fallback;

export const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-MA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};
