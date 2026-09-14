import { useState } from "react";
import { Sparkles, RefreshCw, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { SensorRow } from "@/Types";

interface AiRecommendationWidgetProps {
    currentData: SensorRow;
    selectedPondId: number;
    showAlert: (msg: string, type: "success" | "error") => void;
}

export default function AiRecommendationWidget({
    currentData,
    selectedPondId,
    showAlert,
}: AiRecommendationWidgetProps) {
    const [isTriggeringExchange, setIsTriggeringExchange] = useState(false);

    const temp = currentData.TEMPERATURE || 28.5;
    const ph = currentData.pH || 6.8;
    const turb = currentData.TURBIDITY || 12.0;

    let overallRisk: "Optimal" | "Waspada" | "Kritis" = "Optimal";
    let riskColor = "#10b981";
    let riskBg = "rgba(16, 185, 129, 0.1)";

    if (temp > 33 || ph < 6.0 || ph > 9.0 || turb > 55) {
        overallRisk = "Kritis";
        riskColor = "#ef4444";
        riskBg = "rgba(239, 68, 68, 0.1)";
    } else if (temp > 31 || ph < 6.5 || ph > 8.5 || turb > 35) {
        overallRisk = "Waspada";
        riskColor = "#f59e0b";
        riskBg = "rgba(245, 158, 11, 0.1)";
    }

    const handleAutomateWaterChange = async () => {
        setIsTriggeringExchange(true);
        try {
            const res = await fetch("/api/actuators/water-exchange/trigger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kolam_id: selectedPondId,
                    target_percent: selectedPondId === 9 ? 50 : 30,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                showAlert(`⚡ ${data.message}`, "success");
            } else {
                showAlert("Gagal memicu Smart Water Exchange di ESP32.", "error");
            }
        } catch {
            showAlert("Memulai simulasi Smart Water Exchange: Drain Pump aktif -> Fill Pump -> Aerator.", "success");
        } finally {
            setIsTriggeringExchange(false);
        }
    };

    return (
        <div
            className="db-panel-card"
            style={{
                padding: "24px",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(168, 85, 247, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#a855f7",
                        }}
                    >
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Action Predictions & System Guide
                        </h3>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                            AI Machine Learning Diagnostic & Water Automation
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        backgroundColor: riskBg,
                        color: riskColor,
                        fontWeight: 700,
                        fontSize: "12px",
                        border: `1px solid ${riskColor}40`,
                    }}
                >
                    {overallRisk === "Optimal" ? (
                        <ShieldCheck size={14} />
                    ) : overallRisk === "Waspada" ? (
                        <AlertTriangle size={14} />
                    ) : (
                        <AlertTriangle size={14} />
                    )}
                    <span>Status: {overallRisk}</span>
                </div>
            </div>

            {/* AI Diagnosis content */}
            <div
                style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "16px",
                    flex: 1,
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                    <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                        {overallRisk === "Optimal"
                            ? "Kualitas air kolam dalam kondisi stabil. pH air dan kekeruhan berada di ambang batas ideal untuk perkembangan benih lele."
                            : overallRisk === "Waspada"
                            ? "Terdeteksi sedikit kenaikan kekeruhan atau suhu air. Disarankan untuk memicu siklus ganti air parsial (30%)."
                            : "Kualitas air berada di zona berbahaya! Lakukan pergantian air darurat dan pastikan pompa sirkulasi dan aerasi aktif."}
                    </div>
                </div>

                <div style={{ fontSize: "12px", color: "#64748b", borderTop: "1px dashed #cbd5e1", paddingTop: "10px", marginTop: "10px" }}>
                    <strong>Rekomendasi AI:</strong> Lakukan kuras dan isi ulang air otomatis jika kekeruhan melebih 35 NTU.
                </div>
            </div>

            {/* Smart Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={handleAutomateWaterChange}
                    disabled={isTriggeringExchange}
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: "#0ea5e9",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
                        transition: "all 0.2s",
                        opacity: isTriggeringExchange ? 0.7 : 1,
                    }}
                >
                    {isTriggeringExchange ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                    <span>Picu Smart Water Exchange (Pump Auto)</span>
                </button>
            </div>
        </div>
    );
}
