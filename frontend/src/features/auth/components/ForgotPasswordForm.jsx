import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../../services/authService';

const Field = ({ name, label, type = 'text', placeholder, autoComplete, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      required
    />
  </div>
);

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await authService.forgotPassword(email);
      setSuccess(data.message || "Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé.");
      setEmail('');
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);
      setError(err?.response?.data?.message || err?.message || "Erreur lors de l'envoi de l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        Mot de passe oublié ?
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
        Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-200 dark:border-emerald-800">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          name="email"
          label="Adresse e-mail"
          type="email"
          placeholder="votre-email@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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

export default ForgotPasswordForm;
