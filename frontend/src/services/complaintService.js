import api from '../api/axiosConfig';
import { normalizeComplaint, normalizeComplaints } from '../features/complaints/complaintUtils';

const unwrap = (response) => response.data?.data ?? response.data ?? null;

export const complaintService = {
  /** Plaintes du client connecté */
  async getMyComplaints() {
    const response = await api.get('/api/complaints');
    return normalizeComplaints(unwrap(response));
  },

  /** Soumettre une plainte (client) */
  async submitComplaint(payload) {
    const response = await api.post('/api/complaints', payload);
    return normalizeComplaint(unwrap(response));
  },

  /** Toutes les plaintes (admin) */
  async getAllComplaints(params = {}) {
    const response = await api.get('/api/admin/complaints', { params });
    return normalizeComplaints(unwrap(response));
  },

  /** Détail d'une plainte (admin) */
  async getComplaintById(id) {
    const response = await api.get(`/api/admin/complaints/${id}`);
    return normalizeComplaint(unwrap(response));
  },

  /** Mettre à jour le statut (admin) */
  async updateStatus(id, status) {
    const response = await api.patch(`/api/admin/complaints/${id}/status`, { status });
    return normalizeComplaint(unwrap(response));
  },

  /** Répondre à une plainte (admin) */
  async replyToComplaint(id, adminResponse) {
    const response = await api.post(`/api/admin/complaints/${id}/reply`, { adminResponse });
    return normalizeComplaint(unwrap(response));
  },
};

export default complaintService;
