import React, { useState, useEffect } from 'react'
import axios from '../../api/axiosConfig' 
import Side from '../../components/layout/Side'
import {
    TrendingUp, ShoppingCart, Users,
    PackageCheck, ExternalLink, Loader2
} from "lucide-react"
import TopBar from '../../components/layout/TopBar'

// Palette de couleurs pour les avatars (attribuée par index)
const AVATAR_COLORS = [
    "#f48c06", "#969696", "#c47a05", "#7a7a7a",
    "#50afa8", "#b87a04", "#a06803", "#e05555",
]

function getInitials(name = "") {
    return name
        .split(/\s+/)
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

function StatCard({ icon: Icon, label, value, change, positive = true }) {
    return (
        <div style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #ede8df",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            boxShadow: "0 2px 8px rgba(180,140,80,0.07)",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#969696" }}>{label}</span>
                <span style={{ padding: "6px", borderRadius: 8, background: "rgba(244,140,6,0.1)", color: "#f48c06", display: "flex" }}>
                    <Icon size={15} />
                </span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#2d2a22", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: positive ? "#f48c06" : "#e05555", margin: 0 }}>{change}</p>
        </div>
    )
}

function CollabCard({ collab, index }) {
    const [hovered, setHovered] = React.useState(false)
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
    const initials = getInitials(collab.name)

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? "#fffaf3" : "#ffffff",
                borderRadius: 14,
                border: hovered ? "1.5px solid #f48c06" : "1px solid #ede8df",
                padding: "18px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: hovered ? "0 6px 20px rgba(244,140,6,0.12)" : "0 1px 4px rgba(180,140,80,0.06)",
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 13,
                marginBottom: 10,
                boxShadow: `0 3px 10px ${color}44`,
            }}>
                {initials}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2d2a22", margin: "0 0 2px" }}>{collab.name}</p>

            {/* Catégories (liste) */}
            {collab.categories?.length > 0 && (
                <p style={{ fontSize: 11, color: "#969696", margin: "0 0 4px" }}>
                    {collab.categories.map(c => c.name).join(", ")}
                </p>
            )}

            {hovered && (
                <div style={{ marginTop: 8 }}>
                    <ExternalLink size={12} style={{ color: "#f48c06" }} />
                </div>
            )}
        </div>
    )
}

const isThisMonth = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const isLastMonth = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth
}

