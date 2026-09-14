import { Activity, X, CheckCircle } from "lucide-react";

interface DiagnosticModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DiagnosticModal({ isOpen, onClose }: DiagnosticModalProps) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "500px",
                    padding: "24px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
                    border: "1px solid #e2e8f0",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                            <Activity size={20} />
                        </div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Diagnostic Check Result</h3>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>ESP32 Wi-Fi & MQTT Socket</span>
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> OK (12ms)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>Sensor Suhu Air (DS18B20)</span>
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Normal</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>Sensor pH Analog & Calibration</span>
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Calibrated</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>Camera Stream (RTSP MJPEG)</span>
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Online</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#0ea5e9",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    Close Diagnostic
                </button>
            </div>
        </div>
    );
}
