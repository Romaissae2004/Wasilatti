import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../../services/authService';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation checks
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noSpace: false,
  });

  useEffect(() => {
    setValidation({
      length: password.length >= 8 && password.length <= 255,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@#$%^&+=!*\\-_]/.test(password),
      noSpace: !/\s/.test(password) && password.length > 0,
    });
  }, [password]);

  const isPasswordValid = Object.values(validation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Le jeton de réinitialisation est manquant. Veuillez faire une nouvelle demande.");
      return;
    }

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await authService.resetPassword(token, password);
      setSuccess(data.message || "Votre mot de passe a été réinitialisé avec succès.");
      // Redirection vers la connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      setError(err?.response?.data?.message || err?.message || "Une erreur est survenue lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ fulfilled, text }) => (
    <div className="flex items-center gap-2 text-xs">
      {fulfilled ? (
        <Check size={14} className="text-emerald-500 shrink-0" />
      ) : (
        <X size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
      )}
      <span className={fulfilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        Nouveau mot de passe
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
        Veuillez choisir un mot de passe sécurisé pour votre compte.
      </p>

      {!token && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-800">
          Aucun jeton de réinitialisation détecté. Veuillez utiliser le lien reçu par e-mail ou faire une nouvelle demande.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-200 dark:border-emerald-800">
          {success}
          <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-pulse">
            Redirection vers la page de connexion dans quelques instants...
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Mot de passe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Critères de complexité */}
        {password.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800/80 space-y-1.5">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Critères du mot de passe :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <ValidationItem fulfilled={validation.length} text="8 à 255 caractères" />
              <ValidationItem fulfilled={validation.uppercase} text="1 majuscule (A-Z)" />
              <ValidationItem fulfilled={validation.lowercase} text="1 minuscule (a-z)" />
              <ValidationItem fulfilled={validation.number} text="1 chiffre (0-9)" />
              <ValidationItem fulfilled={validation.special} text="1 caractère spécial" />
              <ValidationItem fulfilled={validation.noSpace} text="Aucun espace" />
            </div>
          </div>
        )}

        {/* Champ Confirmation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid || password !== confirmPassword || !token}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Retourner à la{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Connexion
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordForm;
