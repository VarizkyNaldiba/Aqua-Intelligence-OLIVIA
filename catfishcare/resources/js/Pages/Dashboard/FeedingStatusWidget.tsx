import { useState } from "react";
import { Utensils, Clock, Check } from "lucide-react";

interface FeedingStatusWidgetProps {
    activePondName: string;
    showAlert: (msg: string, type: "success" | "error") => void;
}

export default function FeedingStatusWidget({ activePondName, showAlert }: FeedingStatusWidgetProps) {
    const [isFeeding, setIsFeeding] = useState(false);
    const [lastFedTime, setLastFedTime] = useState("12:00 WIB");

    const handleFeedNow = () => {
        setIsFeeding(true);
        setTimeout(() => {
            const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
            setLastFedTime(nowStr);
            setIsFeeding(false);
            showAlert(`Pakan otomatis berhasil disebar di ${activePondName}!`, "success");
        }, 1200);
    };

    return (
        <div
            className="db-panel-card"
            style={{
                padding: "20px",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#f59e0b",
                        }}
                    >
                        <Utensils size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>Feeder & Pakan Lele</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Jadwal Pemberian Pakan Otomatis</div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    <Clock size={14} />
                    <span>Terakhir: {lastFedTime}</span>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                    Status Feeder: <strong style={{ color: "#10b981" }}>Standby (Siap)</strong> • Dosis: 500 Gram
                </div>

                <button
                    type="button"
                    onClick={handleFeedNow}
                    disabled={isFeeding}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        backgroundColor: "#f59e0b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                        opacity: isFeeding ? 0.7 : 1,
                    }}
                >
                    {isFeeding ? <Clock size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{isFeeding ? "Proses..." : "Beri Pakan Sekarang"}</span>
                </button>
            </div>
        </div>
    );
}
