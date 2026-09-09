// ProductDetailModal.jsx
// Usage: import ProductDetailModal from './ProductDetailModal'
// <ProductDetailModal product={product} allProducts={products} onClose={() => setSelectedProduct(null)} />

import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Tag, Package, User, Layers, Star, Percent, AlertCircle, Warehouse } from 'lucide-react'
import { fetchProductById, normalizeProduct } from './productUtils'
import { useAuth } from '../../context/AuthContext'
import { DepotLocationSection } from '../../components/DepotLocationMap'

const ProductDetailModal = ({ product, allProducts = [], onClose }) => {
    const { user } = useAuth()
    const isAdminOrDriver = user?.roles?.some(r =>
        ['ADMIN', 'ROLE_ADMIN', 'LIVREUR', 'ROLE_LIVREUR', 'DRIVER', 'ROLE_DRIVER'].includes(r)
    )
    const [displayProduct, setDisplayProduct] = useState(() => normalizeProduct(product))
    const [activeImg, setActiveImg] = useState(0)
    const [imgError, setImgError] = useState({})
    const thumbnailRef = useRef(null)

    useEffect(() => {
        if (!product?.id) return
        let cancelled = false
        setDisplayProduct(normalizeProduct(product))
        fetchProductById(product.id)
            .then(full => {
                if (!cancelled) setDisplayProduct(full)
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [product?.id])

    // Similar products: same category OR same collaborator, exclude current
    const similar = allProducts.filter(p =>
        p.id !== displayProduct.id &&
        (p.category?.id === displayProduct.category?.id || p.collaborator?.id === displayProduct.collaborator?.id)
    ).slice(0, 6)

    const images = displayProduct.images?.length > 0 ? displayProduct.images : []
    const hasPromo = displayProduct.inPromotion && displayProduct.promotionPercentage > 0
    const promoPrice = hasPromo
        ? (displayProduct.price * (1 - displayProduct.promotionPercentage / 100)).toFixed(2)
        : null

    const nextImg = () => setActiveImg(i => (i + 1) % images.length)
    const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length)

    // Close on Escape
    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const stockColor = displayProduct.quantity === 0 ? '#ef4444' : displayProduct.quantity < 5 ? '#f59e0b' : '#10b981'
    const stockLabel = displayProduct.quantity === 0 ? 'Rupture de stock' : displayProduct.quantity < 5 ? `Plus que ${displayProduct.quantity} en stock` : `En stock (${displayProduct.quantity})`

    return (
        <div
            onClick={e => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,12,8,0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
                .pd-thumb::-webkit-scrollbar { height: 4px }
                .pd-thumb::-webkit-scrollbar-track { background: #f5f0e8 }
                .pd-thumb::-webkit-scrollbar-thumb { background: #d4c9b0; border-radius: 4px }
                .pd-similar-scroll::-webkit-scrollbar { height: 5px }
                .pd-similar-scroll::-webkit-scrollbar-track { background: #f5f0e8 }
                .pd-similar-scroll::-webkit-scrollbar-thumb { background: #d4c9b0; border-radius: 4px }
                .pd-similar-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
                .pd-close-btn:hover { background: #f48c06 !important; color: #fff !important }
                .pd-nav:hover { background: rgba(244,140,6,0.15) !important }
            `}</style>

            <div style={{
                background: '#fff',
                borderRadius: 24,
                width: '100%',
                maxWidth: 920,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
                animation: 'slideUp 0.28s ease',
                position: 'relative',
            }}>
                {/* Close */}
                <button
                    className="pd-close-btn"
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16, zIndex: 10,
                        width: 36, height: 36, borderRadius: '50%',
                        border: '1.5px solid #ede8df',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.18s',
                    }}
                >
                    <X size={16} color="currentColor" />
                </button>

                <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                    {/* ── LEFT: Images ─────────────────────────────────── */}
                    <div style={{ flex: '0 0 420px', maxWidth: '100%', padding: 28, borderRight: '1px solid #f5f0e8' }}>
                        {/* Main image */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: 320,
                            borderRadius: 16,
                            background: '#f5f0e8',
                            overflow: 'hidden',
                            marginBottom: 14,
                        }}>
                            {hasPromo && (
                                <div style={{
                                    position: 'absolute', top: 12, left: 12, zIndex: 2,
                                    background: '#f48c06', color: '#fff',
                                    borderRadius: 8, padding: '4px 10px',
                                    fontSize: 12, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <Percent size={11} /> -{displayProduct.promotionPercentage}%
                                </div>
                            )}
                            {images.length > 0 && !imgError[activeImg] ? (
                                <img
                                    src={images[activeImg].image_url}
                                    alt={displayProduct.name}
                                    onError={() => setImgError(e => ({ ...e, [activeImg]: true }))}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d4c9b0' }}>
                                    <Package size={52} />
                                    <span style={{ fontSize: 12, marginTop: 8, color: '#bbb' }}>Pas d'image</span>
                                </div>
                            )}

                            {/* Nav arrows */}
                            {images.length > 1 && (
                                <>
                                    <button className="pd-nav" onClick={prevImg} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button className="pd-nav" onClick={nextImg} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}

                            {/* Dot indicators */}
                            {images.length > 1 && (
                                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                                    {images.map((_, i) => (
                                        <button key={i} onClick={() => setActiveImg(i)} style={{ width: i === activeImg ? 18 : 7, height: 7, borderRadius: 4, border: 'none', background: i === activeImg ? '#f48c06' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="pd-thumb" ref={thumbnailRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                {images.map((img, i) => (
                                    <div key={i} onClick={() => setActiveImg(i)} style={{
                                        flexShrink: 0, width: 60, height: 60,
                                        borderRadius: 10, overflow: 'hidden',
                                        border: `2px solid ${i === activeImg ? '#f48c06' : '#ede8df'}`,
                                        cursor: 'pointer', transition: 'border-color 0.15s',
                                        background: '#f5f0e8',
                                    }}>
                                        {!imgError[i] ? (
                                            <img src={img.image_url} alt="" onError={() => setImgError(e => ({ ...e, [i]: true }))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#d4c9b0" /></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Info ───────────────────────────────────── */}
                    <div style={{ flex: 1, minWidth: 260, padding: 28 }}>
                        {/* Category & Brand */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {displayProduct.category && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff8ee', color: '#f48c06', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, border: '1px solid #fde9c0' }}>
                                    <Layers size={10} /> {displayProduct.category.name}
                                </span>
                            )}
                            {displayProduct.brand && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0faf9', color: '#50afa8', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, border: '1px solid #c0e8e5' }}>
                                    <Tag size={10} /> {displayProduct.brand}
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#2d2a22', lineHeight: 1.25 }}>
                            {displayProduct.name}
                        </h2>

                        {/* Collaborator */}
                        {displayProduct.collaborator && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: '#969696', fontSize: 13 }}>
                                <User size={13} />
                                <span>Par <strong style={{ color: '#2d2a22' }}>{displayProduct.collaborator.name}</strong></span>
                            </div>
                        )}

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                            {hasPromo ? (
                                <>
                                    <span style={{ fontSize: 28, fontWeight: 900, color: '#f48c06' }}>{promoPrice} MAD</span>
                                    <span style={{ fontSize: 15, color: '#bbb', textDecoration: 'line-through' }}>{displayProduct.price.toFixed(2)} MAD</span>
                                </>
                            ) : (
                                <span style={{ fontSize: 28, fontWeight: 900, color: '#2d2a22' }}>{displayProduct.price?.toFixed(2)} MAD</span>
                            )}
                        </div>

                        {/* Stock */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor, display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: stockColor }}>{stockLabel}</span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: '#f5f0e8', marginBottom: 18 }} />

                        {/* Description */}
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</h4>
                            <p style={{ margin: 0, fontSize: 14, color: '#4a4540', lineHeight: 1.7 }}>
                                {displayProduct.description || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Aucune description.</span>}
                            </p>
                        </div>

                        {/* Info grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {[
                                { label: 'Quantité', value: displayProduct.quantity, icon: <Package size={13} /> },
                                { label: 'Promotion', value: hasPromo ? `${displayProduct.promotionPercentage}% de remise` : 'Non', icon: <Percent size={13} /> },
                            ].map(({ label, value, icon }) => (
                                <div key={label} style={{ background: '#f9f7f3', borderRadius: 10, padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#969696', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{icon}{label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2d2a22' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Dépôt — visible admin/livreur uniquement */}
                        {isAdminOrDriver && (displayProduct.depotAddress || displayProduct.depotLatitude != null) && (
                            <div style={{ marginTop: 14 }}>
                                <DepotLocationSection
                                    address={displayProduct.depotAddress}
                                    latitude={displayProduct.depotLatitude}
                                    longitude={displayProduct.depotLongitude}
                                    subtitle="(Visible livreur / admin)"
                                    mapHeight={180}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Similar Products ────────────────────────────────── */}
                {similar.length > 0 && (
                    <div style={{ borderTop: '1px solid #f5f0e8', padding: '22px 28px 28px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Produits similaires
                        </h4>
                        <div className="pd-similar-scroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
                            {similar.map(sp => (
                                <SimilarCard key={sp.id} product={sp} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const SimilarCard = ({ product }) => {
    const [imgErr, setImgErr] = useState(false)
    const thumb = product.images?.[0]?.image_url
    const hasPromo = product.inPromotion && product.promotionPercentage > 0
    const promoPrice = hasPromo ? (product.price * (1 - product.promotionPercentage / 100)).toFixed(2) : null

    return (
        <div className="pd-similar-card" style={{
            flexShrink: 0, width: 150,
            background: '#fff',
            border: '1.5px solid #f0ece4',
            borderRadius: 14,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
            <div style={{ height: 110, background: '#f5f0e8', position: 'relative', overflow: 'hidden' }}>
                {thumb && !imgErr ? (
                    <img src={thumb} alt={product.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={28} color="#d4c9b0" />
                    </div>
                )}
                {hasPromo && (
                    <div style={{ position: 'absolute', top: 6, left: 6, background: '#f48c06', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                        -{product.promotionPercentage}%
                    </div>
                )}
            </div>
            <div style={{ padding: '10px 10px 12px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#2d2a22', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {product.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: hasPromo ? '#f48c06' : '#2d2a22' }}>
                        {hasPromo ? promoPrice : product.price?.toFixed(2)} MAD
                    </span>
                    {hasPromo && <span style={{ fontSize: 10, color: '#bbb', textDecoration: 'line-through' }}>{product.price?.toFixed(2)}</span>}
                </div>
            </div>
        </div>
    )
}

export default ProductDetailModal
