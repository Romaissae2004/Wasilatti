import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosConfig';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// ── Coordonnées du dépôt Wasilatti à Oujda ───────────────────────────────────
const OUJDA_LAT = 34.6867;
const OUJDA_LNG = -1.9114;

// ── Calcul de distance Haversine (km) ────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Barème frais de livraison ─────────────────────────────────────────────────
// 0 – 30 km    → 10 DH  (Oujda et environs)
// 30 – 100 km  → 25 DH  (Taza, Al Hoceima...)
// 100 – 300 km → 40 DH  (Fès, Meknès, Rabat...)
// > 300 km     → 60 DH  (Casablanca, Marrakech...)
export function calculateDeliveryFee(latitude, longitude) {
  if (latitude == null || longitude == null) return 10;
  const dist = haversineKm(OUJDA_LAT, OUJDA_LNG, latitude, longitude);
  if (dist <= 30)  return 10;
  if (dist <= 100) return 25;
  if (dist <= 300) return 40;
  return 60;
}

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isClient = user && user.roles && user.roles.includes('USER');

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !isClient) {
      setCart(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/cart');
      setCart(data.data);
    } catch (err) {
      console.error('Erreur lors du chargement du panier:', err);
      setError('Impossible de charger le panier.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isClient]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Veuillez vous connecter pour ajouter des produits au panier.');
    }
    if (!isClient) {
      throw new Error('Seuls les clients peuvent commander des produits.');
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/cart/items', { productId, quantity });
      setCart(data.data);
      return data.data;
    } catch (err) {
      console.error("Erreur lors de l'ajout au panier:", err);
      const msg = err.response?.data?.message || "Erreur lors de l'ajout au panier.";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isClient]);

  const updateItemQty = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated || !isClient) return;
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/cart/items/${itemId}?quantity=${quantity}`);
      setCart(data.data);
      return data.data;
    } catch (err) {
      console.error('Erreur lors de la modification de la quantité:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isClient]);

  const removeItem = useCallback(async (itemId) => {
    if (!isAuthenticated || !isClient) return;
    setLoading(true);
    try {
      const { data } = await axios.delete(`/api/cart/items/${itemId}`);
      setCart(data.data);
      return data.data;
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isClient]);

  const placeOrder = useCallback(async (deliveryAddress, contactPhone, latitude = 34.01, longitude = -6.83) => {
    if (!isAuthenticated || !isClient) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/orders', {
        deliveryAddress,
        contactPhone,
        latitude,
        longitude
      });
      setCart(null);
      return data.data;
    } catch (err) {
      console.error('Erreur lors du passage de la commande:', err);
      const msg = err.response?.data?.message || 'Erreur lors du passage de la commande.';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isClient]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cartItems = cart?.items || [];
  const totalAmount = parseFloat(cart?.totalPrice ?? 0) || 0;
  const itemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartItems,
      totalAmount,
      itemsCount,
      loading,
      error,
      fetchCart,
      addToCart,
      updateItemQty,
      removeItem,
      placeOrder,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider');
  return ctx;
};
