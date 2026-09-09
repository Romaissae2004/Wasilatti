import React from 'react';

const RestaurantList = () => {
  const restaurants = [
    { name: "McDonald's", cat: 'Fast Food', note: '4.8', time: '15-25 min', frais: '15 DH', img: '🍔', color: 'from-red-500 to-yellow-500' },
    { name: 'Sushi Master', cat: 'Japonais', note: '4.9', time: '25-35 min', frais: '20 DH', img: '🍣', color: 'from-orange-400 to-red-500' },
    { name: 'Green Bowl', cat: 'Healthy', note: '4.5', time: '15-20 min', frais: '12 DH', img: '🥗', color: 'from-green-400 to-emerald-600' },
    { name: 'Pizza Hut', cat: 'Italien', note: '4.6', time: '20-30 min', frais: '15 DH', img: '🍕', color: 'from-green-500 to-green-700' },
    { name: 'Tacos Avenue', cat: 'Snack', note: '4.7', time: '10-20 min', frais: '10 DH', img: '🌮', color: 'from-yellow-400 to-orange-500' },
    { name: 'Le Petit Bistro', cat: 'Français', note: '4.8', time: '30-40 min', frais: '25 DH', img: '🥐', color: 'from-blue-400 to-indigo-600' },
  ];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">
        Restaurants populaires
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((r, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group">
            <div className={`h-48 bg-gradient-to-br ${r.color} relative overflow-hidden`}>
              <span className="absolute inset-0 flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-500">
                {r.img}
              </span>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur text-sm font-bold flex items-center gap-1 dark:text-white">
                <i className="fas fa-star text-yellow-400"></i> {r.note}
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{r.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{r.cat}</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                  Ouvert
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <i className="fas fa-clock text-wasilatti-orange"></i> {r.time}
                </span>
                <span className="flex items-center gap-1">
                  <i className="fas fa-motorcycle text-wasilatti-orange"></i> {r.frais}
                </span>
              </div>
              
              <button className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-wasilatti-orange dark:hover:bg-wasilatti-orange hover:text-white transition-all">
                Voir le menu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;
