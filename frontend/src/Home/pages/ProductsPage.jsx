import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductsHeader from '../../features/products/components/ProductsHeader';
import { useProducts } from '../../features/products/useProducts';
import { ProductCard } from '../../components/cards/ProductCard';
import Footer from '../../components/Footer';
import { Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductsPage = ({ toggleCart }) => {
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const {
    collaborators, categories, products,
    loadingCollabs, loadingCats, loadingProducts,
    errorProducts,
    selCollab, setSelCollab,
    selCategory, setSelCategory,
  } = useProducts();

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selCollab, selCategory]);

  // Pre-select category from URL query param (?category=ID)
  useEffect(() => {
    const catId = searchParams.get('category');
    if (catId && categories.length > 0) {
      const numId = Number(catId);
      const found = categories.find(c => c.id === numId);
      if (found) {
        setSelCategory(numId);
      }
    }
  }, [searchParams, categories, setSelCategory]);

  const handleCollabChange = (collabId) => {
    setSelCollab(collabId);
    setSelCategory(null);
  };

  // Filtre local par recherche texte
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q) ||
      p.collaborator?.name?.toLowerCase().includes(q)
    );
  }, [products, search]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans">

      {/* ── Barre unique : recherche + collaborateurs + catégories ────────────── */}
      <ProductsHeader
        searchValue={search}
        onSearchChange={setSearch}
        collaborators={collaborators}
        loadingCollabs={loadingCollabs}
        selCollab={selCollab}
        onCollabChange={handleCollabChange}
        categories={categories}
        loadingCats={loadingCats}
        selCategory={selCategory}
        onCategoryChange={setSelCategory}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">

        {/* ── Titre + compteur ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold dark:text-white">
            {selCategory
              ? categories.find(c => c.id === selCategory)?.name
              : selCollab
              ? collaborators.find(c => c.id === selCollab)?.name
              : 'Tous nos produits partenaires'}
          </h2>
          {!loadingProducts && (
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Grille produits ─────────────────────────────────────────────────── */}
        {loadingProducts ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4 text-orange-500">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="font-medium text-gray-600 dark:text-gray-300">Chargement des produits...</span>
          </div>
        ) : errorProducts ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-red-300 mb-4" />
            <p className="text-red-500 font-medium">{errorProducts}</p>
            <p className="text-sm text-gray-400 mt-2">Vérifiez que le serveur backend est démarré.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Package size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">Aucun produit trouvé</p>
            <p className="text-sm">
              {search ? `Aucun résultat pour "${search}"` : 'Essayez un autre filtre.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} allProducts={filteredProducts} />
              ))}
            </div>

            {/* Pagination Controls */}
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

      <Footer />
    </div>
  );
};

export default ProductsPage;
