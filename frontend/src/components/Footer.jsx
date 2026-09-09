import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Wasilatti_logo.jpeg';

const Footer = () => {
    const partners = ['McDonald\'s', 'Pizza Hut', 'Carrefour', 'Marjane', 'Aswak Assalam', 'Pharmacies de Garde', 'BIM', 'Atacadao'];

    return (
        <>
            {/* Partners Marquee */}
            <section className="py-16 bg-white dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800 transition-colors duration-300 overflow-hidden">
                <div className="relative">
                    <div className="flex marquee whitespace-nowrap">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-center gap-16 px-8">
                                {partners.map((p, index) => (
                                    <div key={`${i}-${index}`} className="flex items-center gap-3 text-gray-400 hover:text-wasilatti-blue transition-colors cursor-pointer">
                                        <i className="fas fa-store text-2xl"></i>
                                        <span className="font-bold text-lg">{p}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-wasilatti-blue to-wasilatti-dark dark:from-slate-900 dark:to-slate-800 transition-colors duration-300"></div>
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg '%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                ></div>

                <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10 scroll-reveal active">
                    <h2 className="text-4xl lg:text-6xl font-display font-black text-white mb-6">
                        Prêt à commander ?
                    </h2>
                    <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                        Rejoignez des milliers de clients satisfaits et profitez de la
                        livraison express la plus rapide du Maroc.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/products" className="px-8 py-4 bg-white text-wasilatti-blue rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                            Commander maintenant
                            <i className="fas fa-arrow-right"></i>
                        </Link>
                        <Link to="/register" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                            Créer un compte
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-16 transition-colors duration-300 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                                    <img src={logo} alt="Wasilatti Logo" className="w-full h-full object-contain" onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/40x40.png?text=W";
                                    }} />
                                </div>
                                <span className="text-2xl font-display font-bold text-white">Wasilatti</span>
                            </div>
                            <p className="leading-relaxed mb-6 text-sm text-gray-400">
                                La livraison express la plus rapide du Maroc. Restaurants,
                                pharmacies, supermarchés et bien plus.
                            </p>
                            <div className="flex gap-3">
                                <a href="#facebook" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-wasilatti-blue hover:text-white transition-all">
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                                <a href="#instagram" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-wasilatti-blue hover:text-white transition-all">
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="#twitter" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-wasilatti-blue hover:text-white transition-all">
                                    <i className="fab fa-twitter"></i>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-lg mb-6">Services</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#restaurants" className="hover:text-wasilatti-blue transition-colors">Restaurants</a></li>
                                <li><a href="#pharmacies" className="hover:text-wasilatti-blue transition-colors">Pharmacies</a></li>
                                <li><a href="#supermarches" className="hover:text-wasilatti-blue transition-colors">Supermarchés</a></li>
                                <li><a href="#electronique" className="hover:text-wasilatti-blue transition-colors">Électronique</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-lg mb-6">Entreprise</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#about" className="hover:text-wasilatti-blue transition-colors">À propos</a></li>
                                <li><a href="#courier" className="hover:text-wasilatti-blue transition-colors">Devenir livreur</a></li>
                                <li><a href="#partner" className="hover:text-wasilatti-blue transition-colors">Devenir partenaire</a></li>
                                <li><a href="#contact" className="hover:text-wasilatti-blue transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-lg mb-6">Télécharger l'app</h4>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left border border-white/10">
                                    <i className="fab fa-apple text-2xl"></i>
                                    <div>
                                        <p className="text-[10px] text-gray-400">Télécharger sur</p>
                                        <p className="font-bold text-sm">App Store</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left border border-white/10">
                                    <i className="fab fa-google-play text-2xl"></i>
                                    <div>
                                        <p className="text-[10px] text-gray-400">Disponible sur</p>
                                        <p className="font-bold text-sm">Google Play</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                        <p>© 2026 Wasilatti. Tous droits réservés.</p>
                        <div className="flex gap-6">
                            <a href="#privacy" className="hover:text-white transition-colors">Confidentialité</a>
                            <a href="#terms" className="hover:text-white transition-colors">CGU</a>
                            <a href="#cookies" className="hover:text-white transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
