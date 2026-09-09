import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import './index.css';
import NavBar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin') ||
                     location.pathname.startsWith('/driver') ||
                     location.pathname.startsWith('/merchant') ||
                     location.pathname === '/dashboard' ||
                     location.pathname === '/drivers';


  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {!isAdminRoute && <NavBar toggleCart={toggleCart} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />}
      {!isAdminRoute && <CartSidebar isOpen={isCartOpen} toggleCart={toggleCart} />}
      <div className="flex-1">
        <AppRoutes toggleCart={toggleCart} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>              {/* ← wraps tout */}
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
