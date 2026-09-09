import { useState, useEffect, useCallback } from 'react'
import axios from '../../api/axiosConfig'
import { useAuth } from '../../context/AuthContext'
import { normalizeProducts } from './productUtils'

export function useProducts() {
    const { user } = useAuth()
    const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')
    const merchantCollabId = user?.collaboratorId

    const [collaborators,   setCollaborators]   = useState([])
    const [categories,      setCategories]      = useState([])
    const [products,        setProducts]        = useState([])

    const [loadingCollabs,  setLoadingCollabs]  = useState(true)
    const [loadingCats,     setLoadingCats]     = useState(true)
    const [loadingProducts, setLoadingProducts] = useState(true)

    const [errorCollabs,    setErrorCollabs]    = useState(null)
    const [errorCats,       setErrorCats]       = useState(null)
    const [errorProducts,   setErrorProducts]   = useState(null)

    const [selCollab,       setSelCollab]       = useState(isMarchand && merchantCollabId ? Number(merchantCollabId) : null)
    const [selCategory,     setSelCategory]     = useState(null)

    const fetchCollaborators = useCallback(() => {
        if (isMarchand) {
            setLoadingCollabs(false)
            return
        }
        setLoadingCollabs(true)
        axios.get("/collaborators")
            .then(({ data }) => setCollaborators(data.data ?? []))
            .catch(() => setErrorCollabs("Impossible de charger les collaborateurs."))
            .finally(() => setLoadingCollabs(false))
    }, [isMarchand])

    const fetchCategories = useCallback(() => {
        setLoadingCats(true)
        const activeCollab = isMarchand ? Number(merchantCollabId) : selCollab
        const url = activeCollab !== null
            ? `/collaborators/${activeCollab}/categories`
            : "/categories"
        axios.get(url)
            .then(({ data }) => setCategories(data.data ?? []))
            .catch(() => setErrorCats("Impossible de charger les catégories."))
            .finally(() => setLoadingCats(false))
    }, [selCollab, isMarchand, merchantCollabId])

    const fetchProducts = useCallback(() => {
        setLoadingProducts(true)
        const activeCollab = isMarchand ? Number(merchantCollabId) : selCollab
        let url
        let params = {}

        if (selCategory !== null) {
            // Catégorie sélectionnée → /categories/{id}/products
            url = `/categories/${selCategory}/products`
            if (activeCollab !== null) params.collaboratorId = activeCollab
        } else if (activeCollab !== null) {
            // Collaborateur seul → utilise son endpoint dédié
            url = `/collaborators/${activeCollab}/products`
        } else {
            // Aucun filtre → tous les produits
            url = `/products`
        }

        axios.get(url, { params })
            .then(({ data }) => setProducts(normalizeProducts(data.data ?? data)))
            .catch(() => setErrorProducts("Impossible de charger les produits."))
            .finally(() => setLoadingProducts(false))
    }, [selCategory, selCollab, isMarchand, merchantCollabId])

    // 1. Chargement initial des collaborateurs
    useEffect(() => {
        fetchCollaborators()
    }, [fetchCollaborators])

    // 2. Quand le collaborateur change, on reset la catégorie ET on fetch les nouvelles catégories
    useEffect(() => {
        fetchCategories()
    }, [selCollab, fetchCategories])

    // 3. Quand la catégorie ou le collaborateur change, on fetch les produits
    useEffect(() => {
        fetchProducts()
    }, [selCategory, selCollab, fetchProducts])

    return {
        collaborators, categories, products,
        loadingCollabs, loadingCats, loadingProducts,
        errorCollabs, errorCats, errorProducts,
        selCollab, setSelCollab,
        selCategory, setSelCategory,
        fetchCollaborators, fetchCategories, fetchProducts,
    }
}