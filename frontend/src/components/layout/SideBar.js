import React, { useState, createContext, useContext } from 'react'
import logo from "../../assets/images/logo2.png"
import { ChevronFirst, ChevronLast } from 'lucide-react'
import { colors } from '../../styles/colors'

const SidebarContext = createContext()

const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  ROLE_ADMIN: 'Administrateur',
  MARCHAND: 'Marchand',
  ROLE_MARCHAND: 'Marchand',
  LIVREUR: 'Livreur',
  ROLE_LIVREUR: 'Livreur',
  USER: 'Client',
  ROLE_USER: 'Client',
}

function getUserDisplayName(user) {
  if (!user) return 'Utilisateur'
  return user.fullName || user.name || user.username || 'Utilisateur'
}

function getUserPhoto(user) {
  if (!user) return null
  return user.photo || user.profilePhoto || user.avatar || user.picture || null
}

function getUserRoleLabel(user) {
  if (!user?.roles?.length) return 'Membre'
  const role = user.roles[0]
  return ROLE_LABELS[role] || role.replace(/^ROLE_/, '').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

function getInitials(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function UserAvatar({ user, size = 42 }) {
  const photo = getUserPhoto(user)
  const name = getUserDisplayName(user)

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: `2.5px solid ${colors.primary}`,
          boxShadow: `0 2px 10px rgba(244,140,6,0.25)`,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: `linear-gradient(135deg, ${colors.primary} 0%, #e07b00 100%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 700,
        letterSpacing: '0.02em',
        boxShadow: `0 3px 12px rgba(244,140,6,0.3)`,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

export default function Sidebar({ children, user }) {
  const [expanded, setExpanded] = useState(true)
  const displayName = getUserDisplayName(user)
  const roleLabel = getUserRoleLabel(user)

  return (
    <aside
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        width: expanded ? 272 : 76,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible',
        zIndex: 40,
      }}
    >
      <nav
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRight: `1px solid ${colors.border}`,
          boxShadow: '4px 0 24px rgba(180,140,80,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Brand header */}
        <div
          style={{
            padding: expanded ? '18px 16px 16px' : '16px 10px 14px',
            background: `linear-gradient(145deg, rgba(244,140,6,0.14) 0%, rgba(80,175,168,0.06) 55%, transparent 100%)`,
            borderBottom: `1px solid ${colors.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(244,140,6,0.12) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: expanded ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: expanded ? 'space-between' : 'center',
              gap: expanded ? 10 : 8,
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? 12 : 0,
                overflow: 'hidden',
                flex: expanded ? 1 : 'none',
                minWidth: 0,
                justifyContent: expanded ? 'flex-start' : 'center',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#fff',
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(244,140,6,0.12)',
                }}
              >
                <img
                  src={logo}
                  alt="Wasilatti"
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                />
              </div>
              <div
                style={{
                  overflow: 'hidden',
                  opacity: expanded ? 1 : 0,
                  width: expanded ? 'auto' : 0,
                  transition: 'opacity 0.2s ease, width 0.25s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 800,
                    color: '#2d2a22',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  Wasilatti
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: colors.success,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Livraison intelligente
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(c => !c)}
              aria-label={expanded ? 'Réduire la sidebar' : 'Étendre la sidebar'}
              style={{
                padding: 7,
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                background: colors.background,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(244,140,6,0.12)'
                e.currentTarget.style.borderColor = colors.primary
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = colors.background
                e.currentTarget.style.borderColor = colors.border
              }}
            >
              {expanded ? <ChevronFirst size={16} /> : <ChevronLast size={16} />}
            </button>
          </div>
        </div>

        {/* User profile card */}
        <div
          style={{
            margin: expanded ? '12px 12px 4px' : '12px 8px 4px',
            padding: expanded ? '12px 14px' : '10px 6px',
            borderRadius: 14,
            background: colors.background,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: expanded ? 12 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            transition: 'all 0.25s ease',
          }}
        >
          <UserAvatar user={user} size={expanded ? 44 : 38} />
          <div
            style={{
              overflow: 'hidden',
              flex: 1,
              minWidth: 0,
              opacity: expanded ? 1 : 0,
              width: expanded ? 'auto' : 0,
              transition: 'opacity 0.2s ease, width 0.25s ease',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: '#2d2a22',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </p>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: 5,
                padding: '3px 9px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: 'rgba(80,175,168,0.12)',
                color: colors.success,
                border: `1px solid rgba(80,175,168,0.25)`,
              }}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul
            style={{
              flex: 1,
              padding: '6px 10px 12px',
              overflowY: 'auto',
              overflowX: 'hidden',
              listStyle: 'none',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              scrollbarWidth: 'thin',
              scrollbarColor: `${colors.border} transparent`,
            }}
          >
            {children}
          </ul>
        </SidebarContext.Provider>

        {/* Footer accent */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.success})`,
            opacity: expanded ? 1 : 0.6,
            transition: 'opacity 0.25s ease',
          }}
        />
      </nav>
    </aside>
  )
}

export function SidebarItem({ icon, text, active, alert, onClick }) {
  const { expanded } = useContext(SidebarContext)
  const [hovered, setHovered] = useState(false)

  const bg = active
    ? colors.primary
    : hovered
      ? 'rgba(244,140,6,0.08)'
      : 'transparent'
  const color = active ? '#fff' : hovered ? colors.primary : colors.gray

  return (
    <li
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        padding: expanded ? '9px 12px' : '9px 10px',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        background: bg,
        color,
        boxShadow: active ? '0 4px 14px rgba(244,140,6,0.28)' : 'none',
        listStyle: 'none',
      }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: '55%',
            borderRadius: '0 4px 4px 0',
            background: '#fff',
            opacity: expanded ? 0.9 : 0,
            transition: 'opacity 0.2s',
          }}
        />
      )}
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span
        style={{
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontWeight: 600,
          width: expanded ? 190 : 0,
          marginLeft: expanded ? 11 : 0,
          opacity: expanded ? 1 : 0,
        }}
      >
        {text}
      </span>
      {alert && (
        <div
          style={{
            position: 'absolute',
            right: 10,
            top: expanded ? '50%' : 8,
            transform: expanded ? 'translateY(-50%)' : 'none',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: colors.success,
            boxShadow: `0 0 0 2px ${active ? colors.primary : '#fff'}`,
          }}
        />
      )}
      {!expanded && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(100% + 8px)',
            top: '50%',
            background: '#2d2a22',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '7px 12px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-4px)',
            transition: 'all 0.18s ease',
            zIndex: 9999,
            boxShadow: '0 6px 20px rgba(45,42,34,0.18)',
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              left: -5,
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: 10,
              height: 10,
              background: '#2d2a22',
            }}
          />
        </div>
      )}
    </li>
  )
}

export function SidebarSection({ label }) {
  const { expanded } = useContext(SidebarContext)
  return (
    <li style={{ padding: expanded ? '14px 12px 6px' : '10px 6px 4px', listStyle: 'none' }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: colors.success,
          whiteSpace: 'nowrap',
          opacity: expanded ? 1 : 0,
          transition: 'opacity 0.2s',
          display: 'block',
        }}
      >
        {label}
      </span>
      {!expanded && (
        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            marginTop: 4,
            opacity: 0.7,
          }}
        />
      )}
    </li>
  )
}
