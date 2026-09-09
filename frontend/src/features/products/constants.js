export const AVATAR_COLORS = ["#f48c06","#e31837","#e91e8c","#e4002b","#00704a","#009b3a","#50afa8","#c47a05"]
export const AVATAR_BG     = ["#fff8e1","#fff0f0","#fff0fa","#fff0f0","#f0fff8","#f0fff4","#e8f7f6","#fef3e0"]

export function getInitials(name = "") {
    return name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #ede8df", background: "#faf6ef",
    fontSize: 13, color: "#2d2a22", outline: "none",
    transition: "border-color 0.2s",
}
export const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#969696",
    letterSpacing: "0.06em", textTransform: "uppercase"
}
export const btnPrimary = {
    flex: 1, background: "#f48c06", color: "#fff", border: "none",
    borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700,
    cursor: "pointer", transition: "background 0.2s",
}
export const btnSecondary = {
    flex: 1, background: "#f0ebe2", color: "#969696", border: "none",
    borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700,
    cursor: "pointer",
}