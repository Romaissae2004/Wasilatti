import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
// Import des icônes pour le mot de passe
import { Eye, EyeOff } from 'lucide-react';

// 1. Composant Field extrait à l'extérieur pour garantir une saisie fluide
const Field = ({ name, label, type = 'text', placeholder, autoComplete, value, onChange, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="relative"> {/* Conteneur parent relatif pour l'icône */}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          children ? 'pr-11' : '' // Padding à droite si l'icône est présente
        }`}
      />
      {children}
    </div>
  </div>
);

const LoginForm = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  // State pour gérer la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("Veuillez remplir le nom d'utilisateur et le mot de passe.");
      return;
    }
    
    // DEBUG 1 : Voir ce que ton frontend s'apprête à envoyer
    console.log("Données envoyées à la fonction login :", {
      username: formData.username,
      password: formData.password
    });

    try {
      const data = await login(formData.username, formData.password);
      
      // DEBUG 2 : Voir la réponse exacte de ton backend en cas de succès
      console.log("Connexion réussie ! Réponse brute de l'API :", data);

      const from = location.state?.from?.pathname;
      
      const userRoles = data?.user?.roles || data?.roles || [];
      console.log("Rôles détectés pour la redirection :", userRoles);

      const hasLivreur = userRoles.includes('LIVREUR') || userRoles.includes('ROLE_LIVREUR');
      const hasMarchand = userRoles.includes('MARCHAND') || userRoles.includes('ROLE_MARCHAND');
      const destination = from || (userRoles.includes('ADMIN') ? '/admin' : (hasLivreur ? '/driver/orders' : (hasMarchand ? '/dashboard' : '/')));
      navigate(destination, { replace: true });
      
    } catch (err) {
      // DEBUG 3 : Voir l'erreur réelle renvoyée par le serveur ou par JavaScript
      console.error("Erreur attrapée dans le bloc catch :", err);
      
      // Affiche le message de l'API s'il existe, sinon un message détaillé
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la connexion.');
    }
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082';
    window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
  };

  return (
    <div className="mt-20 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Connexion
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Utilisateur */}
        <Field 
          name="username" 
          label="Nom d'utilisateur ou Email" 
          placeholder="Nom d'utilisateur ou email" 
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
        />

        {/* Champ Mot de passe avec bouton oeil */}
        <div className="space-y-1">
          <Field 
            name="password" 
            label="Mot de passe" 
            type={showPassword ? 'text' : 'password'} // Alterne le type dynamiquement
            placeholder="••••••••" 
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          >
            <button
              type="button" // Empêche la soumission accidentelle du formulaire au clic
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </Field>
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:underline font-medium transition focus:outline-none"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {/* Séparateur */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">
            Ou continuer avec
          </span>
        </div>
      </div>

      {/* Bouton Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Se connecter avec Google</span>
      </button>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-blue-600 hover:underline font-medium">
          S'inscrire
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;