import React, { useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StarRating } from '../../features/products/ui'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { DepotLocationMap } from '../DepotLocationMap'

// ─── ProductCard ───────────────────────────────────────────────────────────

export const ProductCard = ({ product, allProducts = [] }) => {
    const { addToCart } = useCart()
    const { user } = useAuth()
    const [qty, setQty] = useState(1)
    const [selectedSize, setSelectedSize] = useState(null)
    const navigate = useNavigate()

    const showDepotMap = user?.roles?.some(r =>
        ['ADMIN', 'ROLE_ADMIN', 'LIVREUR', 'ROLE_LIVREUR', 'MARCHAND', 'ROLE_MARCHAND'].includes(r)
    )
    const hasDepotCoords = product.depotLatitude != null && product.depotLongitude != null

    const price    = product.price ?? 0
    const discount = product.inPromotion ? (product.promotionPercentage / 100) : 0
    const stock    = product.quantity ?? product.qty ?? 0
    const catLabel = product.category?.name ?? null
    const collabLabel = product.collaborator?.name ?? null
    const sizes    = product.sizes ?? []

    const getProductImage = () => {
        if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls[0]
        if (product.image?.image_url) return product.image.image_url
        if (typeof product.image === 'string') return product.image
        return "https://placehold.co/600x400/f5f0e8/c4c4c4?text=Pas+d+image"
    }

    const handleCardClick = () => {
        const isAdmin = window.location.pathname.startsWith('/admin');
        const targetPath = isAdmin ? `/admin/products/${product.id}` : `/products/${product.id}`;
        navigate(targetPath, { state: { product, allProducts } })
    }

    return (
        <div
            onClick={handleCardClick}
            style={{
                background: "#fff", borderRadius: 16, border: "1px solid #ede8df",
                overflow: "hidden", display: "flex", flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer",
                height: "100%",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "none" }}
        >
            {/* Image container */}
            <div style={{ position: "relative", height: 160, overflow: "hidden", background: "#f5f0e8" }}>
                <img
                    src={getProductImage()}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {discount > 0 && (
                    <div style={{ position: "absolute", top: 8, left: 8, background: "#e74c3c", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20, zIndex: 2 }}>
                        -{Math.round(discount * 100)}%
                    </div>
                )}

                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, zIndex: 2 }}>
                    {catLabel && (
                        <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#50afa8", fontWeight: 600, border: "1px solid #ede8df", display: "flex", alignItems: "center", gap: 4 }}>
                            {catLabel}
                        </div>
                    )}
                    {collabLabel && (
                        <div style={{ background: "rgba(244,140,6,0.92)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#fff", fontWeight: 600, border: "1px solid rgba(244,140,6,0.25)", display: "flex", alignItems: "center", gap: 4 }}>
                            {collabLabel}
                        </div>
                    )}
                </div>
            </div>

            {/* Infos container avec padding réduit */}
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5, flex: 1, justifyContent: "space-between" }}>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#2d2a22", margin: "0 0 4px 0" }}>{product.name}</p>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                        {collabLabel && (
                            <span style={{ fontSize: 10, color: "#f48c06", fontWeight: 600, background: "rgba(244,140,6,0.08)", padding: "1px 6px", borderRadius: 20, border: "1px solid rgba(244,140,6,0.18)" }}>{collabLabel}</span>
                        )}
                        {catLabel && (
                            <span style={{ fontSize: 10, color: "#50afa8", fontWeight: 600, background: "rgba(80,175,168,0.08)", padding: "1px 6px", borderRadius: 20, border: "1px solid rgba(80,175,168,0.18)" }}>{catLabel}</span>
                        )}
                    </div>

                    {product.description && (
                        <p style={{ fontSize: 11, color: "#6e6a5f", margin: "4px 0", lineHeight: "1.3" }}>
                            {product.description}
                        </p>
                    )}
                </div>

                <div style={{ margin: "2px 0" }}>
                    <StarRating rating={product.rating ?? 0} />
                </div>

                {/* ─── Tailles disponibles ─────────────────────────────── */}
                {sizes.length > 0 && (
                    <div onClick={e => e.stopPropagation()} style={{ margin: "2px 0" }}>
                        <p style={{ fontSize: 10, fontWeight: 600, color: "#969696", margin: "0 0 3px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Tailles
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {sizes.map(size => {
                                const isSelected = selectedSize === size
                                return (
                                    <button
                                        key={size}
                                        onClick={e => {
                                            e.stopPropagation()
                                            setSelectedSize(isSelected ? null : size)
                                        }}
                                        style={{
                                            border: isSelected ? "1.5px solid #f48c06" : "1.5px solid #ede8df",
                                            background: isSelected ? "rgba(244,140,6,0.08)" : "#f5f0e8",
                                            color: isSelected ? "#f48c06" : "#6e6a5f",
                                            borderRadius: 6,
                                            padding: "2px 7px",
                                            fontSize: 10,
                                            fontWeight: isSelected ? 700 : 600,
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            lineHeight: "1.4",
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = "#f48c06"
                                                e.currentTarget.style.color = "#f48c06"
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = "#ede8df"
                                                e.currentTarget.style.color = "#6e6a5f"
                                            }
                                        }}
                                    >
                                        {size}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
                {/* ──────────────────────────────────────────────────────── */}

                {showDepotMap && hasDepotCoords && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 6 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#3a6fa8', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🏭 Dépôt
                        </p>
                        <DepotLocationMap
                            latitude={product.depotLatitude}
                            longitude={product.depotLongitude}
                            address={product.depotAddress}
                            height={72}
                            zoom={14}
                            interactive={false}
                        />
                    </div>
                )}

                {/* Bas de carte : Prix, Stock, Quantité à gauche / Panier à droite */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {/* Prix & Stock */}
                        <div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#2d2a22" }}>
                                {price.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 800 }}>DH</span>
                            </span>
                            {discount > 0 && (
                                <span style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through", marginLeft: 4 }}>
                                    {(price / (1 - discount)).toFixed(2)} DH
                                </span>
                            )}
                            <div style={{ fontSize: 10, color: stock > 0 ? "#50afa8" : "#e74c3c", fontWeight: 600, marginTop: 1 }}>
                                {stock > 0 ? `${stock} en stock` : "Rupture"}
                            </div>
                        </div>

                        {/* Sélecteur de Quantité */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid #ede8df", borderRadius: 8, padding: "2px 6px", background: "#f5f0e8", width: "fit-content" }}>
                            <button onClick={(e) => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)) }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#969696", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>−</button>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#2d2a22", minWidth: 14, textAlign: "center" }}>{qty}</span>
                            <button onClick={(e) => { e.stopPropagation(); setQty(q => q + 1) }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#f48c06", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>+</button>
                        </div>
                    </div>

                    {/* Icône Ajouter au Panier - Tout en bas à droite */}
                    <button
                        onClick={async (e) => {
                            e.stopPropagation()
                            try {
                                await addToCart(product.id, qty)
                                alert(`${product.name} ajouté au panier !`)
                            } catch (err) {
                                alert(err.message)
                            }
                        }}
                        title="Ajouter au panier"
                        style={{ width: 34, height: 34, background: "#f48c06", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s, transform 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#d97d05"; e.currentTarget.style.transform = "scale(1.05)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f48c06"; e.currentTarget.style.transform = "scale(1)" }}
                    >
                        <ShoppingCart size={15} strokeWidth={2.2} />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Bouton "+" carte produit ───────────────────
export const AddProductCard = ({ onClick }) => (
    <div onClick={onClick} style={{
        background: "#fff", borderRadius: 16,
        border: "2px dashed #ede8df",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", minHeight: 280,
        transition: "all 0.2s", gap: 10,
    }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#f48c06"; e.currentTarget.style.background = "#fffaf3" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#ede8df"; e.currentTarget.style.background = "#fff" }}
    >
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(244,140,6,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={20} color="#f48c06" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f48c06" }}>Nouveau produit</span>
    </div>
)