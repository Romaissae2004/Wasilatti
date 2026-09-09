import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { Loader2, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';

// Fallback images based on category name keywords
const CATEGORY_IMAGES = {
  'smartphone':   'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop',
  'informatique': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400&auto=format&fit=crop',
  'vêtements':    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop',
  'chaussures':   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
  'alimentation': 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=400&auto=format&fit=crop',
  'cosmétiques':  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop',
  'fruits':       'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400&auto=format&fit=crop',
  'légumes':      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400&auto=format&fit=crop',
  'laitier':      'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400&auto=format&fit=crop',
  'épicerie':     'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=400&auto=format&fit=crop',
  'plats':        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop',
  'entrées':      'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop',
  'desserts':     'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop',
  'bouquets':     'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=400&auto=format&fit=crop',
  'plantes':      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=400&auto=format&fit=crop',
  'compositions': 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=400&auto=format&fit=crop',
  'restaurant':   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop',
  'supermarché':  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=400&auto=format&fit=crop',
  'pharmacie':    'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=400&auto=format&fit=crop',
  'fleur':        'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=400&auto=format&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=400&auto=format&fit=crop';

function getCategoryImage(category) {
  // If category has an image from backend
  if (category.image?.url) return category.image.url;

  const name = (category.name || '').toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (name.includes(key)) return url;
  }
  return DEFAULT_IMAGE;
}

const ITEMS_PER_PAGE = 8;

const Categories = () => {
  const navigate = useNavigate();

  // Data state
  const [categories, setCategories] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories and collaborators
  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      axios.get('/categories'),
      axios.get('/collaborators'),
    ])
      .then(([catRes, collabRes]) => {
        setCategories(catRes.data.data ?? []);
        setCollaborators(collabRes.data.data ?? []);
      })
      .catch(() => setError('Impossible de charger les catégories.'))
      .finally(() => setLoading(false));
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    let result = categories;

    // Filter by collaborator
    if (selectedCollab !== null) {
      result = result.filter(c => c.collaborator?.id === selectedCollab);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.collaborator?.name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [categories, selectedCollab, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCollab]);

  // Navigate to products page with category pre-selected
  const handleCategoryClick = (categoryId) => {
    navigate(`/products?category=${categoryId}`);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCollab(null);
  };

  const hasActiveFilters = search.trim() || selectedCollab !== null;

  return (
    <section id="categories" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-32 w-64 h-64 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -right-32 w-64 h-64 bg-cyan-200/20 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 scroll-reveal active">
          <span className="text-wasilatti-blue font-semibold text-sm uppercase tracking-widest">
            Nos Catégories
          </span>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-gray-900 dark:text-white mt-3">
            Ce que vous pouvez<br />
            <span className="text-gradient">commander</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            Explorez nos catégories et trouvez exactement ce dont vous avez besoin parmi nos partenaires.
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-wasilatti-orange/50 focus:border-wasilatti-orange outline-none transition-all backdrop-blur-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Collaborator filter pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <SlidersHorizontal size={16} className="text-gray-400 dark:text-gray-500 mr-1" />
            <button
              onClick={() => setSelectedCollab(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCollab === null
                  ? 'bg-gradient-to-r from-orange-500 to-cyan-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
              }`}
            >
              Toutes
            </button>
            {collaborators.map(collab => (
              <button
                key={collab.id}
                onClick={() => setSelectedCollab(collab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCollab === collab.id
                    ? 'bg-gradient-to-r from-orange-500 to-cyan-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                }`}
              >
                {collab.name}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center gap-1"
              >
                <X size={14} /> Effacer
              </button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredCategories.length} catégorie{filteredCategories.length !== 1 ? 's' : ''} trouvée{filteredCategories.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-slate-700"></div>
              <Loader2 className="w-16 h-16 absolute inset-0 animate-spin text-wasilatti-orange" />
            </div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Chargement des catégories...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto text-red-300 dark:text-red-700 mb-4" />
            <p className="text-red-500 font-medium">{error}</p>
            <p className="text-sm text-gray-400 mt-2">Vérifiez que le serveur backend est démarré.</p>
          </div>
        ) : paginatedCategories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <Search size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">Aucune catégorie trouvée</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {search ? `Aucun résultat pour "${search}"` : 'Essayez un autre filtre.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 rounded-full text-sm font-semibold text-wasilatti-orange border border-wasilatti-orange hover:bg-wasilatti-orange hover:text-white transition-all"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {paginatedCategories.map((cat, index) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="group cursor-pointer scroll-reveal active"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="relative h-52 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/10 dark:border-slate-700/50 hover:-translate-y-2">
                    <img
                      src={getCategoryImage(cat)}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-500"></div>

                    {/* Product count badge */}
                    {cat.products && cat.products.length > 0 && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">
                        {cat.products.length} produit{cat.products.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h3 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-orange-200 transition-colors">
                        {cat.name}
                      </h3>
                      {cat.collaborator && (
                        <p className="text-white/60 text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <ShoppingBag size={12} />
                          {cat.collaborator.name}
                        </p>
                      )}
                    </div>

                    {/* Hover arrow */}
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
                      <ChevronRight size={16} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-300'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 ${
                      page === currentPage
                        ? 'bg-gradient-to-r from-orange-500 to-cyan-500 text-white shadow-md shadow-orange-500/20 scale-110'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-300'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default Categories
