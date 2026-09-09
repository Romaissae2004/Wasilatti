import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuth2CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const effectRan = useRef(false);

  useEffect(() => {
    // Evite le double appel en React StrictMode
    if (effectRan.current) return;
    
    const exchangeCode = async () => {
      if (!code) {
        setError("Code d'autorisation Google manquant.");
        return;
      }

      try {
        const user = await loginWithGoogle(code);
        const userRoles = user?.roles || [];
        const destination = userRoles.includes('ADMIN') ? '/admin' : '/';
        navigate(destination, { replace: true });
      } catch (err) {
        console.error("Erreur lors de l'échange OAuth2:", err);
        setError(err.message || "Impossible de se connecter avec Google.");
      }
    };

    exchangeCode();
    effectRan.current = true;
  }, [code, loginWithGoogle, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-6 lg:px-8 relative overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob w-96 h-96 bg-wasilatti-blueLight top-0 right-0" style={{ opacity: 0.15 }}></div>
        <div className="blob w-80 h-80 bg-wasilatti-orange bottom-0 left-0" style={{ animationDelay: '-3s', opacity: 0.15 }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800 text-center">
        {!error ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            {/* Beautiful spinner with pulse effect */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Connexion avec Google...
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Veuillez patienter pendant la configuration de votre session.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Échec de la connexion
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800/50">
                {error}
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retourner à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuth2CallbackPage;
