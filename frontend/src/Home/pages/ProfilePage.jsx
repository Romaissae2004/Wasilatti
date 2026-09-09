import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Calendar, ShoppingBag, Clock,
  MapPin, CheckCircle2, Truck, HelpCircle, XCircle, ChevronDown, ChevronUp, RefreshCw, X,
  AlertTriangle, MessageSquare, Star,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Footer from '../../components/Footer';
import ComplaintForm from '../../features/complaints/components/ComplaintForm';
import ClientComplaintsList from '../../features/complaints/components/ClientComplaintsList';
import complaintService from '../../services/complaintService';
import evaluationService from '../../services/evaluationService';

const Loader2 = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    ></circle>
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const driverIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: #f97316; color: white; padding: 6px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const clientIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: #06b6d4; color: white; padding: 6px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
         </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [complaintsError, setComplaintsError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [closedTracking, setClosedTracking] = useState({});

  // États pour le système de notation
  const [evaluations, setEvaluations] = useState({});
  const [ratingModalOrder, setRatingModalOrder] = useState(null);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  const fetchOrderEvaluations = async (completedOrders) => {
    try {
      const evalsMap = {};
      await Promise.all(completedOrders.map(async (o) => {
        try {
          const evalData = await evaluationService.getEvaluationByOrder(o.id);
          if (evalData) {
            evalsMap[o.id] = evalData;
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.error("Erreur de récupération de la note pour la commande " + o.id, err);
          }
        }
      }));
      setEvaluations(prev => ({ ...prev, ...evalsMap }));
    } catch (err) {
      console.error('Erreur lors du chargement des évaluations:', err);
    }
  };

  const openRatingModal = (order) => {
    setRatingModalOrder(order);
    setModalRating(5);
    setModalComment("");
    setRatingError(null);
  };

  const handleSubmitRating = async () => {
    if (!ratingModalOrder) return;
    setSubmittingRating(true);
    setRatingError(null);
    try {
      const result = await evaluationService.submitEvaluation(
        ratingModalOrder.id,
        modalRating,
        modalComment
      );
      setEvaluations(prev => ({ ...prev, [ratingModalOrder.id]: result }));
      setRatingModalOrder(null);
    } catch (err) {
      console.error("Erreur de soumission de la note:", err);
      setRatingError(err.response?.data?.message || err.message || "Erreur lors de la soumission");
    } finally {
      setSubmittingRating(false);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/orders');
      if (response.data && response.data.data) {
        // Sort orders by id desc to show newest first
        const sorted = response.data.data.sort((a, b) => b.id - a.id);
        setOrders(sorted);
        
        // Charger les évaluations pour les commandes livrées
        const completed = sorted.filter(o => o.status === 'LIVRÉE');
        if (completed.length > 0) {
          fetchOrderEvaluations(completed);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Impossible de récupérer vos commandes. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;
    if (isAuthenticated) {
      fetchOrders();
      // Refresh silently every 5 seconds for real-time tracking
      intervalId = setInterval(() => {
        axios.get('/api/orders').then(response => {
          if (response.data && response.data.data) {
            const sorted = response.data.data.sort((a, b) => b.id - a.id);
            setOrders(sorted);
          }
        }).catch(err => console.error("Error refreshing orders:", err));
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      setComplaintsError(null);
      const data = await complaintService.getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setComplaintsError('Impossible de récupérer vos plaintes. Veuillez réessayer plus tard.');
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [isAuthenticated, activeTab]);

  const handleComplaintSubmitted = (created) => {
    setComplaints((prev) => [created, ...prev]);
    fetchComplaints();
  };

  const toggleExpandOrder = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper for status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30 flex items-center gap-1.5 w-fit">
            <Clock size={12} className="animate-pulse" /> En attente
          </span>
        );
      case 'CONFIRMÉE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={12} /> Confirmée
          </span>
        );
      case 'EN_LIVRAISON':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30 flex items-center gap-1.5 w-fit">
            <Truck size={12} className="animate-bounce" /> En livraison
          </span>
        );
      case 'LIVRÉE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={12} /> Livrée
          </span>
        );
      case 'ANNULÉE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center gap-1.5 w-fit">
            <XCircle size={12} /> Annulée
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-300 border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 w-fit">
            <HelpCircle size={12} /> Inconnu
          </span>
        );
    }
  };

  // Helper for tracking steps index
  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'EN_ATTENTE': return 0;
      case 'CONFIRMÉE': return 1;
      case 'EN_LIVRAISON': return 2;
      case 'LIVRÉE': return 3;
      default: return -1;
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Profil */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-600 p-8 shadow-xl text-white mb-8">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute right-1/4 top-1/4 w-32 h-32 rounded-full bg-white/5 blur-lg animate-pulse"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-6 z-10">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white font-bold text-4xl shadow-inner">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/25 backdrop-blur-md uppercase tracking-wider">
                {user?.roles?.includes('ADMIN') ? 'Administrateur' : 'Client Wasilatti'}
              </span>
              <h1 className="text-3xl font-display font-bold mt-2">{user?.username}</h1>
              <p className="text-white/80 text-sm mt-1 flex items-center justify-center md:justify-start gap-1.5">
                <Mail size={14} /> {user?.email || 'email@wasilatti.com'}
              </p>
            </div>
            <button 
              onClick={fetchOrders}
              className="mt-4 md:mt-0 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 transition-all text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>
        </div>

        {/* Navigation Onglets */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 pb-px mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-orange-500 text-orange-500 dark:text-orange-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <ShoppingBag size={16} /> Mes Commandes ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-orange-500 text-orange-500 dark:text-orange-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <User size={16} /> Informations de Profil
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'border-orange-500 text-orange-500 dark:text-orange-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <AlertTriangle size={16} /> Mes Plaintes ({complaints.length})
          </button>
        </div>

        {/* Contenu Onglets */}
        {activeTab === 'orders' ? (
          <div>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-4 text-orange-500">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="font-semibold text-gray-600 dark:text-gray-300">Chargement de vos commandes...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-6 rounded-2xl text-center">
                <p className="font-bold">{error}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Aucune commande</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vous n'avez pas encore passé de commande sur notre plateforme.</p>
                <Link to="/products" className="mt-6 inline-flex px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all">
                  Découvrir les produits
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const stepIndex = getStatusStepIndex(order.status);
                  const isCanceled = order.status === 'ANNULÉE';

                  return (
                    <div 
                      key={order.id}
                      className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* Header de la commande */}
                      <div 
                        onClick={() => toggleExpandOrder(order.id)}
                        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 dark:text-orange-400 font-bold text-sm">
                            #{order.id}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Commande N° {order.id}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-gray-900 dark:text-white">{order.totalPrice?.toFixed(2)} DH</span>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{order.items?.length || 0} article{order.items?.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(order.status)}
                            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                          </div>
                        </div>
                      </div>

                      {/* Corps déployable - Détails et suivi */}
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100 dark:border-slate-800 pt-6 bg-gray-50/50 dark:bg-slate-900/30">
                          
                          {/* Section Suivi et Statut */}
                          <div className="mb-8 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                              <Truck size={16} className="text-orange-500" /> Suivi de la livraison
                            </h5>

                            {isCanceled ? (
                              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                                <XCircle size={20} className="flex-shrink-0" />
                                <div>
                                  <p className="font-bold text-sm">Commande Annulée</p>
                                  <p className="text-xs mt-0.5">Cette commande a été annulée. N'hésitez pas à nous contacter si besoin.</p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {/* Timeline graphique de suivi */}
                                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 md:px-8">
                                  {/* Ligne grise en arrière-plan */}
                                  <div className="absolute left-4 md:left-[10%] md:right-[10%] top-6 md:top-5 bottom-6 md:bottom-auto w-0.5 md:w-auto md:h-0.5 bg-gray-200 dark:bg-slate-800 z-0"></div>
                                  
                                  {/* Ligne de progression active */}
                                  {stepIndex >= 0 && (
                                    <div 
                                      className="absolute left-4 md:left-[10%] top-6 md:top-5 bottom-6 md:bottom-auto w-0.5 md:w-auto md:h-0.5 bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-1000 z-0"
                                      style={{
                                        height: window.innerWidth < 768 ? `${(stepIndex / 3) * 100}%` : 'auto',
                                        width: window.innerWidth >= 768 ? `${(stepIndex / 3) * 80}%` : '0.5px'
                                      }}
                                    ></div>
                                  )}

                                  {/* Étape 1 : Reçue */}
                                  <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                      stepIndex >= 0 
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20' 
                                        : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-500'
                                    }`}>
                                      1
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-gray-900 dark:text-white">Reçue</p>
                                      <p className="text-[10px] text-gray-400">Commande enregistrée</p>
                                    </div>
                                  </div>

                                  {/* Étape 2 : Confirmée */}
                                  <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                      stepIndex >= 1 
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20' 
                                        : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-500'
                                    }`}>
                                      2
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-gray-900 dark:text-white">Confirmée</p>
                                      <p className="text-[10px] text-gray-400">Préparée par le partenaire</p>
                                    </div>
                                  </div>

                                  {/* Étape 3 : En livraison */}
                                  <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                      stepIndex >= 2 
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20' 
                                        : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-500'
                                    }`}>
                                      3
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-gray-900 dark:text-white">Livraison</p>
                                      <p className="text-[10px] text-gray-400">Livreur en route</p>
                                    </div>
                                  </div>

                                  {/* Étape 4 : Livrée */}
                                  <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                      stepIndex >= 3 
                                        ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20' 
                                        : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-500'
                                    }`}>
                                      4
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-gray-900 dark:text-white">Livrée</p>
                                      <p className="text-[10px] text-gray-400">Remise avec succès</p>
                                    </div>
                                  </div>
                                </div>

                                {/* En livraison : Infos Livreur & "Live map view simulation" */}
                                {order.status === 'EN_LIVRAISON' && (
                                  closedTracking[order.id] ? (
                                    <div className="mt-4 flex justify-end">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setClosedTracking(prev => ({ ...prev, [order.id]: false }));
                                        }}
                                        className="px-4 py-2 rounded-xl bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30 text-xs font-bold hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-all flex items-center gap-1.5"
                                      >
                                        <Truck size={14} /> Afficher le suivi du livreur
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="mt-8 border-t border-gray-100 dark:border-slate-800 pt-6 relative">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setClosedTracking(prev => ({ ...prev, [order.id]: true }));
                                        }}
                                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
                                        title="Masquer le suivi"
                                      >
                                        <X size={16} />
                                      </button>
                                      <div className="bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/20 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1 text-center md:text-left">
                                          <h6 className="font-bold text-orange-600 dark:text-orange-400 text-base mb-1 flex items-center justify-center md:justify-start gap-2">
                                            <span className="relative flex h-3.5 w-3.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500"></span>
                                            </span>
                                            Votre livreur est en route !
                                          </h6>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
                                            Notre livreur a récupéré votre commande. Vous pouvez le contacter directement si nécessaire.
                                          </p>
                                          
                                          {/* Livreur Details */}
                                          {order.livreur ? (
                                            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                              <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center gap-1.5">
                                                <User size={14} className="text-orange-500" /> Livreur : {order.livreur.username}
                                              </div>
                                              {order.livreur.phoneNumber && (
                                                <a href={`tel:${order.livreur.phoneNumber}`} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-orange-300 transition-all flex items-center gap-1.5">
                                                  <Phone size={14} className="text-orange-500" /> {order.livreur.phoneNumber}
                                                </a>
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-gray-400 italic mt-3">Livreur en cours d'attribution.</p>
                                          )}
                                        </div>

                                        {/* Real Map / Tracking view */}
                                        <div className="w-full md:w-56 h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 relative shadow-inner z-0">
                                          {order.livreur && order.livreur.currentLatitude && order.livreur.currentLongitude ? (
                                            <MapContainer
                                              center={[order.livreur.currentLatitude, order.livreur.currentLongitude]}
                                              zoom={13}
                                              style={{ height: '100%', width: '100%' }}
                                              scrollWheelZoom={false}
                                              zoomControl={false}
                                            >
                                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                              <Marker position={[order.livreur.currentLatitude, order.livreur.currentLongitude]} icon={driverIcon}>
                                                <Popup>Livreur: {order.livreur.username}</Popup>
                                              </Marker>
                                              {order.latitude && order.longitude && (
                                                <Marker position={[order.latitude, order.longitude]} icon={clientIcon}>
                                                  <Popup>Votre position</Popup>
                                                </Marker>
                                              )}
                                            </MapContainer>
                                          ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800 text-gray-500 text-xs text-center p-4">
                                              <MapPin size={24} className="mb-2 opacity-50" />
                                              Localisation du livreur indisponible pour le moment
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          {/* Section Liste des articles */}
                          <div className="grid md:grid-cols-3 gap-6">
                            
                            {/* Liste Articles */}
                            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                              <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingBag size={16} className="text-orange-500" /> Articles commandés
                              </h5>
                              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                {order.items?.map((item) => {
                                  const prodImage = (item.product?.imageUrls && item.product.imageUrls.length > 0)
                                    ? item.product.imageUrls[0]
                                    : "https://placehold.co/600x400/f5f0e8/c4c4c4?text=Produit";
                                  
                                  return (
                                    <div key={item.id} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800 flex-shrink-0">
                                        <img src={prodImage} alt={item.product?.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{item.product?.name}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Marque : {item.product?.brand || 'Wasilatti'}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-bold text-sm text-gray-900 dark:text-white">{item.price?.toFixed(2)} DH</span>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Qté : {item.quantity}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Recap de livraison */}
                            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                              <div>
                                <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                  <MapPin size={16} className="text-orange-500" /> Adresse de livraison
                                </h5>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                  {order.deliveryAddress || 'Non spécifiée'}
                                </p>
                                
                                {order.contactPhone && (
                                  <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Numéro de contact</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mt-0.5">
                                      <Phone size={12} className="text-orange-500" /> {order.contactPhone}
                                    </span>
                                  </div>
                                )}
                                
                                {order.status === 'LIVRÉE' && (
                                  <div className="border-t border-gray-100 dark:border-slate-800 pt-3 mt-3">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1.5 font-bold">Évaluation du livreur</span>
                                    {evaluations[order.id] ? (
                                      <div className="flex flex-col gap-1 bg-amber-50/50 dark:bg-amber-950/10 p-2.5 rounded-xl border border-amber-100/50 dark:border-amber-950/20">
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              size={13}
                                              className={star <= evaluations[order.id].rating ? "text-amber-500 fill-amber-500" : "text-gray-300 dark:text-gray-700"}
                                            />
                                          ))}
                                          <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300 ml-1">
                                            {evaluations[order.id].rating}/5
                                          </span>
                                        </div>
                                        {evaluations[order.id].comment && (
                                          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic mt-0.5 leading-relaxed">
                                            "{evaluations[order.id].comment}"
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openRatingModal(order);
                                        }}
                                        className="w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5"
                                      >
                                        <Star size={12} className="fill-white animate-pulse" /> Laisser un avis
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-6">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                  <span>Sous-total</span>
                                  <span>{(order.totalPrice - 15).toFixed(2)} DH</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  <span>Frais de livraison</span>
                                  <span>15.00 DH</span>
                                </div>
                                <div className="flex items-center justify-between font-extrabold text-sm text-gray-900 dark:text-white border-t border-dashed border-gray-100 dark:border-slate-800 pt-2">
                                  <span>Total Payé</span>
                                  <span className="text-orange-500">{order.totalPrice?.toFixed(2)} DH</span>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'complaints' ? (
          <div className="space-y-8">
            <ComplaintForm orders={orders} onSuccess={handleComplaintSubmitted} />

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-orange-500" />
                Historique de mes plaintes
              </h3>
              {complaintsError ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-6 rounded-2xl text-center">
                  <p className="font-bold">{complaintsError}</p>
                  <button
                    onClick={fetchComplaints}
                    className="mt-4 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold"
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <ClientComplaintsList complaints={complaints} loading={complaintsLoading} />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User size={18} className="text-orange-500" /> Informations Personnelles
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Nom d'utilisateur</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.username}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Adresse email</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.email || 'email@wasilatti.com'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Rôles de compte</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user?.roles?.map((role) => (
                      <span key={role} className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-orange-50/30 dark:bg-slate-800/30 border border-orange-100/50 dark:border-slate-700/50 rounded-2xl mt-4">
                  <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 mb-1">Confidentialité & Sécurité</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Votre compte est sécurisé et géré par le système d'authentification centralisé de Wasilatti. Pour modifier votre mot de passe, contactez l'administrateur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Modal d'évaluation */}
      {ratingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setRatingModalOrder(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition-all"
            >
              <XCircle size={20} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-500 mx-auto mb-3 animate-bounce">
                <Star size={24} className="fill-orange-500 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Évaluer votre livraison</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Commande #{ratingModalOrder.id} • Livreur : {ratingModalOrder.livreur?.username}
              </p>
            </div>

            {ratingError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold text-center">
                {ratingError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Étoiles de notation */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setModalRating(star)}
                    className="p-1 transition-transform active:scale-95 hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={star <= modalRating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-700"}
                    />
                  </button>
                ))}
              </div>

              {/* Commentaire */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Votre commentaire (facultatif)</label>
                <textarea
                  rows="3"
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  placeholder="Comment s'est déroulée votre livraison ? Votre avis aide le livreur à s'améliorer."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                ></textarea>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setRatingModalOrder(null)}
                  disabled={submittingRating}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
                >
                  {submittingRating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi...
                    </>
                  ) : (
                    "Soumettre"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
