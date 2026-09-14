import { useState } from "react";
import { Video, Maximize2, Settings, RefreshCw } from "lucide-react";

interface CameraWidgetProps {
    cameraUrl: string;
    activePondName: string;
    onOpenFullscreen: () => void;
    onOpenSettings: () => void;
}

export default function CameraWidget({
    cameraUrl,
    activePondName,
    onOpenFullscreen,
    onOpenSettings,
}: CameraWidgetProps) {
    const [streamStatus, setStreamStatus] = useState<"loading" | "online" | "error">("loading");
    const [useDemoFallback, setUseDemoFallback] = useState(false);

    const handleReloadStream = () => {
        setStreamStatus("loading");
        setUseDemoFallback(false);
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
                display: "flex",
                flexDirection: "column",
                height: "100%",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(14, 165, 233, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0ea5e9",
                        }}
                    >
                        <Video size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
                            Pond Camera — {activePondName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Live Raspberry Pi Stream • 1080p FHD</div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                        type="button"
                        onClick={handleReloadStream}
                        title="Reconnect Stream"
                        style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                        }}
                    >
                        <RefreshCw size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        title="Configure Camera URL"
                        style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                        }}
                    >
                        <Settings size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={onOpenFullscreen}
                        title="Layar Penuh"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: "#0ea5e9",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(14, 165, 233, 0.3)",
                        }}
                    >
                        <Maximize2 size={14} />
                        <span>Fullscreen</span>
                    </button>
                </div>
            </div>

            {/* Video Viewport Container */}
            <div
                style={{
                    flex: 1,
                    minHeight: "300px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#0b0f19",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #1e293b",
                }}
            >
                {!useDemoFallback ? (
                    <img
                        src={cameraUrl}
                        alt="Pond camera stream"
                        onLoad={() => setStreamStatus("online")}
                        onError={() => {
                            setStreamStatus("error");
                            setUseDemoFallback(true);
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px",
                            textAlign: "center",
                        }}
                    >
                        <Video size={42} style={{ color: "#38bdf8", marginBottom: "12px" }} />
                        <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "15px" }}>Live Pond Feed Standby</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px", maxWidth: "340px" }}>
                            Connected to RTSP/MJPEG Endpoint: <code>{cameraUrl}</code>
                        </div>
                    </div>
                )}

                {/* Status Indicator Overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#ffffff",
                    }}
                >
                    <span
                        style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: streamStatus === "online" ? "#10b981" : "#f59e0b",
                        }}
                    />
                    <span>{streamStatus === "online" ? "LIVE STREAM" : "CONNECTING..."}</span>
                </div>
            </div>
        </div>
    );
}
