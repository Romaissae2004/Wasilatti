import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { useAuth } from '../context/AuthContext';
import { DriverProvider } from '../context/DriverContext';

// Pages Client
import LandingPage from '../Home/pages/LandingPage';
import LoginPage from '../Home/pages/LoginPage';
import RegisterPage from '../Home/pages/RegisterPage';
import ProductsPage from '../Home/pages/ProductsPage';
import ProfilePage from '../Home/pages/ProfilePage';
import ClientProductDetailPage from '../Home/pages/ClientProductDetailPage'; 
import ResetPasswordPage from '../Home/pages/ResetPasswordPage';
import ForgotPasswordPage from '../Home/pages/ForgotPasswordPage';

// Pages Admin
import HomePage          from '../Admin/pages/HomePage';
import AdminProductsPage from '../Admin/pages/ProductsPage';
import DashbordPage from '../Admin/pages/DashbordPage';
import ProductDetailPage from '../Admin/pages/ProductDetailPage';
import LivreursPage from '../Admin/pages/LivreursPage';
import OrdersPage from '../Admin/pages/OrdersPage';
import ComplaintsPage from '../Admin/pages/ComplaintsPage';
import EvaluationsPage from '../Admin/pages/EvaluationsPage';
import SettingsPage from '../Admin/pages/SettingsPage';

// Pages Livreur (Espace Livreur découpé en pages dédiées)
import DriverProfilePage from '../Driver/pages/DriverProfilePage';
import DriverOrdersPage  from '../Driver/pages/DriverOrdersPage';
import DriverHistoryPage from '../Driver/pages/DriverHistoryPage';
import OAuth2CallbackPage from '../Home/pages/OAuth2CallbackPage';
// Pages Marchand
import MerchantProfilePage from '../Merchant/pages/MerchantProfilePage';

const AdminHomeRedirect = () => {
  const { user } = useAuth();
  if (user?.roles?.includes('LIVREUR') || user?.roles?.includes('ROLE_LIVREUR')) {
    return <Navigate to="/driver/orders" replace />;
  }
  if (user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <HomePage />;
};

const AppRoutes = ({ toggleCart, onAddToCart }) => {
  return (
    <Routes>
      {/* ── CLIENT ── */}
      <Route path="/"         element={<LandingPage  onAddToCart={onAddToCart} toggleCart={toggleCart} />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/products" element={<ProductsPage toggleCart={toggleCart} />} />
      <Route path="/products/:id" element={<ClientProductDetailPage />} />
      <Route path="/profile"  element={<ProfilePage />} />
      <Route
      path="/oauth2/callback"
      element={<OAuth2CallbackPage/>}
      />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      {/* ── ADMIN (protégé) ── */}
      <Route path="/home" element={<Navigate to="/admin" replace />} />

      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['ADMIN', 'LIVREUR', 'ROLE_LIVREUR', 'MARCHAND', 'ROLE_MARCHAND']}><AdminHomeRedirect /></PrivateRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute allowedRoles={['ADMIN', 'MARCHAND', 'ROLE_MARCHAND']}><DashbordPage /></PrivateRoute>
      } />
      <Route path="/drivers" element={
        <PrivateRoute allowedRoles={['ADMIN']}><LivreursPage /></PrivateRoute>
      } />

      <Route path="/admin/orders" element={
        <PrivateRoute adminOnly><OrdersPage /></PrivateRoute>
      } />

      <Route path="/admin/complaints" element={
        <PrivateRoute adminOnly><ComplaintsPage /></PrivateRoute>
      } />

      <Route path="/admin/evaluations" element={
        <PrivateRoute adminOnly><EvaluationsPage /></PrivateRoute>
      } />

      <Route path="/admin/settings" element={
        <PrivateRoute adminOnly><SettingsPage /></PrivateRoute>
      } />

      <Route path="/admin/products" element={
        <PrivateRoute allowedRoles={['ADMIN', 'MARCHAND', 'ROLE_MARCHAND']}><AdminProductsPage /></PrivateRoute>
      } />

      <Route path="/admin/products/:id" element={
        <PrivateRoute allowedRoles={['ADMIN', 'MARCHAND', 'ROLE_MARCHAND']}><ProductDetailPage /></PrivateRoute>
      } />

      {/* ── ESPACE LIVREUR : chaque fonctionnalité a sa propre route ── */}
      <Route path="/driver" element={<Navigate to="/driver/orders" replace />} />

      <Route path="/driver/profile" element={
        <PrivateRoute allowedRoles={['LIVREUR', 'ROLE_LIVREUR', 'ADMIN']}>
          <DriverProvider><DriverProfilePage /></DriverProvider>
        </PrivateRoute>
      } />
      <Route path="/driver/orders" element={
        <PrivateRoute allowedRoles={['LIVREUR', 'ROLE_LIVREUR', 'ADMIN']}>
          <DriverProvider><DriverOrdersPage /></DriverProvider>
        </PrivateRoute>
      } />
      <Route path="/driver/history" element={
        <PrivateRoute allowedRoles={['LIVREUR', 'ROLE_LIVREUR', 'ADMIN']}>
          <DriverProvider><DriverHistoryPage /></DriverProvider>
        </PrivateRoute>
      } />

      {/* ── ESPACE MARCHAND ── */}
      <Route path="/merchant/profile" element={
        <PrivateRoute allowedRoles={['MARCHAND', 'ROLE_MARCHAND']}>
          <MerchantProfilePage />
        </PrivateRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;