const HomePage = () => {
    const [collaborators, setCollaborators] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState("")

    // ─── Fetch depuis l'API ───────────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const [collabRes, ordersRes] = await Promise.all([
                    axios.get("/collaborators"),
                    axios.get("/api/admin/orders")
                ])
                setCollaborators(collabRes.data.data ?? [])
                setOrders(ordersRes.data.data ?? [])
            } catch (err) {
                console.error("Erreur lors du chargement des données :", err)
                setError("Impossible de charger les données. Veuillez réessayer.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // ─── Filtrage local ───────────────────────────────────────────────────────
    const filtered = collaborators.filter(c => {
        const categoryNames = c.categories?.map(cat => cat.name).join(" ") ?? ""
        const matchSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            categoryNames.toLowerCase().includes(search.toLowerCase())
        return matchSearch
    })

    // ─── Calculs statistiques ────────────────────────────────────────────────
    const newCollabsCount = collaborators.filter(c => isThisMonth(c.createdAt)).length
    const collabsChange = newCollabsCount > 0 ? `↑ +${newCollabsCount} ce mois` : "Aucun ce mois"

    const totalOrders = orders.length
    const thisMonthOrders = orders.filter(o => isThisMonth(o.createdAt)).length
    const lastMonthOrders = orders.filter(o => isLastMonth(o.createdAt)).length
    
    let ordersChange = ""
    let ordersPositive = true
    if (lastMonthOrders === 0) {
        ordersChange = thisMonthOrders > 0 ? `↑ +${thisMonthOrders} ce mois` : "Aucune commande"
    } else {
        const pct = Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
        if (pct >= 0) {
            ordersChange = `↑ +${pct}% vs mois passé`
            ordersPositive = true
        } else {
            ordersChange = `↓ ${pct}% vs mois passé`
            ordersPositive = false
        }
    }

    const deliveredCount = orders.filter(o => o.status === 'LIVRÉE').length
    const cancelledCount = orders.filter(o => o.status === 'ANNULÉE').length
    const totalNonCancelled = totalOrders - cancelledCount
    const successRate = totalOrders > 0 ? Math.round((deliveredCount / (totalNonCancelled || 1)) * 100) : 100
    const successRateStr = `${successRate}% de succès`

    const confirmedOrDelivered = orders.filter(o => o.status === 'LIVRÉE' || o.status === 'CONFIRMÉE' || o.status === 'EN_LIVRAISON')
    const totalRevenue = confirmedOrDelivered.reduce((acc, o) => acc + (o.totalPrice || o.totalAmount || 0), 0)
    
    const thisMonthRevenue = orders.filter(o => isThisMonth(o.createdAt) && (o.status === 'LIVRÉE' || o.status === 'CONFIRMÉE' || o.status === 'EN_LIVRAISON')).reduce((acc, o) => acc + (o.totalPrice || o.totalAmount || 0), 0)
    const lastMonthRevenue = orders.filter(o => isLastMonth(o.createdAt) && (o.status === 'LIVRÉE' || o.status === 'CONFIRMÉE' || o.status === 'EN_LIVRAISON')).reduce((acc, o) => acc + (o.totalPrice || o.totalAmount || 0), 0)

    let revenueChange = ""
    let revenuePositive = true
    if (lastMonthRevenue === 0) {
        revenueChange = thisMonthRevenue > 0 ? `↑ +${Math.round(thisMonthRevenue).toLocaleString('fr-FR')} MAD ce mois` : "Aucun revenu"
    } else {
        const pct = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        if (pct >= 0) {
            revenueChange = `↑ +${pct}% vs mois passé`
            revenuePositive = true
        } else {
            revenueChange = `↓ ${pct}% vs mois passé`
            revenuePositive = false
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            display: "flex",
            height: "100vh",
            overflow: "hidden",
            background: "#f5f0e8",
            backgroundImage: `
                radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
                radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
                radial-gradient(#d4c9b0 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 100% 100%, 24px 24px",
        }}>
            <Side />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <TopBar />

                <main style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                        <StatCard icon={Users}        label="Collaborateurs" value={loading ? "…" : collaborators.length} change={collabsChange} positive />
                        <StatCard icon={ShoppingCart} label="Commandes"      value={loading ? "…" : totalOrders} change={ordersChange} positive={ordersPositive} />
                        <StatCard icon={PackageCheck} label="Livrées"        value={loading ? "…" : deliveredCount} change={successRateStr} positive />
                        <StatCard icon={TrendingUp}   label="Revenus"        value={loading ? "…" : `${Math.round(totalRevenue).toLocaleString('fr-FR')} MAD`} change={revenueChange} positive={revenuePositive} />
                    </div>

                    {/* Collaborateurs */}
                    <div style={{
                        background: "rgba(255,253,248,0.9)",
                        borderRadius: 16,
                        border: "1px solid #ede8df",
                        padding: 20,
                        boxShadow: "0 2px 12px rgba(180,140,80,0.06)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                            <div>
                                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#2d2a22", margin: 0 }}>Collaborateurs</h2>
                                <p style={{ fontSize: 11, color: "#969696", margin: "2px 0 0" }}>
                                    {loading ? "Chargement…" : `${filtered.length} partenaire(s) trouvé(s)`}
                                </p>
                            </div>

                            {/* Barre de recherche */}
                            <input
                                type="text"
                                placeholder="Rechercher…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    fontSize: 12, padding: "6px 12px", borderRadius: 8,
                                    border: "1px solid #ede8df", outline: "none",
                                    background: "#faf6ef", color: "#2d2a22",
                                    width: 180,
                                }}
                            />
                        </div>

                        {/* États : loading / erreur / vide / liste */}
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "48px 0", color: "#f48c06" }}>
                                <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
                                <p style={{ fontSize: 13, marginTop: 10, color: "#969696" }}>Chargement des collaborateurs…</p>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : error ? (
                            <div style={{ textAlign: "center", padding: "48px 0", color: "#e05555", fontSize: 13 }}>
                                {error}
                            </div>
                        ) : filtered.length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                                {filtered.map((c, i) => <CollabCard key={c.id} collab={c} index={i} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "48px 0", color: "#969696", fontSize: 13 }}>
                                Aucun collaborateur trouvé pour « {search} »
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default HomePage