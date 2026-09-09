import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
// Import des icônes pour le mot de passe
import { Eye, EyeOff } from 'lucide-react';

// 1. On sort le composant Field à l'extérieur pour éviter de perdre le focus
const Field = ({ name, label, type = 'text', placeholder, autoComplete, value, onChange, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="relative"> {/* "relative" indispensable pour positionner l'icône à droite */}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2.5 rounded-lg border ${
          error
            ? 'border-red-400 dark:border-red-600'
            : 'border-gray-200 dark:border-slate-700'
        } bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
          children ? 'pr-11' : '' // On ajoute du padding à droite si une icône est présente
        }`}
      />
      {children}
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-500">{error}</p>
    )}
  </div>
);

const RegisterForm = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  
  // State pour afficher / masquer le mot de passe
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 3)
      newErrors.username = 'Minimum 3 caractères';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email invalide';
    if (!formData.password || formData.password.length < 8)
      newErrors.password = 'Minimum 8 caractères';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!*\-_])/.test(formData.password))
      newErrors.password = 'Doit contenir majuscule, minuscule, chiffre et caractère spécial';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await register(formData.username, formData.email, formData.password);
      navigate('/login', { state: { message: 'Compte créé avec succès. Connectez-vous.' } });
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Créer un compte
      </h2>

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field 
          name="username" 
          label="Nom d'utilisateur" 
          placeholder="ex: john_doe" 
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
        />
        
        <Field 
          name="email" 
          label="Email" 
          type="email" 
          placeholder="ex: john@gmail.com" 
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        
        <Field 
          name="password" 
          label="Mot de passe" 
          type={showPassword ? 'text' : 'password'} // Alterne entre text et password
          placeholder="••••••••" 
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        >
          {/* Bouton icône injecté grâce aux children */}
          <button
            type="button" // TRÈS IMPORTANT : empêche le bouton de soumettre le formulaire
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition focus:outline-none"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-orange-500 hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;