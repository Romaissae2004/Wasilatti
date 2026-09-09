import axios from '../../api/axiosConfig'

/** Extract payload from common API wrappers: { data: T } */
export function unwrapApiPayload(raw) {
    if (raw == null) return raw
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'object' && raw.data != null) {
        if (Array.isArray(raw.data)) return raw.data
        if (typeof raw.data === 'object') return unwrapApiPayload(raw.data)
    }
    return raw
}

/** Normalize product fields from API (handles alternate description keys). */
export function normalizeProduct(raw) {
    const p = unwrapApiPayload(raw)
    if (!p || typeof p !== 'object') return p

    const description =
        p.description ??
        p.productDescription ??
        p.desc ??
        ''

    return description === p.description ? p : { ...p, description }
}

export function normalizeProducts(raw) {
    const list = unwrapApiPayload(raw)
    if (!Array.isArray(list)) return []
    return list.map(normalizeProduct)
}

export async function fetchProductById(id) {
    const { data } = await axios.get(`/products/${id}`)
    return normalizeProduct(data)
}
