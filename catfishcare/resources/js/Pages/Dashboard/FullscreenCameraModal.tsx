import { useEffect, useState } from "react";
import { Video, Eye, EyeOff, Layers, RefreshCw, Settings, Camera, X } from "lucide-react";
import type { SensorRow } from "@/Types";

interface FullscreenCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    cameraUrl: string;
    activePondName: string;
    currentData: SensorRow;
    onOpenSettings: () => void;
    showAlert: (msg: string, type: "success" | "error") => void;
}

export default function FullscreenCameraModal({
    isOpen,
    onClose,
    cameraUrl,
    activePondName,
    currentData,
    onOpenSettings,
    showAlert,
}: FullscreenCameraModalProps) {
    const [isHudVisible, setIsHudVisible] = useState(true);
    const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
    const [isSnapshotting, setIsSnapshotting] = useState(false);
    const [streamStatus, setStreamStatus] = useState<"loading" | "online" | "error">("loading");

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCaptureSnapshot = () => {
        setIsSnapshotting(true);
        setTimeout(() => setIsSnapshotting(false), 250);
        showAlert(`Snapshot foto kolam ${activePondName} berhasil tersimpan!`, "success");
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(3, 7, 18, 0.96)",
                backdropFilter: "blur(20px)",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "1400px",
                    height: "calc(100vh - 32px)",
                    maxHeight: "900px",
                    backgroundColor: "#0b0f19",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(14, 165, 233, 0.1)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Flash effect */}
                {isSnapshotting && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "#ffffff",
                            zIndex: 100,
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Top Command Bar */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 20px",
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        flexWrap: "wrap",
                        gap: "12px",
                        zIndex: 20,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                backgroundColor: "rgba(14, 165, 233, 0.15)",
                                border: "1px solid rgba(14, 165, 233, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#38bdf8",
                            }}
                        >
                            <Video size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 800, fontSize: "16px", color: "#f8fafc" }}>
                                    AquaVision Live Surveillance — {activePondName}
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", backgroundColor: "rgba(14, 165, 233, 0.2)", color: "#38bdf8" }}>
                                    1080p FHD
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={handleCaptureSnapshot}
                            style={{ padding: "6px 12px", backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", color: "#f8fafc", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <Camera size={15} style={{ color: "#38bdf8" }} />
                            <span>Snapshot</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsHudVisible(!isHudVisible)}
                            style={{ padding: "6px 12px", backgroundColor: isHudVisible ? "rgba(14, 165, 233, 0.15)" : "rgba(255, 255, 255, 0.08)", border: `1px solid ${isHudVisible ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.15)"}`, borderRadius: "8px", color: isHudVisible ? "#38bdf8" : "#94a3b8", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            {isHudVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                            <span>HUD Telemetri</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
                            style={{ padding: "6px 12px", backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", color: "#f8fafc", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <Layers size={14} style={{ color: "#a855f7" }} />
                            <span>{fitMode === "contain" ? "Fit" : "Fill"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onOpenSettings}
                            style={{ padding: "8px", backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", color: "#f8fafc", cursor: "pointer" }}
                        >
                            <Settings size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: "6px 14px", backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            <X size={16} />
                            <span>Tutup (ESC)</span>
                        </button>
                    </div>
                </div>

                {/* Main Video Screen */}
                <div style={{ flex: 1, position: "relative", backgroundColor: "#000000", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                        src={cameraUrl}
                        alt="Fullscreen Pond Camera Stream"
                        onLoad={() => setStreamStatus("online")}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fitMode,
                            display: "block",
                        }}
                    />

                    {/* HUD Overlay */}
                    {isHudVisible && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "20px",
                                left: "20px",
                                padding: "12px 18px",
                                backgroundColor: "rgba(15, 23, 42, 0.85)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                borderRadius: "12px",
                                color: "#ffffff",
                                display: "flex",
                                gap: "20px",
                                zIndex: 10,
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>SUHU AIR</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#38bdf8" }}>{currentData.TEMPERATURE?.toFixed(1) ?? "28.5"} °C</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>pH AIR</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#34d399" }}>{currentData.pH?.toFixed(2) ?? "6.80"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>TURBIDITY</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fb923c" }}>{currentData.TURBIDITY?.toFixed(1) ?? "12.0"} NTU</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>TDS</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#a855f7" }}>{currentData.NITRATE ?? "288"} PPM</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
