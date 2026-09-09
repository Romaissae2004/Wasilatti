import React, { useState } from 'react';
import { Send, AlertTriangle, Loader2 } from 'lucide-react';
import { COMPLAINT_TYPES, COMPLAINT_SEVERITIES } from '../constants';
import { getApiErrorMessage } from '../complaintUtils';
import complaintService from '../../../services/complaintService';

const ComplaintForm = ({ orders = [], onSuccess }) => {
  const [form, setForm] = useState({
    type: 'LIVRAISON',
    orderId: '',
    subject: '',
    description: '',
    severity: 'MOYENNE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Veuillez remplir le sujet et la description de votre plainte.');
      return;
    }
    if (form.description.trim().length < 20) {
      setError('La description doit contenir au moins 20 caractères.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        type: form.type,
        subject: form.subject.trim(),
        description: form.description.trim(),
        severity: form.severity,
        ...(form.orderId ? { orderId: Number(form.orderId) } : {}),
      };
      const created = await complaintService.submitComplaint(payload);
      setSuccess(true);
      setForm({
        type: 'LIVRAISON',
        orderId: '',
        subject: '',
        description: '',
        severity: 'MOYENNE',
      });
      onSuccess?.(created);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Impossible d\'envoyer votre plainte. Veuillez réessayer.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500 flex-shrink-0">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Soumettre une plainte</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Décrivez votre problème en détail. Notre équipe traitera votre réclamation dans les plus brefs délais.
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold">
          Votre plainte a été enregistrée avec succès. Vous recevrez une réponse dès qu'elle sera traitée.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-2">
              Type de plainte *
            </label>
            <select
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {COMPLAINT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-2">
              Commande concernée (optionnel)
            </label>
            <select
              value={form.orderId}
              onChange={(e) => handleChange('orderId', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">Aucune commande spécifique</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  Commande #{order.id} — {order.totalPrice?.toFixed(2)} DH
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-2">
            Priorité *
          </label>
          <div className="flex flex-wrap gap-3">
            {COMPLAINT_SEVERITIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleChange('severity', s.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  form.severity === s.value
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-slate-700 hover:border-orange-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-2">
            Sujet *
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Ex : Livraison en retard de plus de 2 heures"
            maxLength={120}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-2">
            Description détaillée *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez précisément le problème rencontré, la date, les personnes concernées..."
            rows={5}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Envoi en cours...
            </>
          ) : (
            <>
              <Send size={16} /> Envoyer ma plainte
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ComplaintForm;
