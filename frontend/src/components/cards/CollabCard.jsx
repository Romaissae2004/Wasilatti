import React, { useState } from 'react'
import { MapPin, ExternalLink } from "lucide-react"

const CollabCard = ({ collab }) => {

    const [hovered, setHovered] = useState(false)

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? "#fffaf3" : "#fff",
                borderRadius: 14,
                padding: 18,
                cursor: "pointer",
            }}
        >

            <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: collab.color,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                {collab.initials}
            </div>

            <h3>{collab.name}</h3>

            <p>{collab.category}</p>

            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
            }}>
                <MapPin size={12} />
                {collab.city}
            </div>

            {hovered && <ExternalLink size={14} />}
        </div>
    )
}

export default CollabCard