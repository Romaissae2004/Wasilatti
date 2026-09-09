// ProductsPage.jsx — Redesign Premium SaaS
import React, { useState, useEffect } from 'react'
import {
  Plus, Search, SlidersHorizontal, Eye, X, Check, Flame,
  Layers, Users, Sparkles, Filter, Percent, Info, ChevronDown,
  Package, TrendingUp, Grid3X3, List, ArrowUpDown, Pencil, Trash2
} from 'lucide-react'
import Side from '../../components/layout/Side'
import TopBar from '../../components/layout/TopBar'
import { useProducts } from '../../features/products/useProducts'
import { Spinner, ErrorMsg } from '../../features/products/ui'
import { ProductCard, AddProductCard } from '../../components/cards/ProductCard'
import { AddCollaboratorModal, AddCategoryModal, AddProductModal, ConfirmDeleteModal } from '../../features/products/modals'
import { AVATAR_COLORS, AVATAR_BG, getInitials } from '../../features/products/constants'
import ProductDetailModal from '../../features/products/ProductDetailModal'
import { useAuth } from '../../context/AuthContext'
import axios from '../../api/axiosConfig'

/* ─────────────────────────────────────────
   STRICT COLOR PALETTE — NO OTHER COLORS
───────────────────────────────────────── */
const C = {
  orangeMain:  '#f48c06',
  tealMain:    '#50afa8',
  grayLight:   '#c4c4c4',
  grayMedium:  '#969696',

  // Derived — only tints/shades of the above
  orangeFaint: 'rgba(244,140,6,0.08)',
  orangeMid:   'rgba(244,140,6,0.18)',
  tealFaint:   'rgba(80,175,168,0.08)',
  tealMid:     'rgba(80,175,168,0.18)',
  grayFaint:   'rgba(196,196,196,0.25)',
  grayBorder:  'rgba(150,150,150,0.2)',

  // Neutrals derived purely from gray family
  bg:          '#f9f9f9',        // near-white, no hue
  surface:     '#ffffff',
  surfaceElevated: '#fafafa',
  textDark:    '#1a1a1a',
  textMid:     '#555555',
  textSoft:    '#969696',        // = grayMedium

  // Shadows — gray only
  shadow:      'rgba(0,0,0,0.06)',
  shadowMd:    'rgba(0,0,0,0.10)',
}

/* ─── Utility: hide scrollbar ─── */
const noScroll = { msOverflowStyle: 'none', scrollbarWidth: 'none' }

