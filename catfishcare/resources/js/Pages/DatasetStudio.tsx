import { useState, useEffect } from "react";
import {
    Database,
    Camera,
    CircleDot,
    Download,
    RefreshCw,
    HardDrive,
    Video,
    Info,
    CheckCircle2,
    Clock,
    WifiOff,
    Terminal,
    Layers,
    FileText,
    Zap,
    ExternalLink,
} from "lucide-react";
import type { TabName } from "@/Types";

interface DatasetStudioProps {
    cameraUrl?: string;
    setActiveTab?: (tab: TabName) => void;
}

interface LogEntry {
    id: string;
    time: string;
    type: "info" | "success" | "warning" | "error";
    message: string;
}

export default function DatasetStudio({
    cameraUrl: initialCameraUrl,
}: DatasetStudioProps) {
    const DEFAULT_CAMERA_URL = "http://192.168.137.210:5000/video_feed";
    const [cameraUrl, setCameraUrl] = useState<string>(() => {
        return localStorage.getItem("aqua_camera_url") || initialCameraUrl || DEFAULT_CAMERA_URL;
    });
    const [tempCameraUrl, setTempCameraUrl] = useState<string>(cameraUrl);
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [streamKey, setStreamKey] = useState(0);
    const [streamStatus, setStreamStatus] = useState<"loading" | "online" | "error">("loading");
    const [useDemoFallback, setUseDemoFallback] = useState(false);

    // Dataset collection states
    const [isRecording, setIsRecording] = useState(false);
    const [recordInterval, setRecordInterval] = useState<number>(1.0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [datasetStats, setDatasetStats] = useState({ total_images: 0, total_labels: 0 });
    const [logs, setLogs] = useState<LogEntry[]>([
        {
            id: "1",
            time: new Date().toLocaleTimeString("id-ID"),
            type: "info",
            message: "Dataset Studio diinisialisasi. Menghubungkan ke Raspberry Pi...",
        },
    ]);

    const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
        setLogs((prev) => [
            {
                id: Math.random().toString(36).substring(7),
                time: new Date().toLocaleTimeString("id-ID"),
                type,
                message,
            },
            ...prev.slice(0, 49),
        ]);
    };

    const getRaspiBaseUrl = () => {
        try {
            const parsed = new URL(cameraUrl);
            return `${parsed.protocol}//${parsed.host}`;
        } catch {
            return "http://192.168.137.210:5000";
        }
    };

    // Fetch local Laravel storage dataset stats
    const fetchDatasetStats = async () => {
        try {
            const res = await fetch("/api/dataset/stats");
            if (res.ok) {
                const data = await res.json();
                setDatasetStats(data);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchDatasetStats();
        const interval = setInterval(fetchDatasetStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleReloadStream = () => {
        setStreamStatus("loading");
        setUseDemoFallback(false);
        setStreamKey((k) => k + 1);
        addLog("Memuat ulang video feed stream...", "info");
    };

    const handleSaveUrl = (e: React.FormEvent) => {
        e.preventDefault();
        setCameraUrl(tempCameraUrl);
        localStorage.setItem("aqua_camera_url", tempCameraUrl);
        setIsEditingUrl(false);
        handleReloadStream();
        addLog(`Endpoint kamera diubah ke: ${tempCameraUrl}`, "info");
    };

    // 1. Ambil 1 Sampel Frame
    const triggerCapture = async () => {
        const raspiBase = getRaspiBaseUrl();
        setIsCapturing(true);
        addLog(`Mengirim sinyal capture ke ${raspiBase}/api/dataset/capture...`, "info");
        try {
            const res = await fetch(`${raspiBase}/api/dataset/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ focus: "water_quality", pond: "Kolam Bibit (09)" }),
            });
            if (res.ok) {
                const data = await res.json();
                const filename = data.sample?.image_file || "frame.jpg";
                const totalRaspi = data.total_dataset || 0;
                addLog(`✓ Sampel frame berhasil ditangkap: ${filename} (Total di Raspi: ${totalRaspi})`, "success");
                fetchDatasetStats();
            } else {
                addLog(`✗ Gagal capture: HTTP ${res.status} ${res.statusText}`, "error");
            }
        } catch {
            addLog(`✗ Gagal menghubungi Raspberry Pi (${raspiBase}). Pastikan server Flask aktif.`, "error");
        } finally {
            setIsCapturing(false);
        }
    };

    // 2. Toggle Auto Record (per detik / interval)
    const toggleAutoRecord = async () => {
        const raspiBase = getRaspiBaseUrl();
        if (!isRecording) {
            const webReceiverUrl =
                typeof window !== "undefined"
                    ? `${window.location.origin}/api/dataset/receive`
                    : "http://127.0.0.1:8000/api/dataset/receive";

            addLog(`Memulai perekaman otomatis (interval: ${recordInterval}s)...`, "info");
            try {
                const res = await fetch(`${raspiBase}/api/dataset/record/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        interval: recordInterval,
                        web_url: webReceiverUrl,
                        focus: "water_quality",
                        pond: "Kolam Bibit (09)",
                    }),
                });
                if (res.ok) {
                    setIsRecording(true);
                    addLog(`🔴 Perekaman aktif! Sinkronisasi otomatis ke ${webReceiverUrl}`, "success");
                } else {
                    addLog(`✗ Gagal memulai rekam di Raspi: HTTP ${res.status}`, "error");
                }
            } catch {
                addLog(`✗ Gagal menghubungi Raspberry Pi di ${raspiBase}`, "error");
            }
        } else {
            addLog("Menghentikan perekaman dataset...", "info");
            try {
                const res = await fetch(`${raspiBase}/api/dataset/record/stop`, { method: "POST" });
                if (res.ok) {
                    setIsRecording(false);
                    addLog("⏹ Perekaman dataset berhasil dihentikan. Semua frame tersimpan.", "warning");
                    fetchDatasetStats();
                } else {
                    setIsRecording(false);
                    addLog("Perekaman dihentikan.", "info");
                }
            } catch {
                setIsRecording(false);
                addLog("Perekaman dihentikan lokal.", "warning");
            }
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Header Area */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div style={{ textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(14, 165, 233, 0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#0ea5e9",
                            }}
                        >
                            <Database size={22} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                Studio Pengumpulan Data Training Lele
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: "3px 0 0 0" }}>
                                Pipeline Dataset YOLOv11 & Sinkronisasi Real-time Raspberry Pi ke Laravel Backend
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Status Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 14px",
                            borderRadius: "10px",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            fontSize: "13px",
                            fontWeight: 700,
                        }}
                    >
                        <HardDrive size={16} style={{ color: "#16a34a" }} />
                        <span>Laravel Images: <strong>{datasetStats.total_images}</strong></span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 14px",
                            borderRadius: "10px",
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1e40af",
                            fontSize: "13px",
                            fontWeight: 700,
                        }}
                    >
                        <FileText size={16} style={{ color: "#2563eb" }} />
                        <span>YOLO Labels: <strong>{datasetStats.total_labels}</strong></span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
                    gap: "24px",
                    alignItems: "start",
                }}
            >
                {/* LEFT COLUMN: Live Camera Feed & Endpoint Settings */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        padding: "20px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
                            <Video size={18} style={{ color: "#0ea5e9" }} />
                            <span>Live Camera Viewport (Raspberry Pi)</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleReloadStream}
                            title="Reload Stream"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                backgroundColor: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#475569",
                                cursor: "pointer",
                            }}
                        >
                            <RefreshCw size={12} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Camera Feed Screen */}
                    <div
                        style={{
                            position: "relative",
                            borderRadius: "12px",
                            overflow: "hidden",
                            backgroundColor: "#020617",
                            aspectRatio: "16/10",
                            border: "1px solid #cbd5e1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {useDemoFallback ? (
                            <img
                                src="/pond_camera_feed.png"
                                alt="Dataset Preview Feed"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <img
                                key={`studio-feed-${streamKey}`}
                                src={cameraUrl}
                                alt="Live Dataset Feed"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onLoad={() => setStreamStatus("online")}
                                onError={() => setStreamStatus("error")}
                            />
                        )}

                        {/* Top-Left Live/Recording Indicator */}
                        <div
                            style={{
                                position: "absolute",
                                top: "12px",
                                left: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: isRecording
                                    ? "#dc2626"
                                    : streamStatus === "online" && !useDemoFallback
                                    ? "rgba(220, 38, 38, 0.9)"
                                    : "rgba(15, 23, 42, 0.8)",
                                color: "#ffffff",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 800,
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            <span
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    backgroundColor: "#ffffff",
                                    borderRadius: "50%",
                                    animation: isRecording || streamStatus === "online" ? "pulse-red 1.2s infinite" : "none",
                                }}
                            ></span>
                            <span>{isRecording ? "🔴 RECORDING DATASET" : useDemoFallback ? "DEMO FEED" : "● LIVE STREAM"}</span>
                        </div>

                        {/* Bottom-Right Stream URL Info */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: "12px",
                                right: "12px",
                                color: "#ffffff",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontFamily: "monospace",
                            }}
                        >
                            {cameraUrl}
                        </div>

                        {/* Offline Error Overlay */}
                        {!useDemoFallback && streamStatus === "error" && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(15, 23, 42, 0.92)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "20px",
                                    textAlign: "center",
                                    color: "#f8fafc",
                                    gap: "10px",
                                }}
                            >
                                <WifiOff size={28} style={{ color: "#f87171" }} />
                                <div style={{ fontWeight: 700, fontSize: "14px" }}>Stream Kamera Tidak Terhubung</div>
                                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, maxWidth: "320px" }}>
                                    Pastikan Raspberry Pi aktif di port 5000 pada jaringan WiFi yang sama.
                                </p>
                                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                    <button
                                        type="button"
                                        onClick={handleReloadStream}
                                        style={{
                                            padding: "6px 12px",
                                            backgroundColor: "#0ea5e9",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Coba Lagi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseDemoFallback(true)}
                                        style={{
                                            padding: "6px 12px",
                                            backgroundColor: "transparent",
                                            color: "#cbd5e1",
                                            border: "1px solid #475569",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Gunakan Demo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fokus Kolam Bibit & Pemantauan Kualitas Air */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "#f0fdf4",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: "1px solid #bbf7d0",
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(22, 163, 74, 0.12)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#16a34a",
                                }}
                            >
                                <Zap size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Target Kolam & Fokus Pemantauan
                                </div>
                                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                                    Kolam Bibit Lele (Kolam 09) • Deteksi Mutu Air & SFR
                                </div>
                            </div>
                        </div>

                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                backgroundColor: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #86efac",
                                whiteSpace: "nowrap",
                            }}
                        >
                            ● Khusus Kolam Bibit
                        </span>
                    </div>

                    {/* Endpoint Configuration Bar */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                        {!isEditingUrl ? (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                                <span>Raspberry Pi Endpoint: <strong style={{ color: "#0f172a" }}>{cameraUrl}</strong></span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempCameraUrl(cameraUrl);
                                        setIsEditingUrl(true);
                                    }}
                                    style={{
                                        color: "#0ea5e9",
                                        background: "none",
                                        border: "none",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        padding: 0,
                                    }}
                                >
                                    Ubah IP
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveUrl} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input
                                    type="text"
                                    value={tempCameraUrl}
                                    onChange={(e) => setTempCameraUrl(e.target.value)}
                                    placeholder="http://192.168.137.210:5000/video_feed"
                                    style={{
                                        flex: 1,
                                        padding: "6px 10px",
                                        borderRadius: "6px",
                                        border: "1px solid #0ea5e9",
                                        fontSize: "12px",
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: "6px 12px",
                                        backgroundColor: "#0ea5e9",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Simpan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingUrl(false)}
                                    style={{
                                        padding: "6px 10px",
                                        backgroundColor: "#f1f5f9",
                                        color: "#64748b",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Batal
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Pipeline Actions, Terminal Log & Training Export */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Action Panel Card */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            padding: "20px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
                            <Zap size={18} style={{ color: "#f59e0b" }} />
                            <span>Kontrol Pengambilan Dataset</span>
                        </div>

                        {/* Action 1: Capture 1 Frame */}
                        <button
                            type="button"
                            disabled={isCapturing}
                            onClick={triggerCapture}
                            style={{
                                width: "100%",
                                height: "48px",
                                backgroundColor: "#0ea5e9",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: isCapturing ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                transition: "all 0.2s",
                                boxShadow: "0 4px 12px rgba(14, 165, 233, 0.25)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0284c7")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0ea5e9")}
                        >
                            <Camera size={18} />
                            <span>{isCapturing ? "Menyimpan Frame..." : "📸 Ambil 1 Sampel Frame"}</span>
                        </button>

                        {/* Action 2: Auto Record Dataset */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={toggleAutoRecord}
                                style={{
                                    flex: 1,
                                    height: "48px",
                                    backgroundColor: isRecording ? "#475569" : "#ef4444",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    transition: "all 0.2s",
                                    boxShadow: isRecording
                                        ? "0 4px 12px rgba(71, 85, 105, 0.25)"
                                        : "0 4px 12px rgba(239, 68, 68, 0.25)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isRecording ? "#334155" : "#dc2626";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isRecording ? "#475569" : "#ef4444";
                                }}
                            >
                                <CircleDot size={18} />
                                <span>
                                    {isRecording
                                        ? "⏹ Hentikan Perekaman"
                                        : `🔴 Rekam Otomatis (${recordInterval}s/frame)`}
                                </span>
                            </button>

                            {/* Interval selector */}
                            <select
                                value={recordInterval}
                                disabled={isRecording}
                                onChange={(e) => setRecordInterval(parseFloat(e.target.value))}
                                style={{
                                    width: "90px",
                                    borderRadius: "10px",
                                    border: "1px solid #cbd5e1",
                                    padding: "0 8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    backgroundColor: isRecording ? "#f1f5f9" : "#ffffff",
                                }}
                                title="Interval waktu per frame"
                            >
                                <option value={0.5}>0.5s</option>
                                <option value={1.0}>1.0s</option>
                                <option value={2.0}>2.0s</option>
                                <option value={5.0}>5.0s</option>
                            </select>
                        </div>

                        {/* Action 3: Export Dataset ZIP YOLOv11 */}
                        <a
                            href={`${getRaspiBaseUrl()}/api/dataset/export`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                width: "100%",
                                height: "48px",
                                backgroundColor: "#10b981",
                                color: "#ffffff",
                                borderRadius: "10px",
                                fontSize: "14px",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                textDecoration: "none",
                                transition: "all 0.2s",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
                        >
                            <Download size={18} />
                            <span>📥 Download Dataset .ZIP (Format YOLOv11)</span>
                        </a>
                    </div>

                    {/* Live Terminal / Activity Log Console */}
                    <div
                        style={{
                            backgroundColor: "#0b0f19",
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "18px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontSize: "13px", fontWeight: 700 }}>
                                <Terminal size={16} />
                                <span>Pipeline Event Console</span>
                            </div>
                            <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>Real-time Stream</span>
                        </div>

                        <div
                            style={{
                                maxHeight: "180px",
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                fontFamily: "monospace",
                                fontSize: "12px",
                                paddingRight: "4px",
                            }}
                        >
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "flex-start",
                                        color:
                                            log.type === "success"
                                                ? "#34d399"
                                                : log.type === "error"
                                                ? "#f87171"
                                                : log.type === "warning"
                                                ? "#fbbf24"
                                                : "#94a3b8",
                                    }}
                                >
                                    <span style={{ color: "#475569", flexShrink: 0 }}>[{log.time}]</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Pipeline Explanation Card */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <Layers size={20} style={{ color: "#0ea5e9" }} />
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Alur Kerja Training Pipeline YOLOv11 Lele
                    </h3>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                    }}
                >
                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0ea5e9", marginBottom: "6px" }}>1. CAPTURE & TAGGING</div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.4 }}>
                            Raspberry Pi mengambil frame beresolusi tinggi dan membubuhkan tag skenario kondisi air/lele.
                        </div>
                    </div>

                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0ea5e9", marginBottom: "6px" }}>2. HTTP TRANSMISSION</div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.4 }}>
                            Frame dikirim via <code>POST /api/dataset/receive</code> secara instan ke server Laragon lokal.
                        </div>
                    </div>

                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0ea5e9", marginBottom: "6px" }}>3. STORAGE ARCHIVE</div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.4 }}>
                            File gambar disimpan di <code>storage/app/public/dataset/images</code> bersama file label <code>.txt</code>.
                        </div>
                    </div>

                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0ea5e9", marginBottom: "6px" }}>4. YOLOv11 EXPORT</div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.4 }}>
                            Unduh arsip <code>.ZIP</code> dataset dengan struktur folder YOLO standar siap training di PyTorch/Ultralytics.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
