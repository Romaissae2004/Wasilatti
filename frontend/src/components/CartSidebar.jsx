import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { calculateDeliveryFee } from '../context/CartContext';
import LocationPicker from './LocationPicker';

const CartSidebar = ({ isOpen, toggleCart }) => {
  const { cartItems, totalAmount, updateItemQty, removeItem, placeOrder } = useCart();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(10);

  // Recalculer les frais dès que les coordonnées changent
  useEffect(() => {
    setDeliveryFee(calculateDeliveryFee(latitude, longitude));
  }, [latitude, longitude]);

  const totalWithDelivery = Number(totalAmount) + deliveryFee;

  // Label zone affiché à côté du tarif
  const deliveryZoneLabel = () => {
    if (latitude == null) return '';
    if (deliveryFee === 10) return '(Oujda et environs)';
    if (deliveryFee === 25) return '(Proche région)';
    if (deliveryFee === 40) return '(Région éloignée)';
    return '(Longue distance)';
  };

  const resetCheckout = () => {
    setAddress('');
    setPhone('');
    setLatitude(null);
    setLongitude(null);
    setShowCheckout(false);
    setDeliveryFee(10);
  };

  return (
    <>
      <div
        id="cart-sidebar"
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[60] transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <i className="fas fa-shopping-bag text-wasilatti-orange"></i>
              {showCheckout ? 'Détails de livraison' : 'Votre panier'}
            </h3>
            <button
              onClick={() => { resetCheckout(); toggleCart(); }}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 dark:text-white flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div id="cart-items" className="flex-1 overflow-y-auto p-6">
            {showCheckout ? (
              <div className="space-y-4">
                <LocationPicker
                  address={address}
                  onAddressChange={setAddress}
                  latitude={latitude}
                  longitude={longitude}
                  onCoordsChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone de contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +212 661-234567"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>

                {/* Récapitulatif frais dans la page checkout */}
                <div className="rounded-xl bg-orange-50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Sous-total</span>
                    <span className="font-semibold dark:text-white">{Number(totalAmount).toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>
                      Livraison
                      {latitude != null && (
                        <span className="ml-1 text-xs text-orange-500">{deliveryZoneLabel()}</span>
                      )}
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {deliveryFee} DH
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-orange-100 dark:border-slate-600 pt-2 dark:text-white">
                    <span>Total</span>
                    <span className="text-wasilatti-orange">{totalWithDelivery.toFixed(2)} DH</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:text-white font-semibold text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Retour
                  </button>
                  <button
                    onClick={async () => {
                      if (!address || !phone) {
                        alert("Veuillez remplir l'adresse et le téléphone de contact.");
                        return;
                      }
                      if (latitude == null || longitude == null) {
                        alert('Veuillez choisir votre localisation sur la carte.');
                        return;
                      }
                      try {
                        await placeOrder(address, phone, latitude, longitude);
                        alert('Votre commande a été passée avec succès !');
                        resetCheckout();
                        toggleCart();
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-wasilatti-orange text-white font-bold text-sm transition-colors hover:bg-orange-600"
                  >
                    Confirmer — {totalWithDelivery.toFixed(2)} DH
                  </button>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-shopping-basket text-6xl mb-4 opacity-30"></i>
                <p>Votre panier est vide</p>
                <button
                  onClick={toggleCart}
                  className="mt-4 text-wasilatti-blue font-semibold hover:underline"
                >
                  Découvrir les produits
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <img
                      src={item.product?.imageUrls?.[0] || item.product?.image?.image_url || 'https://placehold.co/100x100?text=Produit'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-md bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate dark:text-white">{item.product?.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.product?.price} DH</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateItemQty(item.id, item.quantity - 1);
                            } else {
                              removeItem(item.id);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-slate-700 text-xs dark:text-white font-bold"
                        >-</button>
                        <span className="text-sm dark:text-white font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-slate-700 text-xs dark:text-white font-bold"
                        >+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 self-start p-1"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer panier (hors checkout) */}
          {!showCheckout && cartItems.length > 0 && (
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                <span className="font-semibold dark:text-white">{Number(totalAmount).toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Livraison</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Calculée selon votre adresse
                </span>
              </div>
              <div className="flex justify-between mb-6 text-lg font-bold">
                <span className="dark:text-white">Total</span>
                <span className="text-wasilatti-orange">{Number(totalAmount).toFixed(2)} DH</span>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="btn-primary w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
              >
                Passer la commande
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          onClick={() => { resetCheckout(); toggleCart(); }}
          className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm"
        />
      )}
    </>
  );
};

export default CartSidebar;
