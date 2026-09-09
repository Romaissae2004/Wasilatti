import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from '../../api/axiosConfig';
import { ConfirmDeleteModal, AddProductModal } from '../../features/products/modals';
import { fetchProductById, normalizeProduct } from '../../features/products/productUtils';
import { useAuth } from '../../context/AuthContext';
import { 
    ChevronLeft, 
    ChevronRight, 
    Tag, 
    Package, 
    User, 
    Layers, 
    Percent, 
    ShieldCheck, 
    Ruler, 
    Truck, 
    RotateCcw,
    Pencil,
    Trash2
} from 'lucide-react'
import Side from '../../components/layout/Side'
import TopBar from '../../components/layout/TopBar'
import { DepotLocationSection } from '../../components/DepotLocationMap'

const ProductDetailPage = () => {
    const { state } = useLocation()
    const { id } = useParams()
    const navigate  = useNavigate()
    
    const [currentProduct, setCurrentProduct] = useState(state?.product ?? null)
    const allProducts = state?.allProducts ?? []
    const [loading, setLoading] = useState(!state?.product)

    const { user } = useAuth()
    const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')
    const merchantCollabId = user?.collaboratorId

    const [activeImg, setActiveImg] = useState(0)
    const [imgError, setImgError]   = useState({})
    const [selectedSize, setSelectedSize] = useState(null)
    const [cardHovered, setCardHovered]   = useState(false)
    const [showEditModal, setShowEditModal]     = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Synchroniser avec la navigation (changement de produit)
    useEffect(() => {
        if (state?.product && String(state.product.id) === String(id)) {
            setCurrentProduct(state.product)
        }
    }, [id, state?.product])

    // Enrichir avec les données complètes (description) depuis l'API
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
                if (!cancelled && !state?.product) {
                    navigate('/admin/products')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [id, navigate, state?.product])

    useEffect(() => {
        setActiveImg(0)
        setImgError({})
        setSelectedSize(null)
    }, [currentProduct?.id])

    useEffect(() => {
        if (loading || !currentProduct) return
        if (isMarchand && currentProduct.collaborator?.id !== Number(merchantCollabId)) {
            navigate('/admin/products')
        }
    }, [loading, currentProduct, isMarchand, merchantCollabId, navigate])

    useEffect(() => {
        if (!loading && !currentProduct) {
            navigate('/admin/products')
        }
    }, [loading, currentProduct, navigate])

    if (loading && !currentProduct) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#f48c06' }}>
                Chargement...
            </div>
        )
    }

    if (!currentProduct) {
        return null
    }

    // Gestion de la provenance des images (Utilisation de currentProduct au lieu de product)
    const images = currentProduct.images?.length > 0 ? currentProduct.images 
                 : currentProduct.imageUrls?.length > 0 ? currentProduct.imageUrls.map(url => ({ image_url: url })) 
                 : []
                 
    const hasPromo = currentProduct.inPromotion && currentProduct.promotionPercentage > 0
    const promoPrice = hasPromo
        ? (currentProduct.price * (1 - currentProduct.promotionPercentage / 100)).toFixed(2)
        : null

    const stockColor = currentProduct.quantity === 0 ? '#ef4444'
        : currentProduct.quantity < 5 ? '#f59e0b' : '#10b981'
    const stockLabel = currentProduct.quantity === 0 ? 'Rupture de stock'
        : currentProduct.quantity < 5 ? `Plus que ${currentProduct.quantity} en stock`
        : `En stock (${currentProduct.quantity})`

    // Produits similaires basés sur le produit courant
    const similar = allProducts.filter(p =>
        p.id !== currentProduct.id &&
        (p.category?.id === currentProduct.category?.id || p.collaborator?.id === currentProduct.collaborator?.id)
    ).slice(0, 8)

    const getProductImage = (p) => {
        if (p.images?.[0]?.image_url) return p.images[0].image_url
        if (p.imageUrls?.[0]) return p.imageUrls[0]
        if (p.image?.image_url) return p.image.image_url
        return null
    }

    // 2. Fonction de capture de la mise à jour
    const handleEditSuccess = (updatedProduct) => {
        setCurrentProduct(normalizeProduct(updatedProduct))
        setShowEditModal(false)
    }
    const handleDelete = async () => {
        try {
            await axios.delete(`/products/${currentProduct.id}`);
            navigate('/admin/products');
        } catch (err) {
            throw new Error(`Erreur serveur : ${err.response?.status || err.message}`);
        }
    };

    return (
        <div style={{
            display: 'flex', height: '100vh', overflow: 'hidden',
            background: '#f5f0e8',
            backgroundImage: `
                radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
                radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
                radial-gradient(#d4c9b0 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 100% 100%, 24px 24px',
        }}>
            <Side />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <TopBar />

                <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

                    {/* Retour */}
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#fff', border: '1.5px solid #ede8df',
                            borderRadius: 10, padding: '7px 14px',
                            fontSize: 13, fontWeight: 600, color: '#2d2a22',
                            cursor: 'pointer', marginBottom: 24,
                            transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f48c06'; e.currentTarget.style.color = '#f48c06' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#2d2a22' }}
                    >
                        <ChevronLeft size={16} /> Retour
                    </button>

                    {/* Bloc principal */}
                    <div
                        onMouseEnter={() => setCardHovered(true)}
                        onMouseLeave={() => setCardHovered(false)}
                        style={{
                            position: 'relative',
                            background: '#fff', borderRadius: 20,
                            border: '1px solid #ede8df',
                            display: 'flex', gap: 0, flexWrap: 'wrap',
                            marginBottom: 32,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Boutons Modifier / Supprimer */}
                        <div style={{
                            position: 'absolute', top: 14, right: 14, zIndex: 10,
                            display: 'flex', gap: 8,
                            opacity: 1,
                            pointerEvents: 'auto',
                            transition: 'opacity 0.2s',
                        }}>
                            <button
                                onClick={() => setShowEditModal(true)}
                                title="Modifier"
                                style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    border: '1.5px solid #ede8df',
                                    background: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f48c06'; e.currentTarget.style.color = '#f48c06' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#2d2a22' }}
                            >
                                <Pencil size={15} />
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                title="Supprimer"
                                style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    border: '1.5px solid #ede8df',
                                    background: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#2d2a22' }}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                        
                        {/* ── Images ── */}
                        <div style={{ flex: '0 0 420px', maxWidth: '100%', padding: 28, borderRight: '1px solid #f5f0e8' }}>
                            {/* Image principale */}
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
                                                <button key={i} onClick={() => setActiveImg(i)} style={{ width: i === activeImg ? 18 : 7, height: 7, borderRadius: 4, border: 'none', background: i === activeImg ? '#f48c06' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Miniatures */}
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

                            {/* Nom */}
                            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#2d2a22', lineHeight: 1.2 }}>
                                {currentProduct.name}
                            </h1>

                            {/* Collaborateur */}
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

                            {/* ── Section Tailles ── */}
                            {currentProduct.sizes && currentProduct.sizes.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#969696', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tailles disponibles</h4>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {currentProduct.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                style={{
                                                    minWidth: 40, height: 40, padding: '0 12px',
                                                    borderRadius: 8, border: `1.5px solid ${selectedSize === size ? '#f48c06' : '#ede8df'}`,
                                                    background: selectedSize === size ? '#fff8ee' : '#fff',
                                                    color: selectedSize === size ? '#f48c06' : '#2d2a22',
                                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {size}
                                            </button>
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

                            {(currentProduct.depotAddress || currentProduct.depotLatitude != null) && (
                                <div style={{ marginBottom: 24 }}>
                                    <DepotLocationSection
                                        address={currentProduct.depotAddress}
                                        latitude={currentProduct.depotLatitude}
                                        longitude={currentProduct.depotLongitude}
                                        subtitle="(Visible livreur / admin)"
                                        mapHeight={200}
                                    />
                                </div>
                            )}

                            {/* Détails Techniques */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                                {[
                                    { label: 'Quantité', value: `${currentProduct.quantity} unités`, icon: <Package size={13} /> },
                                    { label: 'Promotion', value: hasPromo ? `${currentProduct.promotionPercentage}% de remise` : 'Aucune', icon: <Percent size={13} /> },
                                ].map(({ label, value, icon }) => (
                                    <div key={label} style={{ background: '#f9f7f3', borderRadius: 10, padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#969696', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{icon} {label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2d2a22' }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Section Réassurance ── */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '16px 24px', 
                                padding: '20px 0', 
                                borderTop: '1px dashed #ede8df' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <ShieldCheck size={20} color="#f48c06" strokeWidth={2} />
                                    <span style={{ fontSize: 14, color: '#4a4540', fontWeight: 500 }}>Paiement sécurisé</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Ruler size={20} color="#f48c06" strokeWidth={2} />
                                    <span style={{ fontSize: 14, color: '#4a4540', fontWeight: 500 }}>Taille & Coupe</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Truck size={20} color="#f48c06" strokeWidth={2} />
                                    <span style={{ fontSize: 14, color: '#4a4540', fontWeight: 500 }}>Livraison offerte</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <RotateCcw size={20} color="#f48c06" strokeWidth={2} />
                                    <span style={{ fontSize: 14, color: '#4a4540', fontWeight: 500 }}>Retours gratuits</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── Produits similaires ── */}
                    {similar.length > 0 && (
                        <div>
                            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#2d2a22' }}>Produits similaires</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                                {similar.map(sp => {
                                    const thumb = getProductImage(sp)
                                    const spHasPromo = sp.inPromotion && sp.promotionPercentage > 0
                                    const spPromoPrice = spHasPromo ? (sp.price * (1 - sp.promotionPercentage / 100)).toFixed(2) : null
                                    return (
                                        <div
                                            key={sp.id}
                                            onClick={() => navigate('/admin/products/' + sp.id, { state: { product: sp, allProducts } })}
                                            style={{
                                                background: '#fff', borderRadius: 14,
                                                border: '1.5px solid #ede8df',
                                                overflow: 'hidden', cursor: 'pointer',
                                                transition: 'transform 0.18s, box-shadow 0.18s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)' }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                                        >
                                            <div style={{ height: 120, background: '#f5f0e8', position: 'relative', overflow: 'hidden' }}>
                                                {thumb ? (
                                                    <img src={thumb} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={28} color="#d4c9b0" /></div>
                                                )}
                                                {spHasPromo && (
                                                    <div style={{ position: 'absolute', top: 7, left: 7, background: '#f48c06', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                                                        -{sp.promotionPercentage}%
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '10px 12px 14px' }}>
                                                <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: '#2d2a22', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {sp.name}
                                                </p>
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
            </div>

            {/* Modals */}
            {showEditModal && (
                <AddProductModal
                    product={currentProduct}
                    categories={[]}
                    collaborators={[]}
                    onClose={() => setShowEditModal(false)}
                    // 3. Changement stratégique ici : on passe la fonction handleEditSuccess
                    onSuccess={handleEditSuccess} 
                />
            )}
            {showDeleteModal && (
                <ConfirmDeleteModal
                    itemName={currentProduct.name}
                    itemType="produit"
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}   
                />
            )}
        </div>
    )
}

export default ProductDetailPage