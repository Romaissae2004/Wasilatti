import api from '../api/axiosConfig';

const unwrap = (response) => response.data?.data ?? response.data ?? null;

export const evaluationService = {
  /** Soumettre une évaluation (client) */
  async submitEvaluation(orderId, rating, comment) {
    const response = await api.post('/api/evaluations', { orderId, rating, comment });
    return unwrap(response);
  },

  /** Obtenir l'évaluation d'une commande (client/admin) */
  async getEvaluationByOrder(orderId) {
    try {
      const response = await api.get(`/api/evaluations/order/${orderId}`);
      return unwrap(response);
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /** Obtenir les évaluations d'un livreur spécifique */
  async getDriverEvaluations(username) {
    const response = await api.get(`/api/evaluations/driver/${username}`);
    return unwrap(response);
  },

  /** Obtenir ses propres évaluations (livreur connecté) */
  async getMyDriverEvaluations() {
    const response = await api.get('/api/evaluations/driver-me');
    return unwrap(response);
  },

  /** Obtenir toutes les évaluations (admin) */
  async getAllEvaluations() {
    const response = await api.get('/api/evaluations');
    return unwrap(response);
  },

  /** Supprimer une évaluation (admin) */
  async deleteEvaluation(id) {
    const response = await api.delete(`/api/evaluations/${id}`);
    return unwrap(response);
  }
};

export default evaluationService;
