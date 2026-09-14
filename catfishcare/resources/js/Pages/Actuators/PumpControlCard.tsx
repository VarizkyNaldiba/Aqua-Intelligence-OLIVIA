import { Activity, Power, RefreshCw } from "lucide-react";

interface PumpControlCardProps {
    status: any;
    actionLoading: boolean;
    targetPercent: number;
    setTargetPercent: (val: number) => void;
    onTriggerExchange: () => void;
    onManualControl: (action: string) => void;
}

export default function PumpControlCard({
    status,
    actionLoading,
    targetPercent,
    setTargetPercent,
    onTriggerExchange,
    onManualControl,
}: PumpControlCardProps) {
    const isDrainActive = status?.drain_pump_active ?? false;
    const isFillActive = status?.fill_pump_active ?? false;
    const isWaterExchangeActive = status?.water_exchange_active ?? false;

    return (
        <div className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={20} color="#0ea5e9" />
                    Status Pompa Air & Manual Control
                </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                {/* Drain Pump Card */}
                <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: isDrainActive ? "rgba(239, 68, 68, 0.05)" : "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#334155" }}>Pompa Kuras (Drain)</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", backgroundColor: isDrainActive ? "#fee2e2" : "#e2e8f0", color: isDrainActive ? "#dc2626" : "#64748b" }}>
                            {isDrainActive ? "MEMBUANG AIR" : "OFF"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onManualControl(isDrainActive ? "stop_drain" : "start_drain")}
                        disabled={actionLoading}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: isDrainActive ? "#dc2626" : "#0284c7",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                        }}
                    >
                        <Power size={14} />
                        <span>{isDrainActive ? "Matikan Pompa Kuras" : "Nyalakan Pompa Kuras"}</span>
                    </button>
                </div>

                {/* Fill Pump Card */}
                <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: isFillActive ? "rgba(16, 185, 129, 0.05)" : "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#334155" }}>Pompa Pengisi (Fill)</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", backgroundColor: isFillActive ? "#dcfce7" : "#e2e8f0", color: isFillActive ? "#15803d" : "#64748b" }}>
                            {isFillActive ? "MENGISI AIR" : "OFF"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onManualControl(isFillActive ? "stop_fill" : "start_fill")}
                        disabled={actionLoading}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: isFillActive ? "#15803d" : "#0284c7",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                        }}
                    >
                        <Power size={14} />
                        <span>{isFillActive ? "Matikan Pompa Isi" : "Nyalakan Pompa Isi"}</span>
                    </button>
                </div>
            </div>

            {/* Smart Water Exchange Trigger Box */}
            <div style={{ padding: "18px", borderRadius: "12px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0369a1", margin: "0 0 8px 0" }}>
                    Smart Automated Water Exchange Cycle
                </h4>
                <p style={{ fontSize: "12px", color: "#0284c7", margin: "0 0 14px 0", lineHeight: 1.4 }}>
                    Picu siklus penggantian air otomatis. ESP32 akan melakukan kuras hingga persentase target lalu mengisi ulang secara presisi.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1" }}>Target Kuras:</label>
                        <select
                            value={targetPercent}
                            onChange={(e) => setTargetPercent(Number(e.target.value))}
                            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #38bdf8", fontSize: "12px", fontWeight: 700 }}
                        >
                            <option value={20}>20% Air</option>
                            <option value={30}>30% Air (Rekomendasi)</option>
                            <option value={50}>50% Air (Total Exchange)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={onTriggerExchange}
                        disabled={actionLoading || isWaterExchangeActive}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: isWaterExchangeActive ? "#94a3b8" : "#0ea5e9",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <RefreshCw size={14} className={isWaterExchangeActive ? "animate-spin" : ""} />
                        <span>{isWaterExchangeActive ? "Siklus Berjalan..." : "Picu Siklus Air Now"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
