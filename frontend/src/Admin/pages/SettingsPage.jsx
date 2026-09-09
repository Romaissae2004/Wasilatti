import React, { useState, useEffect } from 'react';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import { Globe, Truck, Shield, Save, RotateCcw, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

const DEFAULT_SETTINGS = {
  platformName: "Wasilatti",
  currency: "MAD",
  supportEmail: "support@wasilatti.com",
  supportPhone: "+212 600 000 000",
  baseDeliveryFee: 15,
  kmDeliveryFee: 2.5,
  freeDeliveryThreshold: 200,
  driverCommission: 12,
  autoAssignOrders: true,
  maintenanceMode: false,
  maxDeliveryRadius: 25
};

const SettingsPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'delivery' | 'system'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  // Simulate loading settings from localStorage or API
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedSettings = localStorage.getItem('wasilatti_admin_settings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error("Failed to parse saved settings", e);
          setSettings(DEFAULT_SETTINGS);
        }
      } else {
        localStorage.setItem('wasilatti_admin_settings', JSON.stringify(DEFAULT_SETTINGS));
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Clear error for this key
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Email validation
    if (settings.supportEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.supportEmail)) {
        newErrors.supportEmail = "Format d'adresse e-mail invalide.";
      }
    } else {
      newErrors.supportEmail = "L'adresse e-mail est requise.";
    }

    // Platform name
    if (!settings.platformName.trim()) {
      newErrors.platformName = "Le nom de la plateforme est requis.";
    }

    // Support phone
    if (!settings.supportPhone.trim()) {
      newErrors.supportPhone = "Le téléphone de support est requis.";
    }

    // Number validations
    if (settings.baseDeliveryFee < 0) {
      newErrors.baseDeliveryFee = "Les frais de base doivent être positifs.";
    }
    if (settings.kmDeliveryFee < 0) {
      newErrors.kmDeliveryFee = "Le tarif au km doit être positif.";
    }
    if (settings.freeDeliveryThreshold < 0) {
      newErrors.freeDeliveryThreshold = "Le seuil de gratuité doit être positif.";
    }
    if (settings.driverCommission < 0 || settings.driverCommission > 100) {
      newErrors.driverCommission = "Le taux de commission doit être entre 0% et 100%.";
    }
    if (settings.maxDeliveryRadius <= 0) {
      newErrors.maxDeliveryRadius = "Le rayon de livraison doit être supérieur à 0 km.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      triggerToast("Veuillez corriger les erreurs de saisie.", "error");
      return;
    }

    setSaving(true);
    // Simulate API request saving delay
    setTimeout(() => {
      localStorage.setItem('wasilatti_admin_settings', JSON.stringify(settings));
      setSaving(false);
      triggerToast("Paramètres enregistrés avec succès !");
    }, 1000);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?")) {
      setSettings(DEFAULT_SETTINGS);
      setErrors({});
      localStorage.setItem('wasilatti_admin_settings', JSON.stringify(DEFAULT_SETTINGS));
      triggerToast("Paramètres réinitialisés aux valeurs par défaut.");
    }
  };

  // Custom Toggle component inlined
  const ToggleSwitch = ({ active, onChange }) => (
    <div 
      onClick={() => onChange(!active)}
      style={{
        width: 44,
        height: 22,
        borderRadius: 11,
        background: active ? '#f48c06' : '#cccccc',
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        position: 'relative'
      }}
    >
      <div 
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#ffffff',
          transform: active ? 'translateX(22px)' : 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "#f5f0e8",
      backgroundImage: `
        radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
        radial-gradient(#d4c9b0 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 100% 100%, 24px 24px",
    }}>
      <Side />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />

        {/* Toast Alert */}
        {toast.show && (
          <div style={{
            position: 'absolute',
            top: 76,
            right: 24,
            zIndex: 1000,
            background: toast.type === 'success' ? '#edfdfa' : '#fdf3f2',
            border: `1px solid ${toast.type === 'success' ? '#50afa8' : '#e05555'}`,
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            animation: 'slideIn 0.3s ease'
          }}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} color="#50afa8" />
            ) : (
              <AlertCircle size={18} color="#e05555" />
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.type === 'success' ? '#337a74' : '#a83c3c' }}>
              {toast.message}
            </span>
            <style>{`
              @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        <main style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2d2a22', margin: 0 }}>Paramètres Système</h2>
              <p style={{ fontSize: 12, color: '#969696', margin: '4px 0 0' }}>
                Configurez les variables globales, les conditions de livraison et le fonctionnement de l'application.
              </p>
            </div>
            
            {/* Action buttons in header */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={handleResetDefaults}
                disabled={loading || saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  border: '1px solid #ede8df',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7a7a7a',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#faf8f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                <RotateCcw size={15} />
                Réinitialiser
              </button>

              <button 
                onClick={handleSave}
                disabled={loading || saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f48c06',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(244,140,6,0.2)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e07f05'}
                onMouseLeave={e => e.currentTarget.style.background = '#f48c06'}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(255,253,248,0.9)',
              borderRadius: 16,
              border: '1px solid #ede8df',
              padding: 48
            }}>
              <Loader2 size={36} color="#f48c06" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#969696', marginTop: 12 }}>Chargement de vos configurations...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, flex: 1 }}>
              
              {/* Left Column: Navigation Tabs */}
              <div style={{
                width: 240,
                background: 'rgba(255,253,248,0.9)',
                borderRadius: 16,
                border: '1px solid #ede8df',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignSelf: 'flex-start',
                boxShadow: '0 2px 10px rgba(180,140,80,0.04)'
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#b8a688', letterSpacing: '0.08em', paddingLeft: 12, marginBottom: 6 }}>
                  CATÉGORIES
                </span>
                
                {/* Tab: General */}
                <button
                  onClick={() => setActiveTab('general')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 14px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: activeTab === 'general' ? '#fffaf3' : 'transparent',
                    color: activeTab === 'general' ? '#f48c06' : '#2d2a22',
                    fontWeight: activeTab === 'general' ? 700 : 500,
                    fontSize: 13,
                    transition: 'all 0.15s ease',
                    borderLeft: activeTab === 'general' ? '3px solid #f48c06' : '3px solid transparent'
                  }}
                >
                  <Globe size={16} />
                  Général
                </button>

                {/* Tab: Delivery */}
                <button
                  onClick={() => setActiveTab('delivery')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 14px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: activeTab === 'delivery' ? '#fffaf3' : 'transparent',
                    color: activeTab === 'delivery' ? '#f48c06' : '#2d2a22',
                    fontWeight: activeTab === 'delivery' ? 700 : 500,
                    fontSize: 13,
                    transition: 'all 0.15s ease',
                    borderLeft: activeTab === 'delivery' ? '3px solid #f48c06' : '3px solid transparent'
                  }}
                >
                  <Truck size={16} />
                  Livraison & Tarifs
                </button>

                {/* Tab: System */}
                <button
                  onClick={() => setActiveTab('system')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 14px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: activeTab === 'system' ? '#fffaf3' : 'transparent',
                    color: activeTab === 'system' ? '#f48c06' : '#2d2a22',
                    fontWeight: activeTab === 'system' ? 700 : 500,
                    fontSize: 13,
                    transition: 'all 0.15s ease',
                    borderLeft: activeTab === 'system' ? '3px solid #f48c06' : '3px solid transparent'
                  }}
                >
                  <Shield size={16} />
                  Système & Sécurité
                </button>
              </div>

              {/* Right Column: Settings Form */}
              <div style={{
                flex: 1,
                background: 'rgba(255,253,248,0.9)',
                borderRadius: 16,
                border: '1px solid #ede8df',
                padding: '24px 32px',
                boxShadow: '0 2px 10px rgba(180,140,80,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24
              }}>
                
                {/* ── TAB: GENERAL ── */}
                {activeTab === 'general' && (
                  <>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2a22', margin: '0 0 4px' }}>Configurations Générales</h3>
                      <p style={{ fontSize: 11, color: '#969696', margin: 0 }}>
                        Informations d'identification publiques de la plateforme.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Platform Name */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Nom de la Plateforme</label>
                        <input
                          type="text"
                          value={settings.platformName}
                          onChange={e => handleInputChange('platformName', e.target.value)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.platformName ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.platformName && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.platformName}</span>
                        )}
                      </div>

                      {/* Currency */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Devise Globale</label>
                        <select
                          value={settings.currency}
                          onChange={e => handleInputChange('currency', e.target.value)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid #ede8df',
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        >
                          <option value="MAD">MAD (Dirham Marocain)</option>
                          <option value="EUR">EUR (Euro)</option>
                          <option value="USD">USD (Dollar US)</option>
                        </select>
                      </div>

                      {/* Support Email */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>E-mail Support Client</label>
                        <input
                          type="email"
                          value={settings.supportEmail}
                          onChange={e => handleInputChange('supportEmail', e.target.value)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.supportEmail ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.supportEmail && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.supportEmail}</span>
                        )}
                      </div>

                      {/* Support Phone */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Téléphone Support</label>
                        <input
                          type="text"
                          value={settings.supportPhone}
                          onChange={e => handleInputChange('supportPhone', e.target.value)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.supportPhone ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.supportPhone && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.supportPhone}</span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      marginTop: 10,
                      padding: 14,
                      background: '#faf6ef',
                      border: '1px solid #ede8df',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <Info size={16} color="#f48c06" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: '#706a5e', margin: 0, lineHeight: 1.5 }}>
                        Ces informations seront affichées sur les factures des clients, le portail marchand et l'application mobile des livreurs pour toute demande d'assistance.
                      </p>
                    </div>
                  </>
                )}

                {/* ── TAB: DELIVERY ── */}
                {activeTab === 'delivery' && (
                  <>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2a22', margin: '0 0 4px' }}>Tarification & Livraison</h3>
                      <p style={{ fontSize: 11, color: '#969696', margin: 0 }}>
                        Déterminez la logique de coût et de rémunération pour le service de livraison.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Base Delivery Fee */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Frais de base ({settings.currency})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.baseDeliveryFee}
                          onChange={e => handleInputChange('baseDeliveryFee', parseFloat(e.target.value) || 0)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.baseDeliveryFee ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.baseDeliveryFee && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.baseDeliveryFee}</span>
                        )}
                      </div>

                      {/* Fee per kilometer */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Frais supplémentaires par KM ({settings.currency})</label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.kmDeliveryFee}
                          onChange={e => handleInputChange('kmDeliveryFee', parseFloat(e.target.value) || 0)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.kmDeliveryFee ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.kmDeliveryFee && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.kmDeliveryFee}</span>
                        )}
                      </div>

                      {/* Free Delivery Threshold */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Frais offerts à partir de ({settings.currency})</label>
                        <input
                          type="number"
                          step="5"
                          value={settings.freeDeliveryThreshold}
                          onChange={e => handleInputChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.freeDeliveryThreshold ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.freeDeliveryThreshold && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.freeDeliveryThreshold}</span>
                        )}
                      </div>

                      {/* Driver Commission Rate */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Taux de commission des livreurs (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.driverCommission}
                          onChange={e => handleInputChange('driverCommission', parseFloat(e.target.value) || 0)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.driverCommission ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.driverCommission && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.driverCommission}</span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      marginTop: 10,
                      padding: 14,
                      background: '#faf6ef',
                      border: '1px solid #ede8df',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <Info size={16} color="#f48c06" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: '#706a5e', margin: 0, lineHeight: 1.5 }}>
                        Les frais totaux de livraison pour un client sont calculés comme suit : <code>Frais de Base + (Distance en KM × Tarif par KM)</code>. Si la commande dépasse le seuil fixé, la livraison devient gratuite pour le client. La commission définit le pourcentage du tarif qui revient directement au livreur.
                      </p>
                    </div>
                  </>
                )}

                {/* ── TAB: SYSTEM ── */}
                {activeTab === 'system' && (
                  <>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2a22', margin: '0 0 4px' }}>Système & Sécurité</h3>
                      <p style={{ fontSize: 11, color: '#969696', margin: 0 }}>
                        Gérez le comportement technique et l'état opérationnel de la plateforme.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      
                      {/* Auto assign */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 16,
                        borderBottom: '1px solid #ede8df'
                      }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 600, color: '#2d2a22', display: 'block', marginBottom: 2 }}>
                            Assignation Automatique
                          </label>
                          <span style={{ fontSize: 11, color: '#969696' }}>
                            Attribue automatiquement les nouvelles commandes au livreur libre le plus proche.
                          </span>
                        </div>
                        <ToggleSwitch 
                          active={settings.autoAssignOrders} 
                          onChange={val => handleInputChange('autoAssignOrders', val)} 
                        />
                      </div>

                      {/* Maintenance mode */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 16,
                        borderBottom: '1px solid #ede8df'
                      }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 600, color: '#e05555', display: 'block', marginBottom: 2 }}>
                            Mode Maintenance
                          </label>
                          <span style={{ fontSize: 11, color: '#969696' }}>
                            Bloque l'accès aux clients et marchands pour maintenance. L'admin reste accessible.
                          </span>
                        </div>
                        <ToggleSwitch 
                          active={settings.maintenanceMode} 
                          onChange={val => handleInputChange('maintenanceMode', val)} 
                        />
                      </div>

                      {/* Max Delivery Radius */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '50%' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22' }}>Rayon maximal de livraison (KM)</label>
                        <input
                          type="number"
                          value={settings.maxDeliveryRadius}
                          onChange={e => handleInputChange('maxDeliveryRadius', parseInt(e.target.value) || 0)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${errors.maxDeliveryRadius ? '#e05555' : '#ede8df'}`,
                            outline: 'none',
                            fontSize: 13,
                            color: '#2d2a22',
                            background: '#ffffff'
                          }}
                        />
                        {errors.maxDeliveryRadius && (
                          <span style={{ fontSize: 10, color: '#e05555', fontWeight: 500 }}>{errors.maxDeliveryRadius}</span>
                        )}
                        <span style={{ fontSize: 10, color: '#969696', marginTop: 2 }}>
                          Distance géographique maximale tolérée entre le marchand et l'adresse de livraison du client.
                        </span>
                      </div>

                    </div>
                  </>
                )}

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
