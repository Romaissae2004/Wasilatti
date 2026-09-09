import React, { useState, useRef, useEffect } from 'react' // Ajout de useEffect ici
import { useAuth } from '../../context/AuthContext'
import { Plus } from 'lucide-react'
import axios from '../../api/axiosConfig'
import { fetchProductById, normalizeProduct } from './productUtils'
import { Modal } from './ui' // Import unique de Modal
import LocationPicker from '../../components/LocationPicker'
import {
    AVATAR_COLORS,
    AVATAR_BG,
    getInitials,
    inputStyle,
    labelStyle,
    btnPrimary,
    btnSecondary
} from './constants' // Vos styles sont déjà importés ici, inutile de les recréer !

// On garde uniquement btnDanger qui n'était pas dans vos imports constants
const btnDanger = {
    padding: "10px 16px", borderRadius: 8, border: "none",
    background: "#e74c3c", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600
};

// ─── Modal Collaborateur ──────────────────────────────────────────────────────
// Helper functions for account auto-generation
const suggestUsername = (val) => {
    return val
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, "") // remove special chars
}

const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const specs = "@#$%^&+=!*-_";
    let pass = "";
    pass += caps[Math.floor(Math.random() * caps.length)];
    pass += chars[Math.floor(Math.random() * chars.length)];
    pass += nums[Math.floor(Math.random() * nums.length)];
    pass += specs[Math.floor(Math.random() * specs.length)];
    const all = chars + caps + nums + specs;
    for (let i = 0; i < 8; i++) {
        pass += all[Math.floor(Math.random() * all.length)];
    }
    return pass.split('').sort(() => 0.5 - Math.random()).join('');
}

// ─── Modal Collaborateur ──────────────────────────────────────────────────────
export const AddCollaboratorModal = ({ collab, onClose, onSuccess }) => {
    const isEditMode = !!collab;
    const [name, setName] = useState(collab?.name || "")
    // L'entité backend Collaborator n'expose pas directement user.email dans le JSON par défaut si on n'a pas DTO
    // On va juste autoriser la modif
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(collab?.image?.image_url || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!isEditMode) {
            setPassword(generatePassword());
        }
    }, [isEditMode]);

    const handleNameChange = (val) => {
        setName(val);
        setUsername(suggestUsername(val));
    };

    const handleFile = (e) => {
        const f = e.target.files[0]
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
    }

    const handleSubmit = async () => {
        if (!name.trim()) return setError("Le nom est requis.")
        if (!isEditMode && !email.trim()) return setError("L'email est requis.")
        if (!isEditMode && !username.trim()) return setError("L'identifiant est requis.")
        if (!isEditMode && !password.trim()) return setError("Le mot de passe est requis.")

        setLoading(true); setError(null)
        try {
            let collabId;
            if (isEditMode) {
                const payload = { name: name.trim() };
                if (email.trim()) payload.email = email.trim();
                if (password.trim()) payload.password = password.trim();
                
                await axios.put(`/collaborators/${collab.id}`, payload);
                collabId = collab.id;
            } else {
                const { data } = await axios.post("/collaborators", {
                    name: name.trim(),
                    username: username.trim(),
                    email: email.trim(),
                    password: password.trim()
                })
                collabId = data.data?.id || data.id;
            }

            if (file && collabId) {
                const formData = new FormData()
                formData.append("file", file)
                await axios.post(`/collaborators/${collabId}/image`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            }

            onSuccess()
            onClose()
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.message || data?.erreur || data;
            setError(typeof msg === "string" ? msg : "Erreur. Réessayez.")
        } finally {
            setLoading(false)
        }
    }

    const previewColor = AVATAR_COLORS[0]
    const previewBg = AVATAR_BG[0]

    return (
        <Modal title={isEditMode ? "Modifier collaborateur" : "Nouveau collaborateur"} onClose={onClose}>
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 6 }}>
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 6, marginBottom: 22,
                }}>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: 72, height: 72, borderRadius: "50%",
                            background: name.trim() ? previewColor : previewBg,
                            border: `2.5px solid ${name.trim() ? previewColor : "#ede8df"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, fontWeight: 700,
                            color: name.trim() ? "#fff" : "#d4c9b0",
                            transition: "all 0.25s",
                            boxShadow: name.trim() ? `0 4px 16px ${previewColor}55` : "none",
                            cursor: "pointer", overflow: "hidden", position: "relative",
                        }}
                        title="Cliquer pour ajouter une photo"
                    >
                        {preview
                            ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : name.trim() ? getInitials(name) : <Plus size={20} />
                        }
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity 0.2s",
                            borderRadius: "50%",
                        }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                        </div>
                    </div>

                    <span style={{ fontSize: 11, color: "#969696", fontWeight: 600 }}>
                        {preview ? "Cliquer pour changer" : "Cliquer pour ajouter une photo"}
                    </span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFile}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={labelStyle}>Nom du Collaborateur *</span>
                        <input
                            style={inputStyle}
                            placeholder="ex: McDonald's"
                            value={name}
                            onChange={e => handleNameChange(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={labelStyle}>Adresse Email {isEditMode ? "(Optionnel)" : "*"}</span>
                        <input
                            style={inputStyle}
                            type="email"
                            placeholder="ex: contact@mcdonalds.ma"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    {!isEditMode && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={labelStyle}>Identifiant de connexion *</span>
                            <input
                                style={inputStyle}
                                placeholder="ex: mcdonalds"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={labelStyle}>{isEditMode ? "Nouveau mot de passe (Optionnel)" : "Mot de passe temporaire *"}</span>
                        <input
                            style={inputStyle}
                            placeholder="Mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        {!isEditMode && (
                            <span style={{ fontSize: 10, color: "#969696" }}>
                                Généré automatiquement. Veuillez le noter pour le transmettre au collaborateur.
                            </span>
                        )}
                    </div>

                    {error && <p style={{ color: "#e74c3c", fontSize: 12, margin: 0 }}>{error}</p>}
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button style={btnSecondary} onClick={onClose}>Annuler</button>
                        <button
                            style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Chargement…" : isEditMode ? "Enregistrer" : "Créer"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

// ─── Modal Catégorie ──────────────────────────────────────────────────────────
export const AddCategoryModal = ({ category, collaborators = [], onClose, onSuccess }) => {
    const { user } = useAuth()
    const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')
    const merchantCollabId = user?.collaboratorId

    const isEditMode = !!category;
    const [name, setName] = useState(category?.name || "")
    const [collaboratorId, setCollaboratorId] = useState(
        category?.collaborator?.id ? String(category.collaborator.id) : (isMarchand ? String(merchantCollabId) : "")
    )
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async () => {
        if (!name.trim()) return setError("Le nom est requis.")
        if (!collaboratorId) return setError("Le collaborateur est requis.")

        setLoading(true); setError(null)
        try {
            if (isEditMode) {
                await axios.put(`/categories/${category.id}`, {
                    name: name.trim(),
                    collaboratorId: parseInt(collaboratorId)
                });
            } else {
                await axios.post("/categories", {
                    name: name.trim(),
                    collaboratorId: parseInt(collaboratorId)
                })
            }

            onSuccess()
            onClose()
        } catch (err) {
            console.error("Détail de l'erreur API :", err.response?.data || err.message)
            const backendMessage = err.response?.data?.message || err.response?.data
            setError(typeof backendMessage === "string" ? backendMessage : `Erreur lors de la ${isEditMode ? 'modification' : 'création'}. Réessayez.`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal title={isEditMode ? "Modifier la catégorie" : "Nouvelle catégorie"} onClose={onClose}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <div style={{
                    padding: "8px 28px", borderRadius: 50,
                    border: `1.5px solid ${name.trim() ? "#f48c06" : "#ede8df"}`,
                    background: name.trim() ? "#f48c06" : "#fff",
                    color: name.trim() ? "#fff" : "#d4c9b0",
                    fontSize: 13, fontWeight: 600,
                    transition: "all 0.25s",
                    boxShadow: name.trim() ? "0 2px 10px rgba(244,140,6,0.25)" : "none",
                    display: "flex", alignItems: "center", gap: 6,
                }}>
                    {name.trim() ? name : <><Plus size={13} /> Catégorie</>}
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={labelStyle}>Nom *</span>
                    <input
                        style={inputStyle}
                        placeholder="ex: Burger, Pizza, Dessert…"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        autoFocus
                    />
                </div>

                {!isMarchand && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={labelStyle}>Collaborateur *</span>
                        <select
                            style={inputStyle}
                            value={collaboratorId}
                            onChange={e => setCollaboratorId(e.target.value)}
                        >
                            <option value="">— Sélectionner —</option>
                            {collaborators && collaborators.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {error && <p style={{ color: "#e74c3c", fontSize: 12, margin: 0 }}>{error}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button style={btnSecondary} onClick={onClose}>Annuler</button>
                    <button
                        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (isEditMode ? "Enregistrement…" : "Création…") : (isEditMode ? "Enregistrer" : "Créer")}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export const AddProductModal = ({ categories = [], collaborators = [], product, onClose, onSuccess }) => {
    const { user } = useAuth()
    const isMarchand = user?.roles?.includes('MARCHAND') || user?.roles?.includes('ROLE_MARCHAND')
    const merchantCollabId = user?.collaboratorId
    const isEditMode = !!product;

    const [form, setForm] = useState({
        name: "",
        brand: "",
        description: "",
        price: "",
        quantity: "",
        collaboratorId: isMarchand ? String(merchantCollabId) : "",
        categoryId: "",
        inPromotion: false,
        promotionPercentage: "",
        sizes: [],
        depotAddress: "",
        depotLatitude: null,
        depotLongitude: null,
    });

    const [selectedImages, setSelectedImages] = useState([]);       // nouvelles images (File[])
    const [existingImages, setExistingImages] = useState([]);       // images déjà en DB
    const [deletedImageIds, setDeletedImageIds] = useState([]);     // IDs à supprimer
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const availableSizes = ["S", "M", "L", "XL", "XXL"];

    // ── Chargement du formulaire + images existantes en mode édition ──
    useEffect(() => {
        if (!isEditMode || !product?.id) return

        let cancelled = false

        const populateForm = (source) => {
            setForm({
                name: source.name || "",
                brand: source.brand || "",
                description: source.description || "",
                price: source.price ? source.price.toString() : "",
                quantity: source.quantity ? source.quantity.toString() : "",
                collaboratorId: source.collaborator?.id ? String(source.collaborator.id) : (isMarchand ? String(merchantCollabId) : ""),
                categoryId: source.category?.id || "",
                inPromotion: source.inPromotion || false,
                promotionPercentage: source.promotionPercentage ? source.promotionPercentage.toString() : "",
                sizes: source.sizes || [],
                depotAddress: source.depotAddress || "",
                depotLatitude: source.depotLatitude || null,
                depotLongitude: source.depotLongitude || null,
            })
        }

        fetchProductById(product.id)
            .then(fullProduct => {
                if (cancelled) return
                populateForm(fullProduct)
            })
            .catch(() => {
                if (!cancelled) populateForm(normalizeProduct(product))
            })

        axios.get(`/products/${product.id}/images`)
            .then(({ data }) => {
                if (!cancelled) setExistingImages(data.data || data || [])
            })
            .catch(() => {
                if (!cancelled) setExistingImages([])
            })

        return () => { cancelled = true }
    }, [product?.id, isEditMode, isMarchand, merchantCollabId]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleSize = (size) => {
        setForm(f => {
            const isSelected = f.sizes.includes(size);
            return {
                ...f,
                sizes: isSelected ? f.sizes.filter(s => s !== size) : [...f.sizes, size]
            };
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            setSelectedImages(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeNewImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Marquer une image existante pour suppression (soft - juste côté UI pour l'instant)
    const markExistingImageForDeletion = (imageId) => {
        setDeletedImageIds(prev => [...prev, imageId]);
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.price) return setError("Nom et prix sont requis.");
        setLoading(true);
        setError(null);

        const productData = {
            name: form.name.trim(),
            description: form.description.trim(),
            brand: form.brand.trim() || null,
            price: parseFloat(form.price),
            quantity: parseInt(form.quantity || "0"),
            inPromotion: form.inPromotion,
            promotionPercentage: form.inPromotion ? parseFloat(form.promotionPercentage) : 0,
            collaboratorId: isMarchand ? Number(merchantCollabId) : (form.collaboratorId ? parseInt(form.collaboratorId) : null),
            categoryId: form.categoryId ? parseInt(form.categoryId) : null,
            sizes: form.sizes,
            depotAddress: form.depotAddress?.trim() || null,
            depotLatitude: form.depotLatitude || null,
            depotLongitude: form.depotLongitude || null,
        };

        try {
            let savedProduct;

            if (isEditMode) {
                // ── 1. PUT une seule fois ──
                const { data } = await axios.put(`/products/${product.id}`, productData);
                savedProduct = normalizeProduct(data.data || data);

                // ── 2. Supprimer les images marquées ──
                await Promise.all(
                    deletedImageIds.map(imageId =>
                        axios.delete(`/products/${product.id}/images/${imageId}`)
                    )
                );

                // ── 3. Uploader les nouvelles images ──
                if (selectedImages.length > 0) {
                    const imgFormData = new FormData();
                    selectedImages.forEach(file => imgFormData.append("files", file));
                    await axios.post(`/products/${product.id}/images`, imgFormData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }

                onSuccess(savedProduct); // passe le produit mis à jour sans refresh
            } else {
                // ── Création ──
                const { data } = await axios.post("/products", productData);
                const productId = data.data?.id || data.id;

                if (selectedImages.length > 0 && productId) {
                    const imgFormData = new FormData();
                    selectedImages.forEach(file => imgFormData.append("files", file));
                    await axios.post(`/products/${productId}/images`, imgFormData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }

                onSuccess(); // le parent recharge la liste
            }

            onClose();
        } catch (err) {
            console.error("Erreur backend :", err.response?.data || err.message);
            setError(`Erreur lors de la ${isEditMode ? 'modification' : 'création'}.`);
        } finally {
            setLoading(false);
        }
    };

    const originalPrice = parseFloat(form.price) || 0;
    const promoPercent = parseFloat(form.promotionPercentage) || 0;
    const previewPrice = form.inPromotion && promoPercent > 0
        ? originalPrice * (1 - promoPercent / 100)
        : originalPrice;

    return (
        <Modal title={isEditMode ? "Modifier le produit" : "Nouveau produit"} onClose={onClose} width={480}>
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: 12 }}>

                {/* ── Preview sticky ── */}
                <div style={{ background: "#f5f0e8", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, border: "1px solid #ede8df", position: "sticky", top: 0, zIndex: 10 }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#2d2a22" }}>{form.name.trim() || "Nom du produit"}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 0" }}>
                            <p style={{ margin: 0, fontSize: 13, color: "#f48c06", fontWeight: 700 }}>{previewPrice > 0 ? `${previewPrice.toFixed(2)} DH` : "Prix"}</p>
                            {form.inPromotion && promoPercent > 0 && originalPrice > 0 && (
                                <p style={{ margin: 0, fontSize: 11, color: "#a09a8f", textDecoration: "line-through" }}>{originalPrice.toFixed(2)} DH</p>
                            )}
                        </div>
                    </div>
                    {form.quantity && (
                        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: parseInt(form.quantity) > 20 ? "#50afa8" : "#e74c3c" }}>{form.quantity} en stock</span>
                    )}
                </div>

                {/* ── Champs texte ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={labelStyle}>Nom *</span>
                    <input style={inputStyle} placeholder="ex: Smoothie Framboise" value={form.name} onChange={e => set("name", e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={labelStyle}>Description</span>
                    <textarea style={{ ...inputStyle, height: "auto", minHeight: "80px", fontFamily: "inherit", resize: "vertical", paddingTop: "10px", paddingBottom: "10px" }} placeholder="Description..." value={form.description} onChange={e => set("description", e.target.value)} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={labelStyle}>Prix (DH) *</span>
                        <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={labelStyle}>Quantité</span>
                        <input style={inputStyle} type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
                    </div>
                </div>

                {/* ── Tailles ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={labelStyle}>Tailles disponibles</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {availableSizes.map((size) => {
                            const isSelected = form.sizes.includes(size);
                            return (
                                <button key={size} type="button" onClick={() => toggleSize(size)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: isSelected ? "2px solid #2d2a22" : "1px solid #ede8df", background: isSelected ? "#2d2a22" : "#fff", color: isSelected ? "#fff" : "#2d2a22", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease-in-out" }}>
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Promotion ── */}
                <div style={{ background: "#faf8f5", padding: "10px 12px", borderRadius: 8, border: "1px dashed #dcd6cd", display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", ...labelStyle }}>
                        <input type="checkbox" checked={form.inPromotion} onChange={e => set("inPromotion", e.target.checked)} /> Mettre ce produit en promotion
                    </label>
                    {form.inPromotion && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            <span style={labelStyle}>Pourcentage de réduction (%)</span>
                            <input style={inputStyle} type="number" min="1" max="100" value={form.promotionPercentage} onChange={e => set("promotionPercentage", e.target.value)} />
                        </div>
                    )}
                </div>

                {/* ── Images ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={labelStyle}>{isEditMode ? "Images du produit" : "Images du produit"}</span>

                    {/* Images existantes (mode édition) */}
                    {isEditMode && existingImages.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            {existingImages.map((img) => (
                                <div key={img.id} style={{ position: "relative", width: 60, height: 60 }}>
                                    <img
                                        src={img.image_url}
                                        alt="existing"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "2px solid #50afa8" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => markExistingImageForDeletion(img.id)}
                                        style={{ position: "absolute", top: -4, right: -4, background: "#e74c3c", color: "white", border: "none", borderRadius: "50%", width: 16, height: 16, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload nouvelles images */}
                    <label style={{ border: "2px dashed #ede8df", padding: "16px", borderRadius: 8, textAlign: "center", cursor: "pointer", background: "#fff", color: "#a09a8f", fontSize: 13 }}>
                        Cliquez pour ajouter des images
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                    </label>

                    {/* Préview nouvelles images */}
                    {selectedImages.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                            {selectedImages.map((file, index) => (
                                <div key={index} style={{ position: "relative", width: 60, height: 60 }}>
                                    <img src={URL.createObjectURL(file)} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid #ede8df" }} />
                                    <button type="button" onClick={() => removeNewImage(index)} style={{ position: "absolute", top: -4, right: -4, background: "#e74c3c", color: "white", border: "none", borderRadius: "50%", width: 16, height: 16, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Collaborateur / Catégorie ── */}
                <div style={{ display: "flex", gap: 10 }}>
                    {!isMarchand ? (
                        <>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                                <span style={labelStyle}>Collaborateur</span>
                                <select style={inputStyle} value={form.collaboratorId} onChange={e => set("collaboratorId", e.target.value)}>
                                    <option value="">— Sélectionner —</option>
                                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                                <span style={labelStyle}>Catégorie</span>
                                <select style={inputStyle} value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                                    <option value="">— Sélectionner —</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                            <span style={labelStyle}>Catégorie</span>
                            <select style={inputStyle} value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                                <option value="">— Sélectionner —</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* ── Dépôt de stockage ── */}
                <div style={{ background: "#f0f7ff", padding: "12px 14px", borderRadius: 10, border: "1px solid #c5d9f0", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14 }}>🏭</span>
                        <span style={{ ...labelStyle, color: "#3a6fa8", fontWeight: 700 }}>Dépôt de stockage</span>
                        <span style={{ fontSize: 10, color: "#6b8fc4", marginLeft: 4 }}>(Visible livreur / admin uniquement)</span>
                    </div>
                    <LocationPicker
                        address={form.depotAddress}
                        onAddressChange={(val) => set("depotAddress", val)}
                        latitude={form.depotLatitude}
                        longitude={form.depotLongitude}
                        onCoordsChange={(lat, lng) => {
                            setForm(f => ({
                                ...f,
                                depotLatitude: lat,
                                depotLongitude: lng,
                            }));
                        }}
                    />
                </div>

                {error && <p style={{ color: "#e74c3c", fontSize: 12, margin: 0 }}>{error}</p>}

                {/* ── Boutons ── */}
                <div style={{ display: "flex", gap: 10, marginTop: 10, position: "sticky", bottom: 0, background: "#fff", padding: "10px 0", justifyContent: "flex-end" }}>
                    <button type="button" style={btnSecondary} onClick={onClose}>Annuler</button>
                    <button type="button" style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Enregistrement…" : isEditMode ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ── MODAL CONFIRMATION DE SUPPRESSION ───────────────────────────────────────
export const ConfirmDeleteModal = ({ itemName, itemType = "produit", onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
        onClose();
    };

    return (
        <Modal title="Confirmer la suppression" onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#706a5e", lineHeight: "1.5" }}>
                    Êtes-vous sûr de vouloir supprimer définitivement ce {itemType} <strong>{itemName}</strong> ? Cette action est irréversible.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <button type="button" style={btnSecondary} onClick={onClose} disabled={loading}>
                        Annuler
                    </button>
                    <button type="button" style={{ ...btnDanger, opacity: loading ? 0.7 : 1 }} onClick={handleConfirm} disabled={loading}>
                        {loading ? "Suppression..." : "Supprimer"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};