import { Sparkles, ShieldCheck, RefreshCw } from "lucide-react";

interface PredictionOverviewCardProps {
    forecastMeta: {
        lastHistoryTime: string;
        source: string;
        generatedAt: string;
    };
    isLoading: boolean;
    onRefresh: () => void;
}

export default function PredictionOverviewCard({ forecastMeta, isLoading, onRefresh }: PredictionOverviewCardProps) {
    return (
        <div className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "rgba(14, 165, 233, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9" }}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            24-Hour AI Predictive Analytics
                        </h3>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                            Model: {forecastMeta.source} • Acuan Terakhir: {forecastMeta.lastHistoryTime}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <ShieldCheck size={14} /> Akurasi Model: 94.2% (BiLSTM)
                    </span>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isLoading}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: "#0ea5e9",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        <span>Update Prediksi</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
