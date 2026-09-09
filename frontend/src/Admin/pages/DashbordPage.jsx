import React, { useState, useEffect, useMemo } from 'react'
import Side from '../../components/layout/Side'
import TopBar from '../../components/layout/TopBar'
import axios from '../../api/axiosConfig'
import { useAuth } from '../../context/AuthContext'
import { fetchAllDrivers, getOrdersForDriver } from '../../services/deliveryService'
import { Loader2, X, Truck, MapPin, Phone, Star, ChevronRight } from 'lucide-react'


export const colors = {
  primary: "#f48c06",
  gray: "#969696",
  background: "#f5f0e8",
  border: "#ede8df",
  success: "#50afa8",
  danger: "#e07070",
}

const DRIVER_STATUS = {
  DISPONIBLE: { label: 'Disponible', color: colors.success },
  EN_LIVRAISON: { label: 'En livraison', color: colors.primary },
  HORS_LIGNE: { label: 'Hors ligne', color: colors.gray },
  SUSPENDU: { label: 'Suspendu', color: colors.danger },
}

const ORDER_STATUS_STYLE = {
  LIVRÉE: { bg: `${colors.success}22`, text: colors.success },
  EN_LIVRAISON: { bg: '#a0c4ff22', text: '#4a7fd4' },
  CONFIRMÉE: { bg: `${colors.primary}22`, text: colors.primary },
  EN_ATTENTE: { bg: `${colors.gray}22`, text: colors.gray },
  ANNULÉE: { bg: `${colors.danger}22`, text: colors.danger },
}

function getDriverDisplayStatus(driver) {
  if (driver.backendStatus === 'SUSPENDU') return 'SUSPENDU'
  if (!driver.online) return 'HORS_LIGNE'
  return driver.backendStatus || 'HORS_LIGNE'
}

