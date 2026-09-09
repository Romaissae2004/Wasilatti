import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import { Truck, CheckCircle, DollarSign, Star, Calendar, MessageSquare } from 'lucide-react';
import axios from '../../api/axiosConfig';
import evaluationService from '../../services/evaluationService';

const C = {
  primary: '#f48c06',
  primaryLight: 'rgba(244,140,6,0.10)',
  success: '#50afa8',
  successLight: 'rgba(80,175,168,0.10)',
  danger: '#e07070',
  dangerLight: 'rgba(224,112,112,0.10)',
  warning: '#f3b137',
  bg: '#f5f0e8',
  card: '#fffdf8',
  border: '#ede8df',
  textDark: '#2d2a22',
  textMuted: '#7c7667',
  gray: '#969696',
};

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 9, color: C.gray, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <p style={{
        margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: C.textDark,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
      }}>
        {icon}
        <span style={{ color }}>{value}</span>
      </p>
    </div>
  );
}

const DriverProfilePage = () => {
  const { user } = useAuth();
  const {
    availableDrivers, selectedDriver, setSelectedDriver,
    handlePresenceChange, isAdmin,
  } = useDriver();

  const [driverReviews, setDriverReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchDriverReviews = async () => {
    if (!selectedDriver) return;
    setLoadingReviews(true);
    try {
      const data = await evaluationService.getDriverEvaluations(selectedDriver.username);
      setDriverReviews(data);
    } catch (err) {
      console.error("Error fetching driver reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchDriverReviews();
  }, [selectedDriver]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>
      <Side />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{
          flex: 1, overflowY: 'auto', padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
        }}>

          {/* ── Carte de profil ─────────────────────────────────────────── */}
          {selectedDriver ? (
            <>
              <div style={{
                width: '100%', maxWidth: 760,
                background: C.card, borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: '20px 24px',
                boxShadow: '0 2px 12px rgba(180,140,80,0.06)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>

                {/* En-tête profil */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: C.primary, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, fontWeight: 700,
                    }}>
                      {selectedDriver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textDark }}>
                        {selectedDriver.name}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Truck size={13} /> {selectedDriver.vehicle} • {selectedDriver.zone}
                      </p>
                    </div>
                  </div>

                  {/* Sélecteur de statut */}
                  <select
                    value={selectedDriver.status}
                    onChange={(e) => handlePresenceChange(e.target.value)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
                      border: `1px solid ${C.border}`, outline: 'none', cursor: 'pointer',
                      background:
                        selectedDriver.status === 'Disponible' ? '#e6f4ea' :
                          selectedDriver.status === 'En livraison' ? '#fdf2e9' : '#f1f3f4',
                      color:
                        selectedDriver.status === 'Disponible' ? '#137333' :
                          selectedDriver.status === 'En livraison' ? '#b06000' : '#3c4043',
                    }}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="En livraison">En livraison</option>
                    <option value="Hors ligne">Hors ligne</option>
                  </select>
                </div>

                {/* Mode admin */}
                {isAdmin && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, display: 'block', marginBottom: 4 }}>
                      SIMULATION — CHOISIR UN PROFIL LIVREUR :
                    </label>
                    <select
                      value={selectedDriver.id}
                      onChange={(e) => {
                        const matched = availableDrivers.find(d => d.id === e.target.value);
                        if (matched) setSelectedDriver(matched);
                      }}
                      style={{ width: '100%', fontSize: 12, padding: 7, borderRadius: 6, border: `1px solid ${C.border}`, background: '#faf6ef', color: C.textDark }}
                    >
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <StatCard
                    label="Livraisons"
                    value={selectedDriver.deliveries}
                    color={C.success}
                    icon={<CheckCircle size={15} color={C.success} />}
                  />
                  <div style={{ borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
                    <StatCard
                      label="Gains"
                      value={`${selectedDriver.revenue} DH`}
                      color={C.primary}
                      icon={<DollarSign size={15} color={C.primary} />}
                    />
                  </div>
                  <StatCard
                    label="Note"
                    value={selectedDriver.rating}
                    color={C.warning}
                    icon={<Star size={15} fill={C.warning} stroke={C.warning} />}
                  />
                </div>
              </div>

              {/* ── Section Avis Clients ─────────────────────────────────────── */}
              <div style={{
                width: '100%', maxWidth: 760,
                background: C.card, borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: '20px 24px',
                boxShadow: '0 2px 12px rgba(180,140,80,0.06)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textDark, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={15} color={C.primary} />
                  Avis clients récents ({driverReviews.length})
                </h4>

                {loadingReviews ? (
                  <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>Chargement des avis...</p>
                ) : driverReviews.length === 0 ? (
                  <p style={{ color: C.gray, fontSize: 12, margin: 0, fontStyle: 'italic' }}>Aucun avis reçu pour le moment.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {driverReviews.map((rev) => (
                      <div key={rev.id} style={{
                        padding: 12, borderRadius: 12, background: '#faf8f4', border: `1px solid ${C.border}`,
                        display: 'flex', flexDirection: 'column', gap: 6
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>@{rev.clientUsername}</span>
                          <span style={{ fontSize: 10, color: C.gray, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={11} /> {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={11} fill={s <= rev.rating ? C.warning : 'none'} color={s <= rev.rating ? C.warning : C.gray} />
                          ))}
                        </div>
                        {rev.comment && (
                          <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontStyle: 'italic', lineHeight: '1.4' }}>
                            "{rev.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: C.gray, fontSize: 13 }}>Chargement du profil...</p>
          )}

        </main>
      </div>
    </div>
  );
};

export default DriverProfilePage;
