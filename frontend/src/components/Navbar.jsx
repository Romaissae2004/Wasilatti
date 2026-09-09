import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Wasilatti_logo.jpeg'; // Make sure the user puts logo.png here
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

const NavBar = ({ toggleCart, toggleDarkMode, isDarkMode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { itemsCount } = useCart();
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <nav id="navbar" className="fixed w-full z-50 transition-all duration-500 glass dark:glass-dark border-b border-gray-100 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <a href="/#hero" className="flex items-center gap-3 group">
                        {/* Nouveau logo (remplace la lettre "W" par l'image) */}
                        <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <img src={logo} alt="Wasilatti Logo" className="w-full h-full object-contain" onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/48x48.png?text=W"; // fallback if logo not found
                            }} />
                        </div>
                        <div>
                            <span className="text-2xl font-display font-bold text-gray-900 dark:text-white nav-text transition-colors">Wasilatti</span>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-300 nav-text transition-colors -mt-1 tracking-widest uppercase">
                                Logistique Moderne
                            </span>
                        </div>
                    </a>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        <Link to="/" className="nav-link text-gray-700 dark:text-gray-200 hover:text-wasilatti-orange font-medium text-sm transition-colors">Accueil</Link>
                        <a href="/#categories" className="nav-link text-gray-700 dark:text-gray-200 hover:text-wasilatti-orange font-medium text-sm transition-colors">Catégories</a>
                        <a href="/#how-it-works" className="nav-link text-gray-700 dark:text-gray-200 hover:text-wasilatti-orange font-medium text-sm transition-colors">Comment ça marche</a>
                        <Link to="/products" className="nav-link text-gray-700 dark:text-gray-200 hover:text-wasilatti-orange font-medium text-sm transition-colors">Produits</Link>
                        <a href="/#testimonials" className="nav-link text-gray-700 dark:text-gray-200 hover:text-wasilatti-orange font-medium text-sm transition-colors">Avis</a>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Cart */}
                        <button onClick={toggleCart} className="relative w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all group">
                            <i className="fas fa-shopping-bag text-lg group-hover:scale-110 transition-transform"></i>
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-wasilatti-orange text-white text-xs rounded-full flex items-center justify-center font-bold">{itemsCount}</span>
                        </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all group hidden lg:flex"
            >
              {isDarkMode
                ? <Sun size={18} className="group-hover:scale-110 transition-transform" />
                : <Moon size={18} className="group-hover:scale-110 transition-transform" />
              }
            </button>

                        {/* Auth */}
                        {isAuthenticated ? (
                            <div className="hidden lg:flex items-center gap-4">
                                <Link to="/profile" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-wasilatti-orange flex items-center gap-1.5 transition-colors">
                                    <i className="fas fa-user-circle text-lg"></i> {user?.username}
                                </Link>
                                {user?.roles?.includes('ADMIN') && (
                                    <Link to="/admin" className="text-sm font-semibold text-wasilatti-orange hover:underline">
                                        Console Admin
                                    </Link>
                                )}
                                <button onClick={logout} className="items-center gap-2 px-6 py-2.5 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all border border-gray-200 dark:border-slate-700">
                                    Déconnexion
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="hidden lg:flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all border border-gray-200 dark:border-slate-700 hover:border-orange-300">
                                <i className="fas fa-user"></i>
                                Connexion
                            </Link>
                        )}
                        {/* Mobile Menu Toggle */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-gray-200 text-xl">
                            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden glass-dark dark:bg-slate-900 border-t border-white/10 dark:border-slate-800">
                    <div className="px-6 py-6 space-y-4">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2">Accueil</Link>
                        <a href="/#categories" className="block text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2">Catégories</a>
                        <a href="/#how-it-works" className="block text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2">Comment ça marche</a>
                        <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2">Produits</Link>
                        <a href="/#testimonials" className="block text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2">Avis</a>
                        <hr className="border-white/10 dark:border-slate-800" />
                        
                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2 flex items-center gap-2">
                                    <i className="fas fa-user-circle"></i> Mon Profil ({user?.username})
                                </Link>
                                {user?.roles?.includes('ADMIN') && (
                                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-wasilatti-orange font-medium py-2">
                                        Console Admin
                                    </Link>
                                )}
                                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="block w-full text-left text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2">
                                    Déconnexion
                                </button>
                            </>
                        ) : (
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left text-white/90 dark:text-gray-200 hover:text-wasilatti-orange font-medium py-2 flex items-center gap-2">
                                <i className="fas fa-user"></i> Connexion
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavBar
