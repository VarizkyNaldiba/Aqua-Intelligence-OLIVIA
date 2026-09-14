import { Fish, MapPin, Layers, Wifi, WifiOff } from "lucide-react";

export interface PondItem {
    id: number;
    name: string;
    location: string;
    status: "Aman" | "Waspada" | "Bahaya";
    iot: "Aktif" | "Tidak Aktif";
    capacity: number;
    lastMaintained: string;
    temp: number;
    ph: number;
    turbidity: number;
}

interface PondCardProps {
    pond: PondItem;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function PondCard({ pond, isSelected, onSelect, onEdit, onDelete }: PondCardProps) {
    const isOnline = pond.iot === "Aktif";

    return (
        <div
            onClick={onSelect}
            className={`db-panel-card ${isSelected ? "selected-pond-card" : ""}`}
            style={{
                padding: "20px",
                borderRadius: "16px",
                backgroundColor: isSelected ? "#f0f9ff" : "#ffffff",
                border: isSelected ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                boxShadow: isSelected ? "0 4px 14px rgba(14, 165, 233, 0.15)" : "0 1px 3px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.2s ease",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            backgroundColor: isSelected ? "rgba(14, 165, 233, 0.15)" : "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isSelected ? "#0ea5e9" : "#64748b",
                        }}
                    >
                        <Fish size={20} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{pond.name}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            <MapPin size={13} />
                            <span>{pond.location}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            backgroundColor: isOnline ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                            color: isOnline ? "#10b981" : "#94a3b8",
                        }}
                    >
                        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {pond.iot}
                    </span>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "10px", marginTop: "12px" }}>
                <div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>SUHU</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{pond.temp.toFixed(1)} °C</div>
                </div>
                <div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>pH AIR</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{pond.ph.toFixed(2)}</div>
                </div>
                <div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>KEKERUHAN</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{pond.turbidity.toFixed(0)} NTU</div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                    <Layers size={13} />
                    <span>Kapasitas: {pond.capacity} Ekor</span>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        style={{
                            padding: "4px 8px",
                            backgroundColor: "#e0f2fe",
                            color: "#0284c7",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Edit
                    </button>
                    {pond.id !== 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            style={{
                                padding: "4px 8px",
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Hapus
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
