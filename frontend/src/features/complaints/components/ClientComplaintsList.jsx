import React from 'react';
import { MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { STATUS_META, SEVERITY_META } from '../constants';
import { fmtDate } from '../complaintUtils';

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: '#969696', bg: 'rgba(150,150,150,0.1)' };
  const icons = {
    EN_ATTENTE: Clock,
    EN_COURS: AlertCircle,
    RESOLU: CheckCircle2,
    REJETE: XCircle,
  };
  const Icon = icons[status] || AlertCircle;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
      style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}33` }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
};

const ClientComplaintsList = ({ complaints = [], loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 gap-4 text-orange-500">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <span className="font-semibold text-gray-600 dark:text-gray-300">Chargement de vos plaintes...</span>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
        <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Aucune plainte</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vous n'avez soumis aucune réclamation pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {complaints.map((complaint) => {
        const severityMeta = SEVERITY_META[complaint.severity] || SEVERITY_META.MOYENNE;

        return (
          <div
            key={complaint.id}
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            style={{ borderLeftWidth: 4, borderLeftColor: severityMeta.color }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-orange-500">{complaint.reference}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: severityMeta.bg, color: severityMeta.color }}
                  >
                    {severityMeta.label}
                  </span>
                  <StatusBadge status={complaint.status} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">{complaint.subject}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {complaint.typeLabel} • {fmtDate(complaint.createdAt)}
                  {complaint.orderId ? ` • Commande #${complaint.orderId}` : ''}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {complaint.description}
            </p>

            {complaint.adminResponse && (
              <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 rounded-xl p-4">
                <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare size={12} /> Réponse de l'administration
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {complaint.adminResponse}
                </p>
                {complaint.resolvedAt && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Traitée le {fmtDate(complaint.resolvedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClientComplaintsList;
