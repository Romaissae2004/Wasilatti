import React from 'react';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 scroll-reveal active">
          <span className="text-wasilatti-orange font-semibold text-sm uppercase tracking-widest">Simple & Rapide</span>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-gray-900 dark:text-white mt-3">
            Comment ça<br />
            <span className="text-gradient">marche ?</span>
          </h2>
        </div>

        <div className="relative max-w-5xl mx-auto mt-20">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[3px] bg-wasilatti-blue/30 dark:bg-wasilatti-blue/50 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {/* Step 1 */}
            <div className="text-center scroll-reveal active group">
              <div className="w-[88px] h-[88px] mx-auto bg-gradient-to-br from-wasilatti-blue to-wasilatti-blueLight rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-xl shadow-wasilatti-blue/30 transform group-hover:-translate-y-2 transition-all duration-300 border-2 border-white dark:border-slate-800">
                1
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Créez votre envoi</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-2">
                Renseignez les détails de votre colis et choisissez votre type de livraison
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center scroll-reveal active group" style={{ transitionDelay: '0.1s' }}>
              <div className="w-[88px] h-[88px] mx-auto bg-gradient-to-br from-wasilatti-blue to-wasilatti-blueLight rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-xl shadow-wasilatti-blue/30 transform group-hover:-translate-y-2 transition-all duration-300 border-2 border-white dark:border-slate-800">
                2
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Nous récupérons</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-2">
                Notre livreur arrive dans l'heure pour prendre votre colis
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center scroll-reveal active group" style={{ transitionDelay: '0.2s' }}>
              <div className="w-[88px] h-[88px] mx-auto bg-gradient-to-br from-wasilatti-blue to-wasilatti-blueLight rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-xl shadow-wasilatti-blue/30 transform group-hover:-translate-y-2 transition-all duration-300 border-2 border-white dark:border-slate-800">
                3
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Suivi en direct</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-2">
                Suivez votre colis en temps réel sur la carte interactive
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center scroll-reveal active group" style={{ transitionDelay: '0.3s' }}>
              <div className="w-[88px] h-[88px] mx-auto bg-gradient-to-br from-wasilatti-blue to-wasilatti-blueLight rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-xl shadow-wasilatti-blue/30 transform group-hover:-translate-y-2 transition-all duration-300 border-2 border-white dark:border-slate-800">
                4
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Livraison confirmée</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-2">
                Signature électronique et confirmation instantanée de réception
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