/* ─── Stat Chip ─── */
const StatChip = ({ label, value, accent }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.grayBorder}`,
    borderRadius: 12,
    padding: '14px 20px',
    minWidth: 110,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: accent === 'orange' ? C.orangeFaint : accent === 'teal' ? C.tealFaint : C.grayFaint,
    }} />
    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textSoft }}>
      {label}
    </p>
    <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: accent === 'orange' ? C.orangeMain : accent === 'teal' ? C.tealMain : C.textDark, lineHeight: 1 }}>
      {value}
    </p>
  </div>
)

/* ─── Toggle Switch ─── */
const Toggle = ({ on, onChange, accent = 'orange' }) => (
  <button
    onClick={onChange}
    style={{
      width: 40, height: 22, borderRadius: 20, flexShrink: 0,
      background: on ? (accent === 'teal' ? C.tealMain : C.orangeMain) : C.grayLight,
      border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
    }}
    aria-checked={on}
    role="switch"
  >
    <span style={{
      width: 16, height: 16, borderRadius: '50%', background: C.surface,
      position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left 0.2s',
      boxShadow: `0 1px 3px ${C.shadowMd}`,
    }} />
  </button>
)

/* ─── Avatar Bubble ─── */
const AvatarBubble = ({ collab, index, active, onClick, onEdit, onDelete }) => {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  const bg    = AVATAR_BG[index % AVATAR_BG.length]
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
        background: active ? color : bg,
        border: `2.5px solid ${active ? color : hovered ? C.grayMedium : C.grayLight}`,
        outline: active ? `3px solid ${color}33` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: active ? C.surface : color,
        transform: active || hovered ? 'scale(1.06)' : 'scale(1)',
        transition: 'all 0.2s',
        boxShadow: active ? `0 4px 14px ${color}40` : 'none',
      }}>
        {collab.image?.image_url
          ? <img src={collab.image.image_url} alt={collab.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getInitials(collab.name)
        }
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, maxWidth: 64, textAlign: 'center', lineHeight: 1.2,
        color: active ? color : C.textSoft,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {collab.name}
      </span>
      {active && onEdit && onDelete && (
         <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
             <Pencil size={12} onClick={(e) => { e.stopPropagation(); onEdit(collab); }} style={{ cursor: 'pointer', color: color, opacity: 0.8 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8} title="Modifier" />
             <Trash2 size={12} onClick={(e) => { e.stopPropagation(); onDelete(collab); }} style={{ cursor: 'pointer', color: color, opacity: 0.8 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8} title="Supprimer" />
         </div>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
const ProductsPage = () => {
  const { user } = useAuth()
  const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')
  const merchantCollabId = user?.collaboratorId

  const {
    collaborators, categories, products,
    loadingCollabs, loadingCats, loadingProducts,
    errorCollabs, errorCats, errorProducts,
    selCollab, setSelCollab,
    selCategory, setSelCategory,
    fetchCollaborators, fetchCategories, fetchProducts,
  } = useProducts()

  // Lock selected collaborator for merchants
  useEffect(() => {
    if (isMarchand && merchantCollabId) {
      setSelCollab(Number(merchantCollabId))
    }
  }, [isMarchand, merchantCollabId, setSelCollab])

  const [showAddCollab,  setShowAddCollab]  = useState(false)
  const [collabToEdit,   setCollabToEdit]   = useState(null)
  const [collabToDelete, setCollabToDelete] = useState(null)
  const [showAddCat,     setShowAddCat]     = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const handleDeleteCollab = async () => {
    try {
        await axios.delete(`/collaborators/${collabToDelete.id}`);
        fetchCollaborators();
    } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression du collaborateur");
    }
  };

  const handleDeleteCategory = async () => {
    try {
        await axios.delete(`/categories/${categoryToDelete.id}`);
        fetchCategories();
    } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression de la catégorie");
    }
  };

  const [localSearch,  setLocalSearch]  = useState('')
  const [showFilters,  setShowFilters]  = useState(false)
  const [maxPrice,     setMaxPrice]     = useState(1000)
  const [onlyPromo,    setOnlyPromo]    = useState(false)
  const [hideNoStock,  setHideNoStock]  = useState(false)
  const [viewMode,     setViewMode]     = useState('grid') // 'grid' | 'list'

  /* ─── Filtering ─── */
  const filteredProducts = products.filter(p => {
    const price = p.price ?? 0
    const stock = p.quantity ?? p.qty ?? 0
    const name  = (p.name        || '').toLowerCase()
    const desc  = (p.description || '').toLowerCase()
    const brand = (p.brand       || '').toLowerCase()
    const q     = localSearch.toLowerCase()

    return (
      (name.includes(q) || desc.includes(q) || brand.includes(q)) &&
      price <= maxPrice &&
      (!onlyPromo   || p.inPromotion) &&
      (!hideNoStock || stock > 0)
    )
  })

  const resetFilters = () => {
    setLocalSearch('')
    setMaxPrice(1000)
    setOnlyPromo(false)
    setHideNoStock(false)
  }

  const activeFilterCount = [
    localSearch !== '',
    maxPrice < 1000,
    onlyPromo,
    hideNoStock,
  ].filter(Boolean).length

  /* ─── Search focus state ─── */
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#f5f0e8',
      backgroundImage: `
        radial-gradient(circle at 70% 10%, rgba(244,140,6,0.07) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(80,175,168,0.06) 0%, transparent 40%),
        radial-gradient(#c4c4c4 1px, transparent 1px)`,
      backgroundSize: '100% 100%, 100% 100%, 24px 24px',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <Side />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', ...noScroll }}>

          {/* ══════════════════════════════════
               HEADER BAND
          ══════════════════════════════════ */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20, marginBottom: 32,
          }}>
            {/* Title block */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 6, height: 22, borderRadius: 3,
                  background: `linear-gradient(180deg, ${C.orangeMain} 0%, ${C.tealMain} 100%)`,
                }} />
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textDark, letterSpacing: '-0.4px' }}>
                  Catalogue Produits
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.textSoft }}>
                Gérez, filtrez et analysez votre catalogue en un seul endroit.
              </p>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatChip label="Collaborateurs" value={loadingCollabs ? '…' : collaborators.length} accent="orange" />
              <StatChip label="Catégories"     value={loadingCats    ? '…' : categories.length}    accent="teal"   />
              <StatChip label="Articles"       value={loadingProducts? '…' : products.length}      accent="gray"   />
            </div>
          </div>

          {/* ══════════════════════════════════
               COLLABORATEURS — STORIES ROW
          ══════════════════════════════════ */}
          {!isMarchand && (
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Users size={14} color={C.grayMedium} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grayMedium }}>
                  Partenaires
                </span>
              </div>

              {loadingCollabs ? <Spinner label="Chargement…" /> :
               errorCollabs   ? <ErrorMsg msg={errorCollabs} /> : (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 4, ...noScroll }}>

                  {/* Add collaborator */}
                  <button
                    onClick={() => setShowAddCollab(true)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: C.surface,
                      border: `2px dashed ${C.orangeMain}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = C.orangeFaint}
                      onMouseLeave={e => e.currentTarget.style.background = C.surface}
                    >
                      <Plus size={18} color={C.orangeMain} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.orangeMain }}>Nouveau</span>
                  </button>

                  {/* All */}
                  <button
                    onClick={() => setSelCollab(null)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: selCollab === null ? C.orangeMain : C.grayFaint,
                      border: `2px solid ${selCollab === null ? C.orangeMain : C.grayLight}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      color: selCollab === null ? C.surface : C.grayMedium,
                      boxShadow: selCollab === null ? `0 4px 14px ${C.orangeMain}40` : 'none',
                      transition: 'all 0.2s',
                    }}>
                      Tous
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: selCollab === null ? C.orangeMain : C.textSoft }}>Tous</span>
                  </button>

                  {collaborators.map((c, i) => (
                    <AvatarBubble
                      key={c.id}
                      collab={c}
                      index={i}
                      active={selCollab === c.id}
                      onClick={() => setSelCollab(selCollab === c.id ? null : c.id)}
                      onEdit={setCollabToEdit}
                      onDelete={setCollabToDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ══════════════════════════════════
               SEARCH + TOOLBAR
          ══════════════════════════════════ */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.grayBorder}`,
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 20,
            boxShadow: `0 2px 12px ${C.shadow}`,
          }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search size={15} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: searchFocused ? C.orangeMain : C.grayMedium, transition: 'color 0.2s',
                  pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  placeholder="Rechercher nom, marque, description…"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    fontSize: 13, padding: '10px 36px 10px 38px',
                    borderRadius: 10,
                    border: `1.5px solid ${searchFocused ? C.orangeMain : C.grayLight}`,
                    outline: 'none',
                    background: searchFocused ? C.orangeFaint : C.surfaceElevated,
                    color: C.textDark,
                    transition: 'all 0.2s',
                  }}
                />
                {localSearch && (
                  <button onClick={() => setLocalSearch('')} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: C.grayMedium,
                    display: 'flex', alignItems: 'center',
                  }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 32, background: C.grayLight }} />

              {/* View toggle */}
              <div style={{ display: 'flex', background: C.grayFaint, borderRadius: 8, padding: 3, gap: 2 }}>
                {[
                  { mode: 'grid', Icon: Grid3X3 },
                  { mode: 'list', Icon: List },
                ].map(({ mode, Icon }) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: viewMode === mode ? C.surface : 'transparent',
                    color: viewMode === mode ? C.tealMain : C.grayMedium,
                    boxShadow: viewMode === mode ? `0 1px 4px ${C.shadow}` : 'none',
                    transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${showFilters ? C.tealMain : C.grayLight}`,
                  background: showFilters ? C.tealFaint : C.surface,
                  color: showFilters ? C.tealMain : C.textMid,
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.2s',
                }}
              >
                <SlidersHorizontal size={13} />
                Filtres
                {activeFilterCount > 0 && (
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 800,
                    background: C.tealMain, color: C.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>

              {/* Add product */}
              <button
                onClick={() => setShowAddProduct(true)}
                style={{
                  padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                  border: 'none',
                  background: C.orangeMain,
                  color: C.surface,
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 7,
                  boxShadow: `0 4px 14px ${C.orangeMid}`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.07)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)';    e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Plus size={14} />
                Ajouter un produit
              </button>
            </div>

            {/* Filters drawer */}
            {showFilters && (
              <div style={{
                marginTop: 16, paddingTop: 16,
                borderTop: `1px solid ${C.grayBorder}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 20,
                animation: 'drawerIn 0.22s ease-out',
              }}>
                {/* Price slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textSoft }}>Prix maximum</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.orangeMain }}>{maxPrice} DH</span>
                  </div>
                  <input
                    type="range" min="0" max="1000" step="10" value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: C.orangeMain, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.grayMedium, marginTop: 3 }}>
                    <span>0 DH</span><span>1 000 DH</span>
                  </div>
                </div>

                {/* Promo toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Toggle on={onlyPromo} onChange={() => setOnlyPromo(!onlyPromo)} accent="orange" />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textDark }}>En promotion</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSoft }}>Afficher uniquement les offres actives</p>
                  </div>
                </div>

                {/* Stock toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Toggle on={hideNoStock} onChange={() => setHideNoStock(!hideNoStock)} accent="teal" />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textDark }}>En stock</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSoft }}>Masquer les articles en rupture</p>
                  </div>
                </div>

                {/* Reset */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  <button
                    onClick={resetFilters}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: `1.5px solid ${C.grayLight}`,
                      background: 'none', color: C.grayMedium,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.grayMedium; e.currentTarget.style.color = C.textDark }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.grayLight;  e.currentTarget.style.color = C.grayMedium }}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════
               CATÉGORIES — PILL TABS
          ══════════════════════════════════ */}
          <section style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Layers size={14} color={C.grayMedium} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grayMedium }}>
                Catégories
              </span>
            </div>

            {loadingCats ? <Spinner label="Chargement…" /> :
             errorCats   ? <ErrorMsg msg={errorCats} /> : (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, ...noScroll }}>

                {/* Create */}
                <button
                  onClick={() => setShowAddCat(true)}
                  style={{
                    padding: '7px 16px', borderRadius: 50, flexShrink: 0,
                    border: `1.5px dashed ${C.grayLight}`,
                    background: C.surface, color: C.grayMedium,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.orangeMain; e.currentTarget.style.color = C.orangeMain }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.grayLight;  e.currentTarget.style.color = C.grayMedium }}
                >
                  <Plus size={12} /> Créer
                </button>

                {/* All */}
                {[null, ...categories].map((cat) => {
                  const active = selCategory === (cat?.id ?? null)
                  const label  = cat ? cat.name : 'Toutes'
                  const id     = cat ? cat.id   : null
                  return (
                    <button
                      key={id ?? 'all'}
                      onClick={() => setSelCategory(active ? null : id)}
                      style={{
                        padding: '7px 18px', borderRadius: 50, flexShrink: 0,
                        border: `1.5px solid ${active ? C.tealMain : C.grayLight}`,
                        background: active ? C.tealMain : C.surface,
                        color: active ? C.surface : C.textMid,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        boxShadow: active ? `0 3px 10px ${C.tealMid}` : 'none',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = C.tealMain; e.currentTarget.style.color = C.tealMain } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.grayLight; e.currentTarget.style.color = C.textMid } }}
                    >
                      <span>{label}</span>
                      {active && cat && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 2, paddingLeft: 8, borderLeft: `1px solid rgba(255,255,255,0.4)` }}>
                          <Pencil size={12} onClick={(e) => { e.stopPropagation(); setCategoryToEdit(cat); }} style={{ cursor: 'pointer', opacity: 0.8 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8} title="Modifier" />
                          <Trash2 size={12} onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }} style={{ cursor: 'pointer', opacity: 0.8 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8} title="Supprimer" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* ══════════════════════════════════
               PRODUCT GRID / LIST
          ══════════════════════════════════ */}
          <section>
            {/* Toolbar row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: C.textSoft, fontWeight: 600 }}>
                {!loadingProducts && (
                  <>{filteredProducts.length} article{filteredProducts.length !== 1 ? 's' : ''}</>
                )}
              </span>
            </div>

            {loadingProducts ? <Spinner label="Chargement des produits…" /> :
             errorProducts   ? <ErrorMsg msg={errorProducts} /> : (
              <div style={
                viewMode === 'grid'
                  ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }
                  : { display: 'flex', flexDirection: 'column', gap: 10 }
              }>
                <AddProductCard onClick={() => setShowAddProduct(true)} />

                {filteredProducts.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    background: C.surface,
                    border: `1.5px dashed ${C.grayLight}`,
                    borderRadius: 16,
                    padding: '56px 24px',
                    textAlign: 'center',
                  }}>
                    <Package size={36} color={C.grayLight} style={{ marginBottom: 14 }} />
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: C.textDark }}>
                      Aucun produit ne correspond
                    </p>
                    <p style={{ margin: '0 0 18px', fontSize: 12, color: C.textSoft }}>
                      Essayez d'élargir vos filtres ou effacez la recherche.
                    </p>
                    <button
                      onClick={resetFilters}
                      style={{
                        padding: '9px 20px', borderRadius: 10, border: 'none',
                        background: C.orangeMain, color: C.surface,
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        boxShadow: `0 4px 12px ${C.orangeMid}`,
                      }}
                    >
                      Effacer les filtres
                    </button>
                  </div>
                ) : (
                  filteredProducts.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      allProducts={products}
                      onClick={() => setSelectedProduct(p)}
                    />
                  ))
                )}
              </div>
            )}
          </section>

        </main>
      </div>

      {/* ── Modals ── */}
      {showAddCollab  && <AddCollaboratorModal onClose={() => setShowAddCollab(false)}  onSuccess={fetchCollaborators} />}
      {collabToEdit   && <AddCollaboratorModal collab={collabToEdit} onClose={() => setCollabToEdit(null)} onSuccess={fetchCollaborators} />}
      {collabToDelete && (
        <ConfirmDeleteModal
            itemName={collabToDelete.name}
            itemType="collaborateur"
            onClose={() => setCollabToDelete(null)}
            onConfirm={handleDeleteCollab}
        />
      )}
      {showAddCat     && <AddCategoryModal collaborators={collaborators} onClose={() => setShowAddCat(false)} onSuccess={fetchCategories} />}
      {categoryToEdit && <AddCategoryModal category={categoryToEdit} collaborators={collaborators} onClose={() => setCategoryToEdit(null)} onSuccess={fetchCategories} />}
      {categoryToDelete && (
        <ConfirmDeleteModal
            itemName={categoryToDelete.name}
            itemType="catégorie"
            onClose={() => setCategoryToDelete(null)}
            onConfirm={handleDeleteCategory}
        />
      )}
      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onSuccess={fetchProducts} collaborators={collaborators} categories={categories} />}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          allProducts={products}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <style>{`
        @keyframes drawerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: #c4c4c4; }
        input[type="range"]::-webkit-slider-thumb { margin-top: -4px; }
      `}</style>
    </div>
  )
}

export default ProductsPage
