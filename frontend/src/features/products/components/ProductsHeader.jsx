import React from 'react';
import { Loader2 } from 'lucide-react';

const ProductsHeader = ({
  // Recherche
  searchValue = '',
  onSearchChange,

  // Collaborateurs (boutiques)
  collaborators = [],
  loadingCollabs = false,
  selCollab = null,
  onCollabChange,

  // Catégories
  categories = [],
  loadingCats = false,
  selCategory = null,
  onCategoryChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 sticky top-[80px] z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 space-y-3">

        {/* ── Ligne 1 : Recherche + Boutiques ─────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              placeholder="Rechercher un produit, une boutique..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-0 focus:ring-2 focus:ring-wasilatti-orange outline-none transition-all"
            />
          </div>

          {/* Filtres Boutiques (collaborateurs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
            {loadingCollabs ? (
              <Loader2 size={16} className="animate-spin text-orange-500 shrink-0" />
            ) : (
              <>
                <button
                  onClick={() => onCollabChange?.(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selCollab === null
                      ? 'bg-wasilatti-orange text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Tout
                </button>
                {collaborators.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onCollabChange?.(c.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selCollab === c.id
                        ? 'bg-wasilatti-orange text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Ligne 2 : Filtres Catégories (si disponibles) ────────────────────── */}
        {(categories.length > 0 || loadingCats) && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">
              Catégories :
            </span>
            {loadingCats ? (
              <Loader2 size={14} className="animate-spin text-teal-500 shrink-0" />
            ) : (
              <>
                <button
                  onClick={() => onCategoryChange?.(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                    selCategory === null
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-teal-400 hover:text-teal-500'
                  }`}
                >
                  Toutes
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange?.(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      selCategory === cat.id
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-teal-400 hover:text-teal-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductsHeader;
