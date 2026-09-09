import React, { useState } from 'react'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const TopBar = () => {
  const [search, setSearch] = useState('')
  const { user } = useAuth()

  const isLivreur = user?.roles?.includes('LIVREUR') || user?.roles?.includes('ROLE_LIVREUR');

  return (
    <header style={{
                        background: "rgba(255,253,248,0.85)",
                        backdropFilter: "blur(12px)",
                        borderBottom: "1px solid #ede8df",
                        padding: "12px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                    }}>
                        <div>
                            <h1 style={{ fontSize: 14, fontWeight: 700, color: "#2d2a22", margin: 0 }}>
                              {isLivreur ? 'Espace Livreur' : 'Espace Administrateur'}
                            </h1>
                            <p style={{ fontSize: 11, color: "#969696", margin: 0 }}>
                              {isLivreur ? `Connecté en tant que ${user?.username || 'Livreur'}` : 'Accueil · Vue générale'}
                            </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: "#fff", border: "1px solid #ede8df",
                                borderRadius: 10, padding: "7px 12px", width: 200,
                            }}>
                                <Search size={13} style={{ color: "#969696" }} />
                                <input
                                    style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#2d2a22", width: "100%" }}
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button style={{
                                position: "relative", padding: 8, borderRadius: 10,
                                background: "#fff", border: "1px solid #ede8df",
                                cursor: "pointer", display: "flex", alignItems: "center", color: "#969696",
                            }}>
                                <Bell size={15} />
                                <span style={{
                                    position: "absolute", top: 6, right: 6,
                                    width: 7, height: 7, borderRadius: "50%",
                                    background: "#f48c06", border: "1.5px solid #fff",
                                }} />
                            </button>
                        </div>
                    </header>
  )
}

export default TopBar
