import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import axios from '../../api/axiosConfig';
import { 
  Store, Loader2, Upload, CheckCircle2, AlertCircle, ShieldAlert 
} from 'lucide-react';

const C = {
  orangeMain:  '#f48c06',
  tealMain:    '#50afa8',
  grayLight:   '#c4c4c4',
  grayMedium:  '#969696',
  orangeFaint: 'rgba(244,140,6,0.08)',
  orangeMid:   'rgba(244,140,6,0.18)',
  tealFaint:   'rgba(80,175,168,0.08)',
  tealMid:     'rgba(80,175,168,0.18)',
  grayFaint:   'rgba(196,196,196,0.25)',
  grayBorder:  'rgba(150,150,150,0.2)',
  bg:          '#f9f9f9',
  surface:     '#ffffff',
  surfaceElevated: '#fafafa',
  textDark:    '#1a1a1a',
  textMid:     '#555555',
  textSoft:    '#969696',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #ede8df',
  background: '#faf6ef',
  outline: 'none',
  fontSize: 13,
  color: '#2d2a22',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#969696',
  marginBottom: 4,
  display: 'block',
};

const btnPrimary = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: C.orangeMain,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: `0 4px 12px ${C.orangeMid}`,
  transition: 'all 0.2s',
};

const MerchantProfilePage = () => {
  const { user } = useAuth();
  const merchantCollabId = user?.collaboratorId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMerchantDetails = useCallback(async () => {
    if (!merchantCollabId) {
      setError("Aucun identifiant de collaborateur associé à ce compte.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/collaborators`);
      // Retrouver ce collaborateur spécifique dans la liste
      const list = data.data || data || [];
      const matched = list.find(c => c.id === Number(merchantCollabId));
      
      if (matched) {
        setForm({
          name: matched.name || '',
          email: matched.email || '',
          phone: matched.phone || '',
          city: matched.city || '',
        });
        if (matched.image?.image_url) {
          setPreview(matched.image.image_url);
        }
      } else {
        setError("Collaborateur introuvable.");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du collaborateur:", err);
      setError("Impossible de charger les informations du magasin.");
    } finally {
      setLoading(false);
    }
  }, [merchantCollabId]);

  useEffect(() => {
    fetchMerchantDetails();
  }, [fetchMerchantDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMsg(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setSuccessMsg(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom de la boutique est requis.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Mettre à jour les données du collaborateur
      await axios.put(`/collaborators/${merchantCollabId}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
      });

      // 2. Mettre à jour le logo si un nouveau fichier a été sélectionné
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await axios.post(`/collaborators/${merchantCollabId}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setFile(null); // Reset file selection
      }

      setSuccessMsg("Votre profil marchand a été mis à jour avec succès !");
      fetchMerchantDetails(); // Re-fetch to synchronize state
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du profil:", err);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  // Helper for initials
  const getInitials = (name = "") => {
    return name
      .split(/\s+/)
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#f5f0e8',
      backgroundImage: `
        radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
        radial-gradient(#c4c4c4 1px, transparent 1px)`,
      backgroundSize: '100% 100%, 100% 100%, 24px 24px',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <Side />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          
          {/* Header block */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 6, height: 22, borderRadius: 3,
                background: `linear-gradient(180deg, ${C.orangeMain} 0%, ${C.tealMain} 100%)`,
              }} />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textDark, letterSpacing: '-0.4px' }}>
                Mon Profil Marchand
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.textSoft }}>
              Visualisez et mettez à jour les informations et le logo de votre boutique.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: C.orangeMain }}>
              <Loader2 size={32} className="animate-spin" />
              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: C.textSoft }}>Chargement du profil...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start', maxWidth: 1000 }}>
              
              {/* Profile edit card */}
              <div style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.grayBorder}`,
                padding: '24px 28px',
                boxShadow: `0 2px 12px ${C.shadow}`,
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.textDark, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Store size={18} color={C.orangeMain} /> Informations de la boutique
                </h2>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                    color: '#e74c3c', fontSize: 13, fontWeight: 500
                  }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: `${C.tealFaint}`, border: `1px solid ${C.tealMid}`,
                    borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                    color: C.tealMain, fontSize: 13, fontWeight: 500
                  }}>
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  
                  {/* Logo Upload Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: 76, height: 76, borderRadius: '50%',
                        background: preview ? 'transparent' : C.orangeMain,
                        border: `2.5px solid ${C.orangeMain}`,
                        outline: `3px solid ${C.orangeMain}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 700, color: '#fff',
                        cursor: 'pointer', overflow: 'hidden', position: 'relative',
                        boxShadow: `0 4px 14px ${C.orangeMain}40`,
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      title="Cliquer pour changer le logo"
                    >
                      {preview ? (
                        <img src={preview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(form.name)
                      )}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                      >
                        <Upload size={18} color="#fff" />
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textDark }}>Logo de la boutique</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textSoft }}>Cliquer sur l'avatar pour téléverser une nouvelle image (.png, .jpg, max 2Mo)</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                      />
                    </div>
                  </div>

                  {/* Form fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={labelStyle}>Nom de la boutique *</span>
                      <input
                        style={inputStyle}
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        placeholder="McDonald's, Marjane..."
                        required
                      />
                    </div>

                    <div>
                      <span style={labelStyle}>Email de contact</span>
                      <input
                        style={inputStyle}
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        placeholder="contact@boutique.com"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={labelStyle}>Téléphone de contact</span>
                      <input
                        style={inputStyle}
                        name="phone"
                        value={form.phone}
                        onChange={handleInputChange}
                        placeholder="+212 600 000 000"
                      />
                    </div>

                    <div>
                      <span style={labelStyle}>Ville</span>
                      <input
                        style={inputStyle}
                        name="city"
                        value={form.city}
                        onChange={handleInputChange}
                        placeholder="Casablanca, Rabat..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button 
                      type="submit" 
                      style={btnPrimary}
                      disabled={saving}
                      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Enregistrer les modifications'
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Account / info sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Account card */}
                <div style={{
                  background: C.surface,
                  borderRadius: 16,
                  border: `1px solid ${C.grayBorder}`,
                  padding: '20px 22px',
                  boxShadow: `0 2px 12px ${C.shadow}`,
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textDark, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Détails du compte
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, color: C.textSoft, fontWeight: 700, textTransform: 'uppercase' }}>Utilisateur</span>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: C.textDark }}>{user?.username}</p>
                    </div>

                    <div>
                      <span style={{ fontSize: 10, color: C.textSoft, fontWeight: 700, textTransform: 'uppercase' }}>Rôles assignés</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {user?.roles?.map(role => (
                          <span 
                            key={role} 
                            style={{ 
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                              background: C.orangeFaint, color: C.orangeMain, border: `1px solid ${C.orangeMid}` 
                            }}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy disclaimer */}
                <div style={{
                  background: 'rgba(255, 253, 248, 0.6)',
                  borderRadius: 16,
                  border: `1px solid ${C.grayBorder}`,
                  padding: '16px 20px',
                  display: 'flex', gap: 12,
                }}>
                  <ShieldAlert size={20} color={C.grayMedium} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: C.textDark }}>Sécurité du compte</h4>
                    <p style={{ margin: 0, fontSize: 11, color: C.textSoft, lineHeight: 1.4 }}>
                      Pour toute modification de vos informations de connexion (identifiant, email de compte ou mot de passe), veuillez contacter l'administrateur de la plateforme Wasilatti.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default MerchantProfilePage;
