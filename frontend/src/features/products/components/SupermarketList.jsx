import React from 'react';

const SupermarketList = ({ toggleCart }) => {
  const supermarkets = [
    { name: 'Pack Eau 6x1.5L', prix: 45, img: '💧', market: 'Marjane' },
    { name: 'Riz Basmati 5kg', prix: 85, img: '🍚', market: 'Carrefour' },
    { name: "Huile d'olive 1L", prix: 65, img: '🫒', market: 'Aswak Assalam' },
    { name: 'Café moulu 250g', prix: 35, img: '☕', market: 'BIM' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2 dark:text-white">
        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">
          🛒
        </span>
        Supermarchés
      </h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supermarkets.map((p, i) => (
          <div key={i} className="product-card bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all">
            <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center group">
              <span className="product-img text-6xl group-hover:scale-110 transition-transform duration-500">
                {p.img}
              </span>
              <button 
                onClick={toggleCart}
                className="add-btn absolute bottom-3 right-3 w-10 h-10 rounded-full bg-wasilatti-orange text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                {p.market}
              </p>
              <h3 className="font-bold text-sm mb-2 dark:text-white">{p.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-wasilatti-orange">{p.prix} DH</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">En stock</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupermarketList;
