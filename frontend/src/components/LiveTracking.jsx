import React from 'react';

const LiveTracking = () => {
  const features = [
    {
      icon: 'fa-satellite-dish',
      title: 'GPS Précis',
      desc: 'Localisation à 5 mètres près, mise à jour toutes les 30 secondes'
    },
    {
      icon: 'fa-bell',
      title: 'Notifications',
      desc: 'Alertes instantanées à chaque changement de statut'
    },
    {
      icon: 'fa-clock',
      title: 'ETA Dynamique',
      desc: "Heure d'arrivée recalculée en temps réel selon le trafic"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-wasilatti-blueLight via-wasilatti-blue to-wasilatti-dark dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-white relative overflow-hidden transition-colors duration-300">
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal active">
            <span className="text-white/80 font-semibold text-sm uppercase tracking-widest">Tracking GPS</span>
            <h2 className="text-4xl lg:text-5xl font-display font-black mt-3 mb-6">
              Suivez votre livraison<br />
              <span className="text-white underline decoration-wasilatti-orange">en temps réel</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Notre technologie de géolocalisation précise vous permet de
              suivre chaque étape de votre livraison. De la préparation à
              votre porte, soyez informé à chaque instant.
            </p>

            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <i className={`fas ${f.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{f.title}</h4>
                    <p className="text-white/70 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative scroll-reveal active">
            <div className="absolute -inset-8 bg-gradient-to-r from-wasilatti-orange/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="relative bg-gray-800 rounded-3xl p-4 shadow-2xl border border-white/10">
              <div className="bg-gray-900 rounded-2xl h-80 relative overflow-hidden">
                {/* Animated Map */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 320">
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Streets */}
                  <line x1="50" y1="40" x2="50" y2="280" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <line x1="150" y1="40" x2="150" y2="280" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <line x1="250" y1="40" x2="250" y2="280" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <line x1="350" y1="40" x2="350" y2="280" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <line x1="20" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

                  {/* Route */}
                  <path d="M 50 100 Q 100 80 150 120 T 250 180 T 350 150" fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" opacity="0.4" strokeDasharray="8 4">
                    <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1s" repeatCount="indefinite" />
                  </path>
                  <path d="M 50 100 Q 100 80 150 120 T 250 180 T 350 150" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />

                  {/* Points */}
                  <circle cx="50" cy="100" r="8" fill="#10B981" stroke="white" strokeWidth="2">
                    <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <text x="50" y="85" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="bold">Départ</text>

                  <circle cx="350" cy="150" r="8" fill="#F97316" stroke="white" strokeWidth="2">
                    <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="1s" />
                  </circle>
                  <text x="350" y="135" textAnchor="middle" fill="#F97316" fontSize="10" fontWeight="bold">Vous</text>

                  {/* Truck */}
                  <g>
                    <animateMotion path="M 50 100 Q 100 80 150 120 T 250 180 T 350 150" dur="6s" repeatCount="indefinite" />
                    <rect x="-12" y="-8" width="24" height="16" rx="6" fill="#F97316" stroke="white" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fill="white" fontSize="8">🛵</text>
                  </g>
                </svg>

                <div className="absolute bottom-4 left-4 right-4 bg-gray-800/90 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-wasilatti-orange flex items-center justify-center text-xs">
                        🛵
                      </div>
                      <div>
                        <p className="font-bold text-white">Ahmed T.</p>
                        <p className="text-xs text-gray-400">En route • 2.3 km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-wasilatti-orange">8 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveTracking;
