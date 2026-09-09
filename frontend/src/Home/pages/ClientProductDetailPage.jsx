import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { fetchProductById } from '../../features/products/productUtils'
import {
    ChevronLeft, ChevronRight, Tag, Package,
    User, Layers, Percent, ShieldCheck,
    Ruler, Truck, RotateCcw, ShoppingCart
} from 'lucide-react'

const ClientProductDetailPage = () => {
    const { state } = useLocation()
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToCart } = useCart()

    const [currentProduct, setCurrentProduct] = useState(state?.product ?? null)
    const [allProducts]  = useState(state?.allProducts ?? [])
    const [activeImg, setActiveImg]     = useState(0)
    const [imgError, setImgError]       = useState({})
    const [selectedSize, setSelectedSize] = useState(null)
    const [qty, setQty]                 = useState(1)
    const [loading, setLoading]         = useState(!state?.product)

    // ── Synchroniser avec la navigation (changement de produit) ───────────
    useEffect(() => {
        if (state?.product && String(state.product.id) === String(id)) {
            setCurrentProduct(state.product)
        }
    }, [id, state?.product])

    // ── Enrichir avec les données complètes (description) depuis l'API ────
    useEffect(() => {
        if (!id) return
        let cancelled = false

        fetchProductById(id)
            .then(product => {
                if (!cancelled && product?.id) {
                    setCurrentProduct(prev => (prev ? { ...prev, ...product } : product))
                }
            })
            .catch(() => {
                // Ne rediriger que si aucune donnée n'est disponible
                if (!cancelled && !state?.product) {
                    navigate('/products')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [id, navigate, state?.product])

    // ── Reset à chaque changement de produit ──────────────────────────────
    useEffect(() => {
        setActiveImg(0)
        setImgError({})
        setSelectedSize(null)
        setQty(1)
    }, [currentProduct?.id])

    useEffect(() => {
        if (!loading && !currentProduct) {
            navigate('/products')
        }
    }, [loading, currentProduct, navigate])

    if (loading && !currentProduct) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#f48c06' }}>
            Chargement...
        </div>
    )

    if (!currentProduct) return null

    // ── Données dérivées ──────────────────────────────────────────────────
    const images = currentProduct.images?.length > 0
        ? currentProduct.images
        : currentProduct.imageUrls?.length > 0
            ? currentProduct.imageUrls.map(url => ({ image_url: url }))
            : []

    const hasPromo   = currentProduct.inPromotion && currentProduct.promotionPercentage > 0
    const promoPrice = hasPromo
        ? (currentProduct.price * (1 - currentProduct.promotionPercentage / 100)).toFixed(2)
        : null

    const stockColor = currentProduct.quantity === 0 ? '#ef4444'
        : currentProduct.quantity < 5 ? '#f59e0b' : '#10b981'
    const stockLabel = currentProduct.quantity === 0 ? 'Rupture de stock'
        : currentProduct.quantity < 5 ? `Plus que ${currentProduct.quantity} en stock`
        : `En stock (${currentProduct.quantity})`

    const similar = allProducts.filter(p =>
        p.id !== currentProduct.id &&
        (p.category?.id === currentProduct.category?.id ||
         p.collaborator?.id === currentProduct.collaborator?.id)
    ).slice(0, 8)

    const getProductImage = (p) => {
        if (p.images?.[0]?.image_url) return p.images[0].image_url
        if (p.imageUrls?.[0]) return p.imageUrls[0]
        if (p.image?.image_url) return p.image.image_url
        return null
    }

    return (
        <div style={{ background: '#f5f0e8', minHeight: '100vh', padding: '28px 32px' }}>

            {/* Retour */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#fff', border: '1.5px solid #ede8df',
                    borderRadius: 10, padding: '7px 14px',
                    fontSize: 13, fontWeight: 600, color: '#2d2a22',
                    cursor: 'pointer', marginBottom: 24, transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f48c06'; e.currentTarget.style.color = '#f48c06' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#2d2a22' }}
            >
                <ChevronLeft size={16} /> Retour
            </button>

            {/* Bloc principal */}
            <div style={{
                background: '#fff', borderRadius: 20, border: '1px solid #ede8df',
                display: 'flex', flexWrap: 'wrap', gap: 0,
                marginBottom: 32, overflow: 'hidden',
            }}>
                {/* ── Images ── */}
                <div style={{ flex: '0 0 420px', maxWidth: '100%', padding: 28, borderRight: '1px solid #f5f0e8' }}>
                    <div style={{
                        position: 'relative', width: '100%', height: 340,
                        borderRadius: 14, background: '#f5f0e8',
                        overflow: 'hidden', marginBottom: 14,
                    }}>
                        {hasPromo && (
                            <div style={{
                                position: 'absolute', top: 12, left: 12, zIndex: 2,
                                background: '#f48c06', color: '#fff',
                                borderRadius: 8, padding: '4px 10px',
                                fontSize: 12, fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Percent size={11} /> -{currentProduct.promotionPercentage}%
                            </div>
                        )}

                        {images.length > 0 && !imgError[activeImg] ? (
                            <img
                                src={images[activeImg]?.image_url}
                                alt={currentProduct.name}
                                onError={() => setImgError(e => ({ ...e, [activeImg]: true }))}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d4c9b0' }}>
                                <Package size={56} />
                                <span style={{ fontSize: 12, marginTop: 8, color: '#bbb' }}>Pas d'image</span>
                            </div>
                        )}

                        {images.length > 1 && (
                            <>
                                <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.88)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.88)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronRight size={16} />
                                </button>
                                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                                    {images.map((_, i) => (
                                        <button key={i} onClick={() => setActiveImg(i)}
                                            style={{ width: i === activeImg ? 18 : 7, height: 7, borderRadius: 4, border: 'none', background: i === activeImg ? '#f48c06' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {images.map((img, i) => (
                                <div key={i} onClick={() => setActiveImg(i)} style={{
                                    flexShrink: 0, width: 64, height: 64, borderRadius: 10,
                                    overflow: 'hidden', cursor: 'pointer',
                                    border: `2px solid ${i === activeImg ? '#f48c06' : '#ede8df'}`,
                                    background: '#f5f0e8', transition: 'border-color 0.15s',
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

                {/* ── Infos ── */}
                <div style={{ flex: 1, minWidth: 280, padding: 28 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        {currentProduct.category && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0faf9', color: '#50afa8', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #c0e8e5' }}>
                                <Layers size={10} /> {currentProduct.category.name}
                            </span>
                        )}
                        {currentProduct.brand && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff8ee', color: '#f48c06', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #fde9c0' }}>
                                <Tag size={10} /> {currentProduct.brand}
                            </span>
                        )}
                    </div>

                    <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#2d2a22', lineHeight: 1.2 }}>
                        {currentProduct.name}
                    </h1>

                    {currentProduct.collaborator && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, color: '#969696', fontSize: 13 }}>
                            <User size={13} />
                            Par <strong style={{ color: '#2d2a22', marginLeft: 3 }}>{currentProduct.collaborator.name}</strong>
                        </div>
                    )}

                    {/* Prix */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                        {hasPromo ? (
                            <>
                                <span style={{ fontSize: 32, fontWeight: 900, color: '#f48c06' }}>{promoPrice} DH</span>
                                <span style={{ fontSize: 16, color: '#bbb', textDecoration: 'line-through' }}>{currentProduct.price.toFixed(2)} DH</span>
                            </>
                        ) : (
                            <span style={{ fontSize: 32, fontWeight: 900, color: '#2d2a22' }}>{currentProduct.price?.toFixed(2)} DH</span>
                        )}
                    </div>

                    {/* Stock */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: stockColor }}>{stockLabel}</span>
                    </div>

                    {/* Tailles */}
                    {currentProduct.sizes?.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tailles disponibles</h4>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {currentProduct.sizes.map(size => (
                                    <button key={size} onClick={() => setSelectedSize(size)} style={{
                                        minWidth: 40, height: 40, padding: '0 12px',
                                        borderRadius: 8, border: `1.5px solid ${selectedSize === size ? '#f48c06' : '#ede8df'}`,
                                        background: selectedSize === size ? '#fff8ee' : '#fff',
                                        color: selectedSize === size ? '#f48c06' : '#2d2a22',
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                                    }}>{size}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ height: 1, background: '#f5f0e8', marginBottom: 20 }} />

                    {/* Description */}
                    <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</h4>
                    <p style={{ margin: '0 0 24px', fontSize: 14, color: '#4a4540', lineHeight: 1.75 }}>
                        {currentProduct.description || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Aucune description disponible.</span>}
                    </p>

                    {/* ── Ajouter au panier ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #ede8df', borderRadius: 10, padding: '6px 12px', background: '#f9f7f3' }}>
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#969696', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#2d2a22', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => setQty(q => q + 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#f48c06', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    await addToCart(currentProduct.id, qty)
                                    alert(`${currentProduct.name} ajouté au panier !`)
                                } catch (err) {
                                    alert(err.message)
                                }
                            }}
                            disabled={currentProduct.quantity === 0}
                            style={{
                                flex: 1, height: 46, background: currentProduct.quantity === 0 ? '#e5e5e5' : '#f48c06',
                                color: '#fff', border: 'none', borderRadius: 10,
                                fontSize: 14, fontWeight: 700, cursor: currentProduct.quantity === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (currentProduct.quantity > 0) e.currentTarget.style.background = '#d97d05' }}
                            onMouseLeave={e => { if (currentProduct.quantity > 0) e.currentTarget.style.background = '#f48c06' }}
                        >
                            <ShoppingCart size={18} />
                            {currentProduct.quantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                        </button>
                    </div>

                    {/* Réassurance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '20px 0', borderTop: '1px dashed #ede8df' }}>
                        {[
                            { icon: <ShieldCheck size={20} color="#f48c06" />, label: 'Paiement sécurisé' },
                            { icon: <Ruler size={20} color="#f48c06" />,       label: 'Taille & Coupe' },
                            { icon: <Truck size={20} color="#f48c06" />,       label: 'Livraison offerte' },
                            { icon: <RotateCcw size={20} color="#f48c06" />,   label: 'Retours gratuits' },
                        ].map(({ icon, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {icon}
                                <span style={{ fontSize: 14, color: '#4a4540', fontWeight: 500 }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Produits similaires */}
            {similar.length > 0 && (
                <div>
                    <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#2d2a22' }}>Produits similaires</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                        {similar.map(sp => {
                            const thumb = getProductImage(sp)
                            const spHasPromo = sp.inPromotion && sp.promotionPercentage > 0
                            const spPromoPrice = spHasPromo ? (sp.price * (1 - sp.promotionPercentage / 100)).toFixed(2) : null
                            return (
                                <div key={sp.id}
                                    // ✅ route client, pas admin
                                    onClick={() => navigate('/products/' + sp.id, { state: { product: sp, allProducts } })}
                                    style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #ede8df', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                                >
                                    <div style={{ height: 120, background: '#f5f0e8', position: 'relative', overflow: 'hidden' }}>
                                        {thumb ? <img src={thumb} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={28} color="#d4c9b0" /></div>}
                                        {spHasPromo && (
                                            <div style={{ position: 'absolute', top: 7, left: 7, background: '#f48c06', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                                                -{sp.promotionPercentage}%
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '10px 12px 14px' }}>
                                        <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: '#2d2a22', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{sp.name}</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: spHasPromo ? '#f48c06' : '#2d2a22' }}>
                                                {spHasPromo ? spPromoPrice : sp.price?.toFixed(2)} DH
                                            </span>
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
    )
}

export default ClientProductDetailPage