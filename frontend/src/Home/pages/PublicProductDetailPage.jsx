import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Star, ShoppingBag,
  Package, Truck, RotateCcw, ShieldCheck, Minus, Plus,
  Clock, Store, Tag, Layers,
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────
const getProductImage = (p) => {
  if (p?.imageUrls?.[0])        return p.imageUrls[0]
  if (p?.images?.[0]?.image_url) return p.images[0].image_url
  if (p?.image?.image_url)      return p.image.image_url
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────
const PublicProductDetailPage = ({ onAddToCart, onOrder }) => {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const product    = state?.product
  const allProducts = state?.allProducts ?? []

  const [activeImg, setActiveImg]     = useState(0)
  const [imgError, setImgError]       = useState({})
  const [selectedSize, setSelectedSize] = useState(null)
  const [qty, setQty]                 = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  // Reset on product change
  useEffect(() => {
    setActiveImg(0)
    setImgError({})
    setSelectedSize(null)
    setQty(1)
  }, [product?.id])

  if (!product) { navigate('/'); return null }

  // Normalise to [{ image_url }] regardless of which shape the API returns
  const images = (() => {
    if (product.imageUrls?.length > 0)
      return product.imageUrls.map(url => ({ image_url: url }))
    if (product.images?.length > 0)
      return product.images.map(img =>
        typeof img === 'string' ? { image_url: img } : img
      )
    if (product.image?.image_url)
      return [product.image]
    if (typeof product.image === 'string')
      return [{ image_url: product.image }]
    return []
  })()

  const hasPromo   = product.inPromotion && product.promotionPercentage > 0
  const price      = product.price ?? 0
  const promoPrice = hasPromo ? (price * (1 - product.promotionPercentage / 100)) : price
  const totalPrice = (promoPrice * qty).toFixed(2)

  const stockColor = product.quantity === 0 ? '#ef4444'
    : product.quantity < 5 ? '#f59e0b' : '#10b981'
  const stockLabel = product.quantity === 0 ? 'Rupture de stock'
    : product.quantity < 5 ? `Plus que ${product.quantity} en stock`
    : `En stock (${product.quantity})`

  // Similar products
  const similar = allProducts.filter(p =>
    p.id !== product.id &&
    (p.category?.id === product.category?.id || p.collaborator?.id === product.collaborator?.id)
  ).slice(0, 6)

  const handleAddToCart = () => {
    onAddToCart?.(product, qty, selectedSize)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleOrder = () => {
    onOrder?.({ product, qty, size: selectedSize, totalPrice })
    navigate('/checkout', { state: { items: [{ product, qty, size: selectedSize }] } })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', backgroundImage: 'radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%)' }}>

      {/* ── Nav bar ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #ede8df', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px solid #ede8df', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#2d2a22', cursor: 'pointer', transition: 'all 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f48c06'; e.currentTarget.style.color = '#f48c06' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#2d2a22' }}
        >
          <ChevronLeft size={16} /> Retour
        </button>

        {/* Breadcrumb */}
        <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#969696' }}>
          <span
            style={{ cursor: 'pointer', color: '#f48c06', fontWeight: 600 }}
            onClick={() => navigate('/')}
          >
            Accueil
          </span>
          <ChevronRight size={12} />
          {product.category?.name && (
            <>
              <span>{product.category.name}</span>
              <ChevronRight size={12} />
            </>
          )}
          <span style={{ color: '#2d2a22', fontWeight: 600 }}>{product.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Main card ── */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ede8df', display: 'flex', gap: 0, flexWrap: 'wrap', marginBottom: 40, overflow: 'hidden' }}>

          {/* Images */}
          <div style={{ flex: '0 0 460px', maxWidth: '100%', padding: 28, borderRight: '1px solid #f5f0e8' }}>
            <div style={{ position: 'relative', width: '100%', height: 380, borderRadius: 14, background: '#f5f0e8', overflow: 'hidden', marginBottom: 14 }}>
              {hasPromo && (
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 800 }}>
                  -{product.promotionPercentage}%
                </div>
              )}
              {images.length > 0 && !imgError[activeImg] ? (
                <img
                  src={images[activeImg]?.image_url}
                  alt={product.name}
                  onError={() => setImgError(e => ({ ...e, [activeImg]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d4c9b0' }}>
                  <Package size={64} />
                  <span style={{ fontSize: 13, marginTop: 10, color: '#bbb' }}>Pas d'image</span>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <ChevronRight size={16} />
                  </button>
                  <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        style={{ width: i === activeImg ? 20 : 7, height: 7, borderRadius: 4, border: 'none', background: i === activeImg ? '#f48c06' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === activeImg ? '#f48c06' : '#ede8df'}`, background: '#f5f0e8', transition: 'border-color 0.15s' }}>
                    {!imgError[i]
                      ? <img src={img.image_url} alt="" onError={() => setImgError(e => ({ ...e, [i]: true }))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#d4c9b0" /></div>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div style={{ flex: 1, minWidth: 300, padding: 32 }}>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {product.category && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0faf9', color: '#50afa8', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #c0e8e5' }}>
                  <Layers size={10} /> {product.category.name}
                </span>
              )}
              {product.brand && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff8ee', color: '#f48c06', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #fde9c0' }}>
                  <Tag size={10} /> {product.brand}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 900, color: '#2d2a22', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Collaborator / Store */}
            {product.collaborator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: '#969696', fontSize: 13 }}>
                <Store size={13} />
                Par <strong style={{ color: '#2d2a22', marginLeft: 3 }}>{product.collaborator.name}</strong>
              </div>
            )}

            {/* Rating */}
            {product.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} color={s <= Math.round(product.rating) ? '#f59e0b' : '#e5e7eb'} fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'} />
                ))}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2d2a22' }}>{product.rating.toFixed(1)}</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              {hasPromo ? (
                <>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#f48c06' }}>{promoPrice.toFixed(2)} DH</span>
                  <span style={{ fontSize: 18, color: '#bbb', textDecoration: 'line-through' }}>{price.toFixed(2)} DH</span>
                </>
              ) : (
                <span style={{ fontSize: 36, fontWeight: 900, color: '#2d2a22' }}>{price.toFixed(2)} DH</span>
              )}
            </div>

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor, display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: stockColor }}>{stockLabel}</span>
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Taille</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      style={{ minWidth: 44, height: 44, padding: '0 14px', borderRadius: 10, border: `1.5px solid ${selectedSize === size ? '#f48c06' : '#ede8df'}`, background: selectedSize === size ? '#fff8ee' : '#fff', color: selectedSize === size ? '#f48c06' : '#2d2a22', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quantité</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ede8df', borderRadius: 12, overflow: 'hidden', background: '#f9f7f3' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#969696', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ede8df'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2d2a22', minWidth: 32, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.quantity ?? 99, q + 1))}
                    style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f48c06', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff8ee'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span style={{ fontSize: 13, color: '#969696', fontWeight: 500 }}>
                  Total : <strong style={{ color: '#2d2a22' }}>{totalPrice} DH</strong>
                </span>
              </div>
            </div>

            {/* ── CTA Buttons ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              {/* Commander */}
              <button
                onClick={handleOrder}
                disabled={product.quantity === 0}
                style={{
                  flex: 1, minWidth: 150, height: 52, borderRadius: 14, border: 'none',
                  background: product.quantity === 0 ? '#e5e7eb' : 'linear-gradient(135deg, #f48c06, #e07b05)',
                  color: product.quantity === 0 ? '#9ca3af' : '#fff',
                  fontSize: 15, fontWeight: 800, cursor: product.quantity === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: product.quantity === 0 ? 'none' : '0 8px 20px rgba(244,140,6,0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (product.quantity > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(244,140,6,0.45)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = product.quantity > 0 ? '0 8px 20px rgba(244,140,6,0.35)' : 'none' }}
              >
                <Clock size={18} /> Commander maintenant
              </button>

              {/* Ajouter au panier */}
              <button
                onClick={handleAddToCart}
                disabled={product.quantity === 0}
                style={{
                  flex: 1, minWidth: 150, height: 52, borderRadius: 14,
                  border: `2px solid ${addedToCart ? '#10b981' : '#f48c06'}`,
                  background: addedToCart ? '#f0fdf4' : '#fff',
                  color: addedToCart ? '#10b981' : '#f48c06',
                  fontSize: 15, fontWeight: 800, cursor: product.quantity === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!addedToCart && product.quantity > 0) e.currentTarget.style.background = '#fff8ee' }}
                onMouseLeave={e => { if (!addedToCart) e.currentTarget.style.background = '#fff' }}
              >
                <ShoppingBag size={18} />
                {addedToCart ? 'Ajouté ✓' : 'Ajouter au panier'}
              </button>
            </div>

            {/* Reassurance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', padding: '20px 0', borderTop: '1px dashed #ede8df' }}>
              {[
                { icon: <ShieldCheck size={18} color="#f48c06" />, label: 'Paiement sécurisé' },
                { icon: <Truck size={18} color="#f48c06" />,       label: 'Livraison offerte' },
                { icon: <RotateCcw size={18} color="#f48c06" />,   label: 'Retours gratuits' },
                { icon: <Clock size={18} color="#f48c06" />,       label: '20-30 min de livraison' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {icon}
                  <span style={{ fontSize: 13, color: '#4a4540', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        {product.description && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede8df', padding: '24px 28px', marginBottom: 32 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#2d2a22' }}>Description</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#4a4540', lineHeight: 1.8 }}>{product.description}</p>
          </div>
        )}

        {/* ── Similar products ── */}
        {similar.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 800, color: '#2d2a22' }}>Produits similaires</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
              {similar.map(sp => {
                const thumb       = getProductImage(sp)
                const spHasPromo  = sp.inPromotion && sp.promotionPercentage > 0
                const spPrice     = spHasPromo ? (sp.price * (1 - sp.promotionPercentage / 100)).toFixed(2) : sp.price?.toFixed(2)
                return (
                  <div key={sp.id}
                    onClick={() => navigate('/products/' + sp.id, { state: { product: sp, allProducts } })}
                    style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #ede8df', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: 130, background: '#f5f0e8', position: 'relative', overflow: 'hidden' }}>
                      {thumb
                        ? <img src={thumb} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={28} color="#d4c9b0" /></div>
                      }
                      {spHasPromo && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                          -{sp.promotionPercentage}%
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px 16px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#2d2a22', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {sp.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: spHasPromo ? '#f48c06' : '#2d2a22' }}>{spPrice} DH</span>
                        {spHasPromo && <span style={{ fontSize: 10, color: '#bbb', textDecoration: 'line-through' }}>{sp.price?.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicProductDetailPage
