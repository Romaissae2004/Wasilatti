import React from 'react'
import { colors } from '../../styles/colors'

const StatCard = ({ icon: Icon, label, value, change, positive = true }) => {
    return (
        <div style={{
            background: "#ffffff",
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            padding: "18px 20px",
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between"
            }}>
                <span>{label}</span>

                <span style={{
                    background: "rgba(244,140,6,0.1)",
                    padding: 6,
                    borderRadius: 8,
                    color: colors.primary,
                }}>
                    <Icon size={15} />
                </span>
            </div>

            <h2>{value}</h2>

            <p style={{
                color: positive ? colors.primary : "red"
            }}>
                {change}
            </p>
        </div>
    )
}

export default StatCard