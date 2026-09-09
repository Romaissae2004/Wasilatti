import React, { useState } from 'react'
import Sidebar, { SidebarItem, SidebarSection } from './SideBar'
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../../features/products/ui'
import { colors } from '../../styles/colors'
import {
    LifeBuoy, Receipt, Home, Boxes, UserCircle,
    BarChart3, LayoutDashboard, Settings, AlertTriangle, LogOut, Star,
} from "lucide-react"

export { colors }

const Side = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const isLivreur = user?.roles?.includes('LIVREUR') || user?.roles?.includes('ROLE_LIVREUR');
  const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND');

  const isAccueilActive = currentPath === '/admin' || currentPath === '/home';
  const isDashboardActive = currentPath === '/dashboard';
  const isCommandesActive = currentPath === '/admin/orders';
  const isProduitsActive = currentPath === '/admin/products' || currentPath.startsWith('/admin/products/') || (currentPath.startsWith('/products/') && currentPath !== '/products');
  const isLivreursActive = currentPath === '/drivers';
  const isPlaintesActive = currentPath === '/admin/complaints';
  const isEvaluationsActive = currentPath === '/admin/evaluations';
  const isSettingsActive = currentPath === '/admin/settings';

  const linkStyle = { textDecoration: 'none', color: 'inherit', display: 'block' };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  const logoutButton = (
    <>
      <SidebarSection label="Compte" />
      <SidebarItem
        icon={<LogOut size={18} />}
        text="Déconnexion"
        onClick={() => setShowLogoutModal(true)}
      />
    </>
  );

  const logoutModal = showLogoutModal && (
    <Modal title="Confirmer la déconnexion" onClose={() => !logoutLoading && setShowLogoutModal(false)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#706a5e", lineHeight: "1.5" }}>
          Êtes-vous sûr de vouloir vous déconnecter{user?.username ? ` (${user.username})` : ''} ? Vous serez redirigé vers la page de connexion.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setShowLogoutModal(false)}
            disabled={logoutLoading}
            style={{
              padding: "10px 16px", borderRadius: 8, border: `1px solid ${colors.border}`,
              background: "#fff", color: "#706a5e", cursor: "pointer", fontSize: 14, fontWeight: 600,
              opacity: logoutLoading ? 0.6 : 1,
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            disabled={logoutLoading}
            style={{
              padding: "10px 16px", borderRadius: 8, border: "none",
              background: "#e74c3c", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
              opacity: logoutLoading ? 0.7 : 1,
            }}
          >
            {logoutLoading ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>
    </Modal>
  );

  if (isLivreur) {
    return (
      <>
        <Sidebar user={user}>
          <SidebarSection label="Principal" />
          <Link to="/driver/orders" style={linkStyle}>
            <SidebarItem
              icon={<Receipt size={18} />}
              text="Commandes en cours"
              active={currentPath === '/driver/orders'}
            />
          </Link>
          <Link to="/driver/history" style={linkStyle}>
            <SidebarItem
              icon={<BarChart3 size={18} />}
              text="Historique"
              active={currentPath === '/driver/history'}
            />
          </Link>
          <Link to="/driver/profile" style={linkStyle}>
            <SidebarItem
              icon={<UserCircle size={18} />}
              text="Mon Profil"
              active={currentPath === '/driver/profile'}
            />
          </Link>
          {logoutButton}
        </Sidebar>
        {logoutModal}
      </>
    );
  }

  if (isMarchand) {
    return (
      <>
        <Sidebar user={user}>
          <SidebarSection label="Principal" />
          <Link to="/dashboard" style={linkStyle}>
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              text="Dashboard"
              active={isDashboardActive}
            />
          </Link>
          <Link to="/admin/products" style={linkStyle}>
            <SidebarItem
              icon={<Boxes size={18} />}
              text="Produits & Catégories"
              active={isProduitsActive}
            />
          </Link>
          <Link to="/merchant/profile" style={linkStyle}>
            <SidebarItem
              icon={<UserCircle size={18} />}
              text="Mon Profil"
              active={currentPath === '/merchant/profile'}
            />
          </Link>
          {logoutButton}
        </Sidebar>
        {logoutModal}
      </>
    );
  }

  return (
    <>
      <Sidebar user={user}>
        <SidebarSection label="Principal" />
        <Link to="/home" style={linkStyle}>
          <SidebarItem
            icon={<Home size={18} />}
            text="Accueil"
            active={isAccueilActive}
          />
        </Link>
        <Link to="/dashboard" style={linkStyle}>
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            text="Dashboard"
            active={isDashboardActive}
          />
        </Link>
        <Link to="/admin/orders" style={linkStyle}>
          <SidebarItem
            icon={<Receipt size={18} />}
            text="Commandes"
            active={isCommandesActive}
          />
        </Link>
        <Link to="/admin/products" style={linkStyle}>
          <SidebarItem
            icon={<Boxes size={18} />}
            text="Produits"
            active={isProduitsActive}
          />
        </Link>
        <SidebarSection label="Gestion" />
        <Link to="/drivers" style={linkStyle}>
          <SidebarItem
            icon={<UserCircle size={18} />}
            text="Livreurs"
            active={isLivreursActive}
          />
        </Link>
        <Link to="/admin/complaints" style={linkStyle}>
          <SidebarItem
            icon={<AlertTriangle size={18} />}
            text="Plaintes"
            active={isPlaintesActive}
          />
        </Link>
        <Link to="/admin/evaluations" style={linkStyle}>
          <SidebarItem
            icon={<Star size={18} />}
            text="Avis & Notes"
            active={isEvaluationsActive}
          />
        </Link>
        <Link to="/admin/settings" style={linkStyle}>
          <SidebarItem
            icon={<Settings size={18} />}
            text="Paramètres"
            active={isSettingsActive}
          />
        </Link>
        {logoutButton}
      </Sidebar>
      {logoutModal}
    </>
  );
};

export default Side
