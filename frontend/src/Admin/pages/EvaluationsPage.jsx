import React, { useState, useEffect, useMemo } from 'react';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import evaluationService from '../../services/evaluationService';
import {
  Star, Trash2, Search, RefreshCw, Calendar, User, ShoppingBag, ShieldAlert
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

const cardStyle = {
  background: C.card,
  borderRadius: 16,
  border: `1px solid ${C.grayLight}`,
  boxShadow: '0 2px 12px rgba(180,140,80,0.06)',
};

const StatCard = ({ label, value, color, bg, icon: Icon }) => (
  <div style={{ ...cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: 'uppercase' }}>{label}</span>
      <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: C.textDark }}>{value}</h3>
    </div>
  </div>
);

const EvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvaluations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await evaluationService.getAllEvaluations();
      setEvaluations(data || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      setError('Impossible de récupérer la liste des évaluations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await evaluationService.deleteEvaluation(deleteId);
      setEvaluations(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      alert('Une erreur est survenue lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = evaluations.length;
    if (total === 0) return { total: 0, average: '—', textRating: '—' };
    const sum = evaluations.reduce((acc, curr) => acc + curr.rating, 0);
    const average = (sum / total).toFixed(1);
    return {
      total,
      average: `${average} / 5`,
      reviewsWithComment: evaluations.filter(e => e.comment && e.comment.trim().length > 0).length
    };
  }, [evaluations]);

  // Filtering
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const matchesSearch =
        item.driverName?.toLowerCase().includes(search.toLowerCase()) ||
        item.driverUsername?.toLowerCase().includes(search.toLowerCase()) ||
        item.clientUsername?.toLowerCase().includes(search.toLowerCase()) ||
        String(item.orderId).includes(search);

      const matchesRating = ratingFilter === 'ALL' || item.rating === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [evaluations, search, ratingFilter]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>
      <Side />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', fontFamily: "'Segoe UI', sans-serif" }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.textDark }}>Avis & Évaluations</h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted }}>Modérer et suivre les retours clients sur les livreurs</p>
            </div>
            <button 
              onClick={fetchEvaluations} 
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10, border: `1px solid ${C.grayLight}`,
                background: C.card, color: C.textDark, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard 
              label="Total Avis" 
              value={stats.total} 
              color={C.primary} 
              bg={C.primaryLight} 
              icon={ShoppingBag} 
            />
            <StatCard 
              label="Note Moyenne Globale" 
              value={stats.average} 
              color={C.warning} 
              bg={C.warningLight} 
              icon={Star} 
            />
            <StatCard 
              label="Avis avec Commentaire" 
              value={stats.reviewsWithComment || 0} 
              color={C.success} 
              bg={C.successLight} 
              icon={ShieldAlert} 
            />
          </div>

          {/* Filter and search controls */}
          <div style={{ ...cardStyle, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${C.grayLight}`, borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 260, background: '#faf9f6' }}>
              <Search size={16} color={C.gray} />
              <input 
                type="text" 
                placeholder="Rechercher par livreur, client, commande..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: C.textDark, width: '100%' }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', items: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginRight: 4 }}>Note :</span>
              {['ALL', '5', '4', '3', '2', '1'].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setRatingFilter(stars)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: ratingFilter === stars ? C.primary : '#faf9f6',
                    color: ratingFilter === stars ? '#ffffff' : C.textMuted,
                    boxShadow: ratingFilter === stars ? `0 2px 8px rgba(244,140,6,0.2)` : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {stars === 'ALL' ? 'Tous' : `${stars} ★`}
                </button>
              ))}
            </div>
          </div>

          {/* Main content grid */}
          {loading ? (
            <div style={{ ...cardStyle, padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <RefreshCw size={28} className="animate-spin text-orange-500" />
              <span style={{ fontSize: 13, color: C.textMuted }}>Chargement des évaluations...</span>
            </div>
          ) : error ? (
            <div style={{ ...cardStyle, padding: 40, background: 'rgba(224,112,112,0.04)', borderColor: C.danger, textAlign: 'center' }}>
              <ShieldAlert size={36} color={C.danger} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textDark }}>{error}</p>
              <button onClick={fetchEvaluations} style={{ marginTop: 14, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.danger, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Réessayer
              </button>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
              <Star size={36} color={C.gray} style={{ marginBottom: 10, opacity: 0.5 }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textDark }}>Aucune évaluation</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.gray }}>Aucun retour client ne correspond à vos filtres actuels.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {filteredEvaluations.map((item) => (
                <div key={item.id} style={{ ...cardStyle, padding: 18, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: 14 }}>
                  <div>
                    {/* Top Row: User & Delete */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: '#faf9f6', border: `1px solid ${C.grayLight}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDark, fontWeight: 700, fontSize: 11
                        }}>
                          {item.clientUsername.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>@{item.clientUsername}</span>
                          <span style={{ fontSize: 10, color: C.textMuted, display: 'block', marginTop: 1 }}>Client</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setDeleteId(item.id)}
                        style={{
                          padding: 6, borderRadius: 8, border: 'none', background: 'none', color: C.danger, cursor: 'pointer',
                          hover: { background: C.dangerLight }, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Supprimer cet avis"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Order & Date info */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, borderBottom: `1px solid #f6f1e8`, pb: 8, paddingBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, background: C.primaryLight, padding: '3px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        Commande #{item.orderId}
                      </span>
                      <span style={{ fontSize: 10, color: C.gray, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={11} /> {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Driver details */}
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={12} color={C.gray} />
                      <span style={{ fontSize: 11, color: C.textMuted }}>
                        Livreur : <strong style={{ color: C.textDark }}>{item.driverName}</strong> (@{item.driverUsername})
                      </span>
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 10 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={15} fill={s <= item.rating ? C.warning : 'none'} color={s <= item.rating ? C.warning : C.gray} />
                      ))}
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark, marginLeft: 4 }}>{item.rating}/5</span>
                    </div>

                    {/* Comment */}
                    <div style={{
                      marginTop: 12, padding: 10, borderRadius: 10, background: '#faf9f6', border: `1px solid ${C.grayLight}`,
                      fontSize: 12, color: C.textDark, fontStyle: item.comment ? 'normal' : 'italic', lineHeight: '1.4'
                    }}>
                      {item.comment ? `"${item.comment}"` : "Aucun commentaire laissé."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteId && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ ...cardStyle, padding: 24, width: 400, maxWidth: '90vw', textAlign: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: C.dangerLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.danger, mx: 'auto', margin: '0 auto 16px'
                }}>
                  <Trash2 size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textDark }}>Supprimer l'évaluation ?</h3>
                <p style={{ margin: '8px 0 20px', fontSize: 12, color: C.gray, lineHeight: '1.5' }}>
                  Cette action est irréversible. L'avis sera définitivement effacé et la note globale du livreur sera recalculée.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button 
                    onClick={() => setDeleteId(null)}
                    disabled={deleting}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.grayLight}`,
                      background: '#fff', color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: C.danger, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default EvaluationsPage;
