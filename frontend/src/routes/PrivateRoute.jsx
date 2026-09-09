import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false, allowedRoles = null }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Mémoriser la page demandée pour rediriger après login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si adminOnly est spécifié, on s'assure que l'utilisateur a le rôle ADMIN
  if (adminOnly && !user?.roles?.includes('ADMIN')) {
    return <Navigate to="/" replace />;
  }

  // Si allowedRoles est fourni, on vérifie que l'utilisateur a au moins un des rôles requis
  if (allowedRoles && !allowedRoles.some(r => user?.roles?.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;