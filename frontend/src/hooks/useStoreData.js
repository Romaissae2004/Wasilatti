import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8080'

// ── Normalise any API shape → plain array ────────────────────────────────────
// Handles: plain array | { data: [...] } | { content: [...] } | { data: { content: [...] } }
const toArray = (raw) => {
  if (Array.isArray(raw))              return raw
  if (Array.isArray(raw?.data))        return raw.data
  if (Array.isArray(raw?.content))     return raw.content
  if (Array.isArray(raw?.data?.content)) return raw.data.content
  return []
}

export const useStoreData = () => {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [collaborators, setCollabs] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const [prodRes, catRes, collabRes] = await Promise.all([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/collaborators`),
        ])

        const [prodRaw, catRaw, collabRaw] = await Promise.all([
          prodRes.ok   ? prodRes.json()   : [],
          catRes.ok    ? catRes.json()    : [],
          collabRes.ok ? collabRes.json() : [],
        ])

        setProducts(toArray(prodRaw))
        setCategories(toArray(catRaw))
        setCollabs(toArray(collabRaw))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return { products, categories, collaborators, loading, error }
}

// ── Cart helper (localStorage-backed) ───────────────────────────────────────
export const useCart = () => {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wasilatti_cart') ?? '[]') }
    catch { return [] }
  })

  const save = (items) => {
    setCart(items)
    localStorage.setItem('wasilatti_cart', JSON.stringify(items))
  }

  const addToCart = (product, qty = 1, size = null) => {
    setCart(prev => {
      const key   = `${product.id}-${size ?? 'default'}`
      const exist = prev.find(i => i.key === key)
      const next  = exist
        ? prev.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { key, product, qty, size }]
      localStorage.setItem('wasilatti_cart', JSON.stringify(next))
      return next
    })
  }

  const removeFromCart = (key) => save(cart.filter(i => i.key !== key))
  const clearCart      = ()    => save([])
  const total          = cart.reduce((s, i) => {
    const price = i.product.inPromotion
      ? i.product.price * (1 - i.product.promotionPercentage / 100)
      : i.product.price
    return s + price * i.qty
  }, 0)

  return { cart, addToCart, removeFromCart, clearCart, total }
}