const DashbordPage = () => {
  const { user } = useAuth()
  const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')

  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const endpoint = isMarchand ? '/api/merchant/orders' : '/api/admin/orders'
        const [ordersRes, driversList] = await Promise.all([
          axios.get(endpoint),
          fetchAllDrivers(),
        ])
        setOrders(ordersRes.data.data || [])
        setDrivers(driversList)
      } catch (err) {
        console.error('Erreur lors du chargement du tableau de bord:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isMarchand])

  const driverOrders = useMemo(() => {
    if (!selectedDriver) return []
    return getOrdersForDriver(orders, selectedDriver.appUserId)
  }, [orders, selectedDriver])

  const totalOrders = orders.length
  const confirmedOrDelivered = orders.filter(o => o.status === 'LIVRÉE' || o.status === 'CONFIRMÉE' || o.status === 'EN_LIVRAISON')
  const revenue = confirmedOrDelivered.reduce((acc, o) => acc + (o.totalPrice || o.totalAmount || 0), 0)

  const deliveredCount = orders.filter(o => o.status === 'LIVRÉE').length
  const cancelledCount = orders.filter(o => o.status === 'ANNULÉE').length
  const ratePct = totalOrders > 0 ? Math.round((deliveredCount / (totalOrders - cancelledCount || 1)) * 100) : 100

  const statusCounts = {
    LIVREE: orders.filter(o => o.status === 'LIVRÉE').length,
    EN_COURS: orders.filter(o => o.status === 'CONFIRMÉE' || o.status === 'EN_ATTENTE').length,
    EN_LIVRAISON: orders.filter(o => o.status === 'EN_LIVRAISON').length,
    ANNULEE: cancelledCount,
  }

  const stats = [
    { label: "Commandes totales", value: `${totalOrders}`, sub: "Toutes périodes", subColor: colors.primary },
    { label: "Chiffre d'affaires", value: `${revenue.toLocaleString()} MAD`, sub: "Commandes validées", subColor: colors.primary },
    { label: "En cours de livraison", value: `${statusCounts.EN_LIVRAISON}`, sub: "Livreurs sur le terrain", subColor: colors.success },
    { label: "Taux de livraison", value: `${ratePct}%`, sub: totalOrders > 0 ? "Excellent" : "Aucune commande", subColor: colors.success },
  ]

  const weekData = [0, 0, 0, 0, 0, 0, totalOrders]
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const maxVal = Math.max(...weekData, 1)

  const totalForPct = totalOrders || 1
  const statuses = [
    { label: "Livrées", count: statusCounts.LIVREE, pct: `${Math.round((statusCounts.LIVREE / totalForPct) * 100)}%`, color: colors.success },
    { label: "En attente / Confirmées", count: statusCounts.EN_COURS, pct: `${Math.round((statusCounts.EN_COURS / totalForPct) * 100)}%`, color: colors.primary },
    { label: "En livraison", count: statusCounts.EN_LIVRAISON, pct: `${Math.round((statusCounts.EN_LIVRAISON / totalForPct) * 100)}%`, color: "#a0c4ff" },
    { label: "Annulées", count: statusCounts.ANNULEE, pct: `${Math.round((statusCounts.ANNULEE / totalForPct) * 100)}%`, color: colors.danger },
  ]

  const recentOrders = [...orders].reverse().slice(0, 5)

  const activeDrivers = drivers.filter((d) => d.online && d.backendStatus !== 'SUSPENDU')
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1
    return (b.deliveries || 0) - (a.deliveries || 0)
  })

  const card = {
    background: "#fff",
    borderRadius: 14,
    padding: "18px 22px",
    border: `1px solid ${colors.border}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#f5f0e8", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: colors.primary }}>
          <Loader2 size={36} className="animate-spin" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Chargement du tableau de bord...</span>
        </div>
      </div>
    )
  }

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

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          fontFamily: "'Segoe UI', sans-serif",
        }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {stats.map((s, i) => (
              <div key={i} style={card}>
                <p style={{ margin: 0, fontSize: 12, color: colors.gray, marginBottom: 6 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>{s.value}</p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: s.subColor, fontWeight: 500 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ color: "#1a1a1a", fontWeight: 600, fontSize: 15 }}>Commandes — Historique récent</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Sem.", "Mois"].map((t, i) => (
                    <button key={t} style={{
                      padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: i === 0 ? colors.primary : colors.border,
                      color: i === 0 ? "#fff" : colors.gray,
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
                {weekData.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                      <div style={{
                        width: "100%",
                        height: `${(v / maxVal) * 100}%`,
                        background: i === 6 ? colors.primary : `${colors.primary}55`,
                        borderRadius: "6px 6px 0 0",
                        transition: "height 0.3s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: colors.gray }}>{weekDays[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <p style={{ margin: "0 0 16px", color: "#1a1a1a", fontWeight: 600, fontSize: 15 }}>Statuts commandes</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {statuses.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                        <span style={{ color: "#444", fontSize: 13 }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ color: "#1a1a1a", fontWeight: 700, fontSize: 13 }}>{s.count}</span>
                        <span style={{ color: colors.gray, fontSize: 13 }}>{s.pct}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: colors.border, borderRadius: 4 }}>
                      <div style={{ width: s.pct, height: "100%", background: s.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ color: "#1a1a1a", fontWeight: 600, fontSize: 15 }}>Commandes récentes</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: colors.gray, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {["# ID", "Client", "Montant", "Statut", "Adresse"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "20px 0", textAlign: "center", color: colors.gray }}>Aucune commande.</td>
                    </tr>
                  ) : recentOrders.map((o) => {
                    const st = ORDER_STATUS_STYLE[o.status] || ORDER_STATUS_STYLE.EN_ATTENTE
                    return (
                      <tr key={o.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "12px 0", color: colors.primary, fontWeight: 700, fontSize: 13 }}>#{o.id}</td>
                        <td style={{ padding: "12px 0" }}>
                          <span style={{ color: "#1a1a1a", fontSize: 13, display: "block" }}>{o.client?.username || o.clientUsername || "Client"}</span>
                        </td>
                        <td style={{ padding: "12px 0", color: "#1a1a1a", fontWeight: 600, fontSize: 13 }}>{o.totalPrice || o.totalAmount} DH</td>
                        <td style={{ padding: "12px 0" }}>
                          <span style={{
                            background: st.bg,
                            color: st.text,
                            padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                          }}>{o.status}</span>
                        </td>
                        <td style={{ padding: "12px 0", color: colors.gray, fontSize: 13 }}>{o.deliveryAddress}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ ...card, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.success, display: "inline-block", boxShadow: `0 0 6px ${colors.success}` }} />
                  <span style={{ color: "#1a1a1a", fontWeight: 600, fontSize: 15 }}>Livreurs</span>
                </div>
                <span style={{ fontSize: 11, color: colors.gray }}>{activeDrivers.length} en ligne</span>
              </div>

              <p style={{ margin: "0 0 12px", fontSize: 11, color: colors.gray }}>
                Cliquez sur un livreur pour voir ses commandes assignées.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {sortedDrivers.length === 0 ? (
                  <p style={{ fontSize: 12, color: colors.gray, textAlign: "center", padding: "20px 0" }}>Aucun livreur enregistré.</p>
                ) : (
                  sortedDrivers.map((d) => {
                    const statusKey = getDriverDisplayStatus(d)
                    const statusInfo = DRIVER_STATUS[statusKey] || DRIVER_STATUS.HORS_LIGNE
                    const assignedCount = getOrdersForDriver(orders, d.appUserId).length
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDriver(d)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1px solid ${colors.border}`,
                          background: "#fafafa",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.primary
                          e.currentTarget.style.background = '#fff6ea'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.border
                          e.currentTarget.style.background = '#fafafa'
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusInfo.color, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <span style={{ color: "#1a1a1a", fontSize: 12, fontWeight: 700, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {d.name}
                            </span>
                            <span style={{ color: colors.gray, fontSize: 11 }}>
                              {d.zone} · {assignedCount} cmd
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} color={colors.primary} />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDriver && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 24,
        }}>
          <div style={{
            ...card,
            width: "100%",
            maxWidth: 720,
            maxHeight: "85vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: 0,
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Truck size={20} color={colors.primary} />
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
                    {selectedDriver.name}
                  </h2>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: `${(DRIVER_STATUS[getDriverDisplayStatus(selectedDriver)] || DRIVER_STATUS.HORS_LIGNE).color}22`,
                    color: (DRIVER_STATUS[getDriverDisplayStatus(selectedDriver)] || DRIVER_STATUS.HORS_LIGNE).color,
                  }}>
                    {(DRIVER_STATUS[getDriverDisplayStatus(selectedDriver)] || DRIVER_STATUS.HORS_LIGNE).label}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: colors.gray }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={13} /> {selectedDriver.zone}
                  </span>
                  <span>{selectedDriver.vehicle}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={13} fill="#f3b137" color="#f3b137" /> {selectedDriver.rating}
                  </span>
                  <span>{selectedDriver.deliveries} livraisons</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                style={{
                  border: "none", background: "#f5f0e8", borderRadius: 8,
                  padding: 8, cursor: "pointer", display: "flex",
                }}
              >
                <X size={18} color={colors.gray} />
              </button>
            </div>

            <div style={{
              padding: "16px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              borderBottom: `1px solid ${colors.border}`,
              background: "#fafafa",
            }}>
              {[
                { label: 'Total assignées', value: driverOrders.length, color: colors.primary },
                { label: 'En cours', value: driverOrders.filter(o => o.status === 'EN_LIVRAISON').length, color: '#4a7fd4' },
                { label: 'Livrées', value: driverOrders.filter(o => o.status === 'LIVRÉE').length, color: colors.success },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.gray }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                Commandes assignées ({driverOrders.length})
              </h3>

              {driverOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: colors.gray }}>
                  <Truck size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>Aucune commande assignée à ce livreur.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: colors.gray, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {["# ID", "Client", "Adresse", "Téléphone", "Montant", "Statut", "Date"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...driverOrders].reverse().map((o) => {
                      const st = ORDER_STATUS_STYLE[o.status] || ORDER_STATUS_STYLE.EN_ATTENTE
                      return (
                        <tr key={o.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                          <td style={{ padding: "12px 8px 12px 0", color: colors.primary, fontWeight: 700, fontSize: 13 }}>#{o.id}</td>
                          <td style={{ padding: "12px 8px 12px 0", fontSize: 13, color: "#1a1a1a" }}>
                            {o.client?.username || o.clientUsername || "Client"}
                          </td>
                          <td style={{ padding: "12px 8px 12px 0", fontSize: 12, color: colors.gray, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.deliveryAddress}
                          </td>
                          <td style={{ padding: "12px 8px 12px 0", fontSize: 12, color: colors.gray }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Phone size={12} /> {o.contactPhone || '—'}
                            </span>
                          </td>
                          <td style={{ padding: "12px 8px 12px 0", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                            {Number(o.totalPrice || 0).toFixed(2)} DH
                          </td>
                          <td style={{ padding: "12px 8px 12px 0" }}>
                            <span style={{
                              background: st.bg,
                              color: st.text,
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                            }}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 0", fontSize: 11, color: colors.gray }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashbordPage
