// ui.jsx
import { Loader2, X } from 'lucide-react'

export const Modal = ({ title, onClose, children, width = 400 }) => (
    <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(45,42,34,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
        <div style={{
            background: "#fffdf9", borderRadius: 20,
            border: "1px solid #ede8df",
            boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
            padding: 28, width, maxWidth: "90vw",
            position: "relative",
        }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2d2a22" }}>{title}</h3>
                <button onClick={onClose} style={{
                    border: "none", background: "#f0ebe2", borderRadius: 8,
                    width: 30, height: 30, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "#969696",
                }}>
                    <X size={15} />
                </button>
            </div>
            {children}
        </div>
    </div>
)

export const StarRating = ({ rating }) => (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {[1,2,3,4,5].map(s => (
            <span key={s} style={{ color: s <= Math.round(rating) ? "#f48c06" : "#d4c9b0", fontSize: 12 }}>★</span>
        ))}
        <span style={{ fontSize: 11, color: "#969696", marginLeft: 3 }}>{rating}</span>
    </div>
)

export const Spinner = ({ label }) => (
    <div style={{ textAlign: "center", padding: "40px 0", color: "#f48c06" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 12, marginTop: 8, color: "#969696" }}>{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
)

export const ErrorMsg = ({ msg }) => (
    <p style={{ color: "#e74c3c", fontSize: 13, textAlign: "center", padding: "20px 0" }}>{msg}</p>
)