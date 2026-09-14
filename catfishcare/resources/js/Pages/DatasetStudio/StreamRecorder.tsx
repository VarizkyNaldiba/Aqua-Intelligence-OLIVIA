import { useState } from "react";
import { Camera, CircleDot, RefreshCw, Video } from "lucide-react";

interface StreamRecorderProps {
    cameraUrl: string;
    onSnapshot: () => void;
}

export default function StreamRecorder({ cameraUrl, onSnapshot }: StreamRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);

    return (
        <div className="db-panel-card" style={{ padding: "20px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(14, 165, 233, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9" }}>
                        <Video size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Live Dataset Collection Viewport
                        </h3>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                            Raspberry Pi Stream: {cameraUrl}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={onSnapshot}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            backgroundColor: "#0ea5e9",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        <Camera size={14} />
                        <span>Tangkap Foto Frame</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRecording(!isRecording)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            backgroundColor: isRecording ? "#ef4444" : "rgba(239, 68, 68, 0.1)",
                            color: isRecording ? "#ffffff" : "#dc2626",
                            border: `1px solid ${isRecording ? "#ef4444" : "rgba(239, 68, 68, 0.3)"}`,
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        <CircleDot size={14} className={isRecording ? "animate-pulse" : ""} />
                        <span>{isRecording ? "Stop Rekam" : "Mulai Auto Collect"}</span>
                    </button>
                </div>
            </div>

            <div
                style={{
                    width: "100%",
                    height: "360px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#0b0f19",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                }}
            >
                <img
                    src={cameraUrl}
                    alt="Dataset Studio Live Stream"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            </div>
        </div>
    );
}
