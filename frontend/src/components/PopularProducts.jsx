import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Star, Clock, Store, Flame } from 'lucide-react'
import { useStoreData } from '../hooks/useStoreData'

// ── Image helper ────────────────────────────────────────────────────────────
const getProductImage = (p) => {
  if (p.imageUrls?.[0])        return p.imageUrls[0]
  if (p.images?.[0]?.image_url) return p.images[0].image_url
  if (p.image?.image_url)      return p.image.image_url
  if (typeof p.image === 'string') return p.image
  return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop'
}

// ── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-pulse bg-white dark:bg-slate-900">
    <div className="h-56 bg-gray-200 dark:bg-slate-800" />
    <div className="p-6 space-y-3">
      <div className="h-3 w-1/2 bg-gray-200 dark:bg-slate-700 rounded" />
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-slate-700 rounded" />
      <div className="h-3 w-1/3 bg-gray-200 dark:bg-slate-700 rounded" />
      <div className="h-6 w-1/4 bg-gray-200 dark:bg-slate-700 rounded mt-4" />
    </div>
  </div>
)

// ── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, allProducts, onAddToCart, idx }) => {
  const navigate  = useNavigate()
  const [added, setAdded] = useState(false)

  const price     = product.price ?? 0
  const hasPromo  = product.inPromotion && product.promotionPercentage > 0
  const promoPrice = hasPromo
    ? (price * (1 - product.promotionPercentage / 100)).toFixed(2)
    : null
  const isHot     = product.rating >= 4.8 || product.quantity < 5
  const rating    = product.rating?.toFixed(1) ?? '—'

  const handleAdd = (e) => {
    e.stopPropagation()
    onAddToCart(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleClick = () => {
    navigate(`/products/${product.id}`, { state: { product, allProducts } })
  }

  return (
    <div
      onClick={handleClick}
      className="product-card bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(8,145,178,0.15)] transition-all duration-300 scroll-reveal active flex flex-col group cursor-pointer"
      style={{ transitionDelay: `${idx * 0.08}s` }}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-slate-800">
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Promo badge */}
        {hasPromo && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-500/30 z-20">
            -{product.promotionPercentage}%
          </div>
        )}

        {/* Hot badge */}
        {isHot && (
          <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg shadow-orange-500/30 animate-pulse z-20">
            <Flame size={14} />
          </div>
        )}

        {/* Collaborator chip */}
        {product.collaborator?.name && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-orange-500 px-2 py-1 rounded-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {product.collaborator.name}
          </div>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          className={`add-btn absolute bottom-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all z-20
            ${added
              ? 'bg-green-500 shadow-green-500/40 scale-110'
              : 'bg-wasilatti-blue shadow-wasilatti-blue/40 hover:bg-wasilatti-blueLight hover:scale-105'
            }`}
        >
          {added
            ? <span className="text-white text-xs font-bold">✓</span>
            : <ShoppingBag size={18} className="text-white" />
          }
        </button>
      </div>

      {/* Info */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <Clock size={10} className="text-orange-400" />
            {product.deliveryTime ?? '20-30 min'}
          </span>
          <span className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-lg border border-green-100 dark:border-green-800/50">
            <Star size={10} className="text-yellow-500" fill="currentColor" />
            {rating}
          </span>
        </div>

        <h3 className="font-extrabold text-xl mb-1 text-gray-800 dark:text-white line-clamp-1">
          {product.name}
        </h3>

        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
          <Store size={12} className="text-gray-400" />
          {product.collaborator?.name ?? product.category?.name ?? 'Boutique'}
        </p>

        <div className="mt-auto flex items-end gap-3">
          <span className="text-2xl font-black text-wasilatti-blue">
            {hasPromo ? promoPrice : price.toFixed(2)} DH
          </span>
          {hasPromo && (
            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 line-through mb-1">
              {price.toFixed(2)} DH
            </span>
          )}
        </div>

        {/* Stock indicator */}
        {product.quantity != null && product.quantity <= 5 && product.quantity > 0 && (
          <p className="text-[10px] font-semibold text-amber-500 mt-2">
            Plus que {product.quantity} en stock !
          </p>
        )}
        {product.quantity === 0 && (
          <p className="text-[10px] font-semibold text-red-400 mt-2">Rupture de stock</p>
        )}
      </div>
    </div>
  )
}

// ── Section ──────────────────────────────────────────────────────────────────
const PopularProducts = ({ onAddToCart }) => {
  const { products, loading, error } = useStoreData()
  const [filterCat, setFilterCat] = useState(null)

  // Extract unique categories from products
  const cats = Array.from(
    new Map(products.map(p => p.category).filter(Boolean).map(c => [c.id, c])).values()
  )

  // Sort: in-promo or high-rating first, then take top 8
  const sorted = [...products]
    .filter(p => filterCat == null || p.category?.id === filterCat)
    .sort((a, b) => {
      const scoreA = (a.rating ?? 0) + (a.inPromotion ? 1 : 0)
      const scoreB = (b.rating ?? 0) + (b.inPromotion ? 1 : 0)
      return scoreB - scoreA
    })
    .slice(0, 8)

  return (
    <section
      id="products-preview"
      className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 scroll-reveal active">
          <div>
            <span className="text-wasilatti-orange font-semibold text-sm uppercase tracking-widest">
              Populaires
            </span>
            <h2 className="text-4xl font-display font-black text-gray-900 dark:text-white mt-3">
              Les favoris du moment
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden md:flex items-center gap-2 text-wasilatti-blue font-semibold hover:gap-3 transition-all"
          >
            Voir tout →
          </Link>
        </div>

        {/* Category filter tabs */}
        {cats.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button
              onClick={() => setFilterCat(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                ${filterCat == null
                  ? 'bg-wasilatti-blue text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
            >
              Tout
            </button>
            {cats.map(c => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                  ${filterCat === c.id
                    ? 'bg-wasilatti-blue text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-red-500 mb-8 text-sm">
            Impossible de charger les produits. Vérifiez votre connexion au serveur.
          </p>
        )}

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : sorted.length > 0
              ? sorted.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    allProducts={products}
                    onAddToCart={onAddToCart ?? (() => {})}
                    idx={idx}
                  />
                ))
              : !error && (
                  <div className="col-span-4 text-center py-16 text-gray-400 text-sm">
                    Aucun produit disponible pour le moment.
                  </div>
                )
          }
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link
            to="/products"
            className="btn-secondary px-8 py-3 rounded-full font-semibold inline-block"
          >
            Voir tous les produits
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PopularProducts
