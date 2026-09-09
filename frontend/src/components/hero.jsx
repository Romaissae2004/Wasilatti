import React from 'react';

const Hero = () => {
    return (
        <section id="hero" className="hero-gradient min-h-screen relative flex items-center overflow-hidden pt-20">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="blob w-96 h-96 bg-yellow-400 top-0 left-0" style={{ opacity: 0.3 }}></div>
                <div className="blob w-80 h-80 bg-wasilatti-blueLight bottom-0 right-0" style={{ animationDelay: '-3s', opacity: 0.25 }}></div>
                <div className="blob w-64 h-64 bg-amber-400 top-1/2 left-1/2" style={{ animationDelay: '-6s', opacity: 0.2 }}></div>

                {/* Floating Food Icons */}
                <div className="particle w-16 h-16 bg-wasilatti-orange/20 border-2 border-wasilatti-orange/40 top-32 left-[10%] animate-float">
                    <i className="fas fa-pizza-slice text-wasilatti-orange/60 absolute inset-0 flex items-center justify-center text-2xl"></i>
                </div>
                <div className="particle w-20 h-20 bg-wasilatti-light/20 border-2 border-wasilatti-light/40 top-48 left-[20%] animate-float-delayed">
                    <i className="fas fa-hamburger text-wasilatti-light/60 absolute inset-0 flex items-center justify-center text-2xl"></i>
                </div>
                <div className="particle w-14 h-14 bg-green-500/20 border-2 border-green-500/40 top-72 left-[5%] animate-float-slow">
                    <i className="fas fa-motorcycle text-green-500/60 absolute inset-0 flex items-center justify-center text-xl"></i>
                </div>
                <div className="particle w-24 h-24 bg-wasilatti-blue/15 border-2 border-wasilatti-blue/30 top-24 right-[15%] animate-float">
                    <i className="fas fa-gift text-wasilatti-blue/50 absolute inset-0 flex items-center justify-center text-3xl"></i>
                </div>
                <div className="particle w-16 h-16 bg-purple-500/20 border-2 border-purple-500/40 top-64 right-[25%] animate-float-delayed">
                    <i className="fas fa-utensils text-purple-500/60 absolute inset-0 flex items-center justify-center text-xl"></i>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                {/* Left Content */}
                <div className="space-y-8 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 text-wasilatti-orange font-medium text-sm backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Livraison express disponible dans votre ville
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-display font-black text-gray-900 dark:text-white leading-[1.1]">
                        Tout ce que vous<br />
                        <span className="text-gradient">voulez,</span><br />
                        <span className="relative">
                            livré
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                                <path d="M2 10C50 2 150 2 198 10" stroke="#0891B2" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
                        Commandez vos plats préférés, médicaments, courses et bien plus
                        encore. Livraison en moins de 30 minutes partout au Maroc.
                    </p>

                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
                        <div className="flex-1 relative">
                            <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-wasilatti-orange text-lg"></i>
                            <input type="text" placeholder="Entrez votre adresse..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white placeholder-gray-400 shadow-sm focus:border-wasilatti-orange dark:focus:border-wasilatti-blue transition-all outline-none" />
                        </div>
                        <button className="btn-primary px-8 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 whitespace-nowrap">
                            <i className="fas fa-search"></i>
                            Découvrir
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8 pt-4">
                        <div>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">30</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">min de livraison</p>
                        </div>
                        <div className="w-px h-12 bg-gray-200 dark:bg-slate-700"></div>
                        <div>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">1500</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">restaurants</p>
                        </div>
                        <div className="w-px h-12 bg-gray-200 dark:bg-slate-700"></div>
                        <div>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">500</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">villes couvertes</p>
                        </div>
                    </div>
                </div>

                {/* Right: Delivery Illustration */}
                <div className="relative hidden lg:block w-full h-[600px] flex items-center justify-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-[100px]"></div>

                    <div className="relative w-full h-full">
                        <svg width="100%" height="100%" viewBox="0 0 600 600" fill="none">
                            {/* Wind / Speed lines */}
                            <path d="M 600 150 L -100 150" stroke="rgba(249,115,22,0.3)" strokeWidth="4" strokeLinecap="round" className="wind-line" style={{ animationDuration: '2s' }} />
                            <path d="M 600 250 L -100 250" stroke="rgba(8,145,178,0.15)" strokeWidth="2" strokeLinecap="round" className="wind-line" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                            <path d="M 600 400 L -100 400" stroke="rgba(249,115,22,0.25)" strokeWidth="6" strokeLinecap="round" className="wind-line" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />

                            <g className="drone-anim">
                                {/* Drone Frame */}
                                <path d="M 200 240 Q 300 220 400 240 L 360 280 L 240 280 Z" fill="#F97316" stroke="#EA580C" strokeWidth="4" strokeLinejoin="round" />
                                {/* Core */}
                                <ellipse cx="300" cy="260" rx="40" ry="20" fill="#FB923C" />
                                <ellipse cx="300" cy="255" rx="30" ry="10" fill="#EA580C" />
                                {/* Glowing Eye */}
                                <circle cx="300" cy="275" r="8" fill="#ffffff" />
                                <circle cx="300" cy="275" r="3" fill="#0891B2" />

                                {/* Left Arm & Motor */}
                                <path d="M 260 255 L 150 230" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
                                <path d="M 260 255 L 150 230" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
                                <rect x="135" y="210" width="30" height="40" rx="8" fill="#FB923C" />
                                <rect x="140" y="215" width="20" height="30" rx="4" fill="#EA580C" />

                                {/* Right Arm & Motor */}
                                <path d="M 340 255 L 450 230" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
                                <path d="M 340 255 L 450 230" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
                                <rect x="435" y="210" width="30" height="40" rx="8" fill="#FB923C" />
                                <rect x="440" y="215" width="20" height="30" rx="4" fill="#EA580C" />

                                {/* Left Propeller */}
                                <g className="propeller" style={{ transformOrigin: '150px 210px' }}>
                                    <ellipse cx="150" cy="210" rx="65" ry="8" fill="rgba(8,145,178,0.5)" />
                                    <ellipse cx="150" cy="210" rx="65" ry="8" fill="rgba(8,145,178,0.3)" transform="rotate(90 150 210)" />
                                    <circle cx="150" cy="210" r="6" fill="#0891B2" />
                                </g>

                                {/* Right Propeller */}
                                <g className="propeller" style={{ transformOrigin: '450px 210px' }}>
                                    <ellipse cx="450" cy="210" rx="65" ry="8" fill="rgba(8,145,178,0.5)" />
                                    <ellipse cx="450" cy="210" rx="65" ry="8" fill="rgba(8,145,178,0.3)" transform="rotate(90 450 210)" />
                                    <circle cx="450" cy="210" r="6" fill="#0891B2" />
                                </g>

                                {/* Cables */}
                                <path d="M 260 280 L 250 360" stroke="#F97316" strokeWidth="4" strokeDasharray="8 6" />
                                <path d="M 340 280 L 350 360" stroke="#F97316" strokeWidth="4" strokeDasharray="8 6" />

                                {/* Package Box (Isometric) */}
                                <g transform="translate(230, 350)">
                                    <path d="M 70 0 L 140 30 L 70 60 L 0 30 Z" fill="#FFEDD5" />
                                    <path d="M 0 30 L 70 60 L 70 120 L 0 90 Z" fill="#FED7AA" />
                                    <path d="M 70 60 L 140 30 L 140 90 L 70 120 Z" fill="#FDBA74" />
                                    <path d="M 35 15 L 105 45" stroke="#0891B2" strokeWidth="8" />
                                    <path d="M 70 60 L 70 120" stroke="#0891B2" strokeWidth="8" />
                                    <text x="50" y="85" fontFamily="Arial" fontSize="28" fontWeight="bold" fill="#ffffff" transform="skewY(24)">W</text>
                                </g>
                            </g>

                            {/* City / Destination Rings below */}
                            <g opacity="0.6">
                                <ellipse cx="300" cy="520" rx="200" ry="40" fill="none" stroke="#F97316" strokeWidth="2" strokeDasharray="10 5" />
                                <ellipse cx="300" cy="520" rx="150" ry="30" fill="none" stroke="#0891B2" strokeWidth="3" />
                                <ellipse cx="300" cy="520" rx="100" ry="20" fill="rgba(249,115,22,0.15)" />
                                <circle cx="300" cy="520" r="6" fill="#F97316" />
                            </g>
                        </svg>
                    </div>

                    {/* Tech Elements */}
                    <div className="absolute top-1/4 right-0 bg-white dark:bg-slate-800 backdrop-blur-md px-6 py-3 rounded-2xl text-gray-800 dark:text-white font-bold flex items-center gap-3 border border-gray-200 dark:border-slate-700 shadow-2xl animate-bounce-slow">
                        <span className="w-3 h-3 rounded-full bg-green-400 animate-ping"></span>
                        En route - 2 min
                    </div>
                    <div className="absolute bottom-1/4 left-0 bg-white dark:bg-slate-800 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl animate-float">
                        <i className="fas fa-box-open text-4xl text-wasilatti-blue"></i>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 animate-bounce-slow">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs">Scroll</span>
                    <i className="fas fa-chevron-down"></i>
                </div>
            </div>
        </section>
    );
};

export default Hero;
