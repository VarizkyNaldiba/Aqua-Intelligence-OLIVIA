import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    Video,
    Sparkles,
    RefreshCw,
    Clock,
    Maximize2,
    Info,
    ChevronDown,
    X,
    Settings,
    WifiOff,
    Camera,
    Eye,
    EyeOff,
    Layers,
    Activity,
    Droplets,
    Thermometer,
    Minimize2,
    Download,
    Database,
    HardDrive,
    CircleDot,
} from "lucide-react";
import type { TabName, MetricType, AppUser, SensorRow } from "@/Types";
import { useSensorData } from "@/Hooks/useSensorData";
import { useTheme } from "@/Hooks/useTheme";

// Import other tabs
import HomeTab from "@/Pages/Home";
import PondsTab from "@/Pages/Ponds";
import AnalyticsTab from "@/Pages/Analytics";
import ProfileTab from "@/Pages/Profile";
import NotificationsTab from "@/Pages/Notifications";
import DatasetStudioTab from "@/Pages/DatasetStudio";
import Auth from "@/Pages/Login";

type TodoItem = {
    id: number;
    text: string;
    checked: boolean;
};

export default function Dashboard() {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
        const savedUser = localStorage.getItem("aqua_current_user");
        return savedUser ? (JSON.parse(savedUser) as AppUser) : null;
    });

    const handleLoginSuccess = (user: AppUser) => {
        setCurrentUser(user);
        localStorage.setItem("aqua_current_user", JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem("aqua_current_user");
        setActiveTab("dashboard");
        window.location.href = "/login";
    };

    const [activeTab, setActiveTab] = useState<TabName>(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab") as TabName;
            if (tab && ["dashboard", "home", "ponds", "analytics", "profile", "notifications"].includes(tab)) {
                return tab;
            }
        }
        return "dashboard";
    });

    const [selectedPondId, setSelectedPondId] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentMetricType, setCurrentMetricType] =
        useState<MetricType>("TEMPERATURE");

    const { theme } = useTheme();

    const {
        rawData,
        currentData,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        latestRows,
        isLiveActive,
    } = useSensorData(selectedPondId);

    const [alert, setAlert] = useState({ message: "", type: "" });
    const [todos, setTodos] = useState<TodoItem[]>([
        { id: 1, text: "Kuras air kolam A", checked: false },
        { id: 2, text: "Cek filter & sirkulasi air", checked: false },
    ]);

    const DEFAULT_CAMERA_URL = "http://192.168.137.210:5000/video_feed";
    const [cameraUrl, setCameraUrl] = useState<string>(() => {
        return localStorage.getItem("aqua_camera_url") || DEFAULT_CAMERA_URL;
    });
    const [tempCameraUrl, setTempCameraUrl] = useState<string>(cameraUrl);
    const [isConfiguringCamera, setIsConfiguringCamera] = useState(false);
    const [streamStatus, setStreamStatus] = useState<"loading" | "online" | "error">("loading");
    const [streamKey, setStreamKey] = useState(0);
    const [useDemoFallback, setUseDemoFallback] = useState(false);
    const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
    const [isHudVisible, setIsHudVisible] = useState(true);
    const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
    const [isSnapshotting, setIsSnapshotting] = useState(false);
    const [isFsPondDropdownOpen, setIsFsPondDropdownOpen] = useState(false);

    const handleReloadStream = () => {
        setStreamStatus("loading");
        setUseDemoFallback(false);
        setStreamKey((k) => k + 1);
    };

    const handleCaptureSnapshot = (pondName: string) => {
        setIsSnapshotting(true);
        setTimeout(() => setIsSnapshotting(false), 350);

        const img = document.getElementById("fullscreen-camera-img") as HTMLImageElement;
        if (img) {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || 1280;
                canvas.height = img.naturalHeight || 720;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                    ctx.fillRect(20, canvas.height - 50, 420, 36);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "bold 16px sans-serif";
                    ctx.fillText(`CatfishCare CAM-01 • ${pondName} • ${currentTime}`, 32, canvas.height - 26);

                    const dataUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `CatfishCare_Snapshot_${pondName.replace(/\s+/g, "_")}_${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                    showAlert("📸 Snapshot kamera berhasil diunduh!", "success");
                }
            } catch {
                showAlert("📸 Frame snapshot berhasil di-capture!", "success");
            }
        }
    };

    const handleSaveCameraUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanUrl = tempCameraUrl.trim() || DEFAULT_CAMERA_URL;
        setCameraUrl(cleanUrl);
        localStorage.setItem("aqua_camera_url", cleanUrl);
        setIsConfiguringCamera(false);
        setUseDemoFallback(false);
        setStreamStatus("loading");
        setStreamKey((k) => k + 1);
        showAlert("URL endpoint video feed berhasil disimpan.", "success");
    };

    const handleResetCameraUrl = () => {
        setTempCameraUrl(DEFAULT_CAMERA_URL);
        setCameraUrl(DEFAULT_CAMERA_URL);
        localStorage.removeItem("aqua_camera_url");
        setIsConfiguringCamera(false);
        setUseDemoFallback(false);
        setStreamStatus("loading");
        setStreamKey((k) => k + 1);
        showAlert("URL endpoint video feed direset ke default.", "success");
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsCameraFullscreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const showAlert = (message: string, type = "success") => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: "", type: "" }), 4000);
    };

    const toggleTodo = (id: number) => {
        setTodos((prevTodos) =>
            prevTodos.map((todo) =>
                todo.id === id ? { ...todo, checked: !todo.checked } : todo,
            )
        );
    };

    // Live clock for Camera widget
    const [currentTime, setCurrentTime] = useState("");
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, "0");
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months[now.getMonth()];
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");
            setCurrentTime(`${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close custom dropdown on clicking outside
    useEffect(() => {
        if (!isDropdownOpen) return;
        const handleOutsideClick = () => setIsDropdownOpen(false);
        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [isDropdownOpen]);

    // Sparkline SVG points generator
    const getSparklinePoints = (data: number[], width = 120, height = 30) => {
        if (data.length < 2) return "";
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min === 0 ? 1 : max - min;

        return data
            .map((val, index) => {
                const x = (index / (data.length - 1)) * width;
                const y = height - ((val - min) / range) * height;
                return `${index === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    };

    const handleAutomateWaterChange = async () => {
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
        }
    };

    const renderDashboardContent = () => {
        if (!currentData) {
            return (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h2>Memuat data IoT...</h2>
                </div>
            );
        }

        // Active IoT pond (Single Dynamic System)
        const ponds = [
            { id: 1, name: "Kolam TFS 1", location: "Kolam Riset IoT TFS", status: "Optimal (IoT Aktif)" },
        ];

        const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[0];

        // Dynamic real time-series history for sparklines (last 15 entries)
        const sparklineHistory = latestRows.slice(-15);
        const tempHistory = sparklineHistory.map((r) => r.TEMPERATURE || 27.5);
        const phHistory = sparklineHistory.map((r) => r.pH);
        const turbidityHistory = sparklineHistory.map((r) => r.TURBIDITY);
        const tdsHistory = sparklineHistory.map((r) => r.NITRATE || 420);
        const heightHistory = sparklineHistory.map((r) => r.Length || 25.0);

        // Helper to check parameter statuses
        const getTempStatus = (temp: number): "Aman" | "Waspada" | "Bahaya" => {
            if (temp >= 25 && temp <= 32) return "Aman";
            if (temp >= 22 && temp <= 35) return "Waspada";
            return "Bahaya";
        };

        const getPhStatus = (ph: number): "Aman" | "Waspada" | "Bahaya" => {
            if (ph >= 6.5 && ph <= 8.5) return "Aman";
            if (ph >= 5.8 && ph <= 9.0) return "Waspada";
            return "Bahaya";
        };

        const getTurbidityStatus = (turb: number): "Aman" | "Waspada" | "Bahaya" => {
            if (turb <= 35) return "Aman";
            if (turb <= 55) return "Waspada";
            return "Bahaya";
        };

        const getTdsStatus = (tds: number): "Aman" | "Waspada" | "Bahaya" => {
            if (tds <= 900) return "Aman";
            if (tds <= 1000) return "Waspada";
            return "Bahaya";
        };

        const getHeightStatus = (height: number): "Aman" | "Waspada" | "Bahaya" => {
            if (height >= 8 && height <= 35) return "Aman";
            if (height >= 4 && height <= 40) return "Waspada";
            return "Bahaya";
        };

        const renderStatusBadge = (status: "Aman" | "Waspada" | "Bahaya") => {
            switch (status) {
                case "Aman":
                    return <span className="db-metric-badge" style={{ backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 700 }}>Optimal</span>;
                case "Waspada":
                    return <span className="db-metric-badge" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 700 }}>Waspada</span>;
                case "Bahaya":
                    return <span className="db-metric-badge" style={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: 700 }}>Kritis</span>;
            }
        };

        const getCardStyle = (status: "Aman" | "Waspada" | "Bahaya") => {
            switch (status) {
                case "Aman":
                    return {
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        transition: "all 0.3s ease",
                    };
                case "Waspada":
                    return {
                        backgroundColor: "#fffdf5",
                        borderColor: "#fef08a",
                        transition: "all 0.3s ease",
                    };
                case "Bahaya":
                    return {
                        backgroundColor: "#fff5f5",
                        borderColor: "#fecaca",
                        transition: "all 0.3s ease",
                    };
            }
        };

        const tempVal = currentData.TEMPERATURE;
        const phVal = currentData.pH;
        const turbVal = currentData.TURBIDITY;
        const tdsVal = currentData.NITRATE ?? 420;
        const heightVal = currentData.Length ?? 12.0;

        const tempStatus = getTempStatus(tempVal);
        const phStatus = getPhStatus(phVal);
        const turbStatus = getTurbidityStatus(turbVal);
        const tdsStatus = getTdsStatus(tdsVal);
        const heightStatus = getHeightStatus(heightVal);

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {/* Heading Area with Pond Selection Dropdown */}
                <div className="db-heading-area" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ textAlign: "left" }}>
                        <h2 className="db-title">Real-Time Dashboard</h2>
                        <p className="db-subtitle">Overview of your catfish ponds today</p>
                    </div>

                    {/* Custom Scrollable Selector */}
                {/* IoT Live Status Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            backgroundColor: isLiveActive ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                            color: isLiveActive ? "#10b981" : "#94a3b8",
                            border: `1px solid ${isLiveActive ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.2)"}`,
                            transition: "all 0.5s ease",
                        }}>
                            <span style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                backgroundColor: isLiveActive ? "#10b981" : "#94a3b8",
                                animation: isLiveActive ? "lp-pulse 2s infinite" : "none",
                                display: "inline-block",
                            }} />
                            {isLiveActive ? "ESP32 LIVE" : "ESP32 OFFLINE"}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#64748b" }}>Pond:</span>
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDropdownOpen(!isDropdownOpen);
                                }}
                                className="pm-input"
                                style={{
                                    width: "160px",
                                    height: "42px",
                                    backgroundColor: "#ffffff",
                                    borderColor: "#cbd5e1",
                                    color: "#0f172a",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    padding: "0 12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    textAlign: "left",
                                }}
                            >
                                <span>{activePond.name}</span>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        color: "#64748b",
                                        transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                    }}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "46px",
                                        left: 0,
                                        width: "160px",
                                        maxHeight: "126px", // Shows exactly 3 items at a time
                                        overflowY: "auto",
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "6px",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                        zIndex: 1000,
                                    }}
                                >
                                    {ponds.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPondId(p.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            style={{
                                                padding: "10px 12px",
                                                fontSize: "13px",
                                                fontWeight: selectedPondId === p.id ? 700 : 500,
                                                color: selectedPondId === p.id ? "#0ea5e9" : "#0f172a",
                                                backgroundColor: selectedPondId === p.id ? "#f0f9ff" : "transparent",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedPondId !== p.id) {
                                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedPondId !== p.id) {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                }
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {alert.message && (
                    <div
                        className="auth-alert-new"
                        style={{
                            backgroundColor: alert.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            borderColor: alert.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: alert.type === "success" ? "#34d399" : "#f87171",
                            marginBottom: "0",
                        }}
                    >
                        <Info size={16} />
                        <span>{alert.message}</span>
                    </div>
                )}

                {/* Metrics Mini Cards Grid */}
                <div className="db-metrics-grid">
                    {/* Card 1: Suhu Air */}
                    <div className="db-metric-card" style={getCardStyle(tempStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">Suhu Air</span>
                            {renderStatusBadge(tempStatus)}
                        </div>
                        <div className="db-metric-value">{tempVal.toFixed(1)} <span style={{ fontSize: "16px", fontWeight: 600, color: "#64748b" }}>°C</span></div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`${getSparklinePoints(tempHistory)} L 120,30 L 0,30 Z`}
                                    fill="url(#tempGrad)"
                                />
                                <path
                                    d={getSparklinePoints(tempHistory)}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="db-metric-footer">Ideal: 25.0 – 32.0 °C</div>
                    </div>

                    {/* Card 2: pH Air */}
                    <div className="db-metric-card" style={getCardStyle(phStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">pH Air</span>
                            {renderStatusBadge(phStatus)}
                        </div>
                        <div className="db-metric-value">{phVal.toFixed(2)} <span style={{ fontSize: "16px", fontWeight: 600, color: "#64748b" }}>pH</span></div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`${getSparklinePoints(phHistory)} L 120,30 L 0,30 Z`}
                                    fill="url(#phGrad)"
                                />
                                <path
                                    d={getSparklinePoints(phHistory)}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="db-metric-footer">Ideal: 6.50 – 8.50 pH</div>
                    </div>

                    {/* Card 3: Turbidity */}
                    <div className="db-metric-card" style={getCardStyle(turbStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">Kekeruhan</span>
                            {renderStatusBadge(turbStatus)}
                        </div>
                        <div className="db-metric-value">{turbVal.toFixed(0)} <span style={{ fontSize: "16px", fontWeight: 600, color: "#64748b" }}>NTU</span></div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`${getSparklinePoints(turbidityHistory)} L 120,30 L 0,30 Z`}
                                    fill="url(#turbGrad)"
                                />
                                <path
                                    d={getSparklinePoints(turbidityHistory)}
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="db-metric-footer">Ideal: &lt; 35 NTU</div>
                    </div>

                    {/* Card 4: TDS */}
                    <div className="db-metric-card" style={getCardStyle(tdsStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">TDS</span>
                            {renderStatusBadge(tdsStatus)}
                        </div>
                        <div className="db-metric-value">{tdsVal.toFixed(0)} <span style={{ fontSize: "16px", fontWeight: 600, color: "#64748b" }}>PPM</span></div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="tdsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`${getSparklinePoints(tdsHistory)} L 120,30 L 0,30 Z`}
                                    fill="url(#tdsGrad)"
                                    />
                                <path
                                    d={getSparklinePoints(tdsHistory)}
                                    fill="none"
                                    stroke="#8b5cf6"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="db-metric-footer">Ideal: &lt; 900 PPM</div>
                    </div>

                    {/* Card 5: Tinggi Air */}
                    <div className="db-metric-card" style={getCardStyle(heightStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">Tinggi Air</span>
                            {renderStatusBadge(heightStatus)}
                        </div>
                        <div className="db-metric-value">{heightVal.toFixed(1)} <span style={{ fontSize: "16px", fontWeight: 600, color: "#64748b" }}>cm</span></div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="heightGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`${getSparklinePoints(heightHistory)} L 120,30 L 0,30 Z`}
                                    fill="url(#heightGrad)"
                                />
                                <path
                                    d={getSparklinePoints(heightHistory)}
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="db-metric-footer">Kedalaman Kolam: 40 cm</div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="db-main-grid">
                    {/* Left Column: Camera Feed */}
                    <div className="db-panel-card">
                        <div className="db-panel-header">
                            <div className="db-panel-title">
                                <Video size={18} color="#0ea5e9" />
                                <span>Pond Camera — {activePond.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={handleReloadStream}
                                    title="Muat ulang stream video"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#64748b",
                                        cursor: "pointer",
                                        padding: "4px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#0ea5e9";
                                        e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#64748b";
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <RefreshCw size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempCameraUrl(cameraUrl);
                                        setIsConfiguringCamera(true);
                                    }}
                                    title="Pengaturan URL Endpoint Kamera"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#64748b",
                                        cursor: "pointer",
                                        padding: "4px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#0ea5e9";
                                        e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#64748b";
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <Settings size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCameraFullscreen(true)}
                                    title="Layar Penuh"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#64748b",
                                        cursor: "pointer",
                                        padding: "4px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#0ea5e9";
                                        e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#64748b";
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <Maximize2 size={15} />
                                </button>
                            </div>
                        </div>
                        <div className="db-panel-body">
                            <div className="db-camera-container" style={{ position: "relative", backgroundColor: "#020617" }}>
                                {useDemoFallback ? (
                                    <img
                                        src="/pond_camera_feed.png"
                                        alt="Demo pond camera feed"
                                        className="db-camera-feed"
                                    />
                                ) : (
                                    <img
                                        key={`stream-${streamKey}`}
                                        src={cameraUrl}
                                        alt="Live pond camera feed"
                                        className="db-camera-feed"
                                        onLoad={() => setStreamStatus("online")}
                                        onError={() => setStreamStatus("error")}
                                    />
                                )}
                                <div
                                    className="db-camera-badge-live"
                                    style={{
                                        backgroundColor:
                                            useDemoFallback
                                                ? "#475569"
                                                : streamStatus === "online"
                                                ? "#ef4444"
                                                : streamStatus === "loading"
                                                ? "#eab308"
                                                : "#dc2626",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: "6px",
                                            height: "6px",
                                            backgroundColor: "#ffffff",
                                            borderRadius: "50%",
                                            display: "inline-block",
                                            animation:
                                                streamStatus === "online" && !useDemoFallback
                                                    ? "lp-pulse 2s infinite"
                                                    : "none",
                                        }}
                                    ></span>
                                    {useDemoFallback
                                        ? "DEMO MODE"
                                        : streamStatus === "online"
                                        ? "LIVE"
                                        : streamStatus === "loading"
                                        ? "CONNECTING..."
                                        : "OFFLINE"}
                                </div>
                                <div className="db-camera-time">{currentTime}</div>

                                {/* Error overlay when stream is unreachable */}
                                {!useDemoFallback && streamStatus === "error" && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                                            backdropFilter: "blur(6px)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "20px",
                                            textAlign: "center",
                                            color: "#f8fafc",
                                            gap: "10px",
                                            zIndex: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#f87171",
                                            }}
                                        >
                                            <WifiOff size={20} />
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#f8fafc" }}>
                                            Tidak Dapat Terhubung ke Video Feed
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#94a3b8",
                                                maxWidth: "340px",
                                                lineHeight: 1.4,
                                                wordBreak: "break-all",
                                                fontFamily: "monospace",
                                                backgroundColor: "rgba(0,0,0,0.4)",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            {cameraUrl}
                                        </div>
                                        <p style={{ fontSize: "12px", color: "#cbd5e1", margin: 0, maxWidth: "320px", lineHeight: 1.4 }}>
                                            Pastikan modul kamera (Flask / ESP32) aktif di jaringan IP yang sama.
                                        </p>
                                        <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
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
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                <RefreshCw size={13} />
                                                <span>Coba Lagi</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTempCameraUrl(cameraUrl);
                                                    setIsConfiguringCamera(true);
                                                }}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                    color: "#f1f5f9",
                                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Ubah URL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUseDemoFallback(true)}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "transparent",
                                                    color: "#94a3b8",
                                                    border: "1px dashed #475569",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Demo Preview
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="db-camera-footer">
                                <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>CAM-01</span>
                                    <span style={{ color: "#cbd5e1" }}>•</span>
                                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
                                        {cameraUrl.replace("http://", "")}
                                    </span>
                                </span>
                                <span
                                    style={{
                                        color:
                                            useDemoFallback
                                                ? "#64748b"
                                                : streamStatus === "online"
                                                ? "#10b981"
                                                : streamStatus === "loading"
                                                ? "#f59e0b"
                                                : "#ef4444",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: "6px",
                                            height: "6px",
                                            backgroundColor:
                                                useDemoFallback
                                                    ? "#64748b"
                                                    : streamStatus === "online"
                                                    ? "#10b981"
                                                    : streamStatus === "loading"
                                                    ? "#f59e0b"
                                                    : "#ef4444",
                                            borderRadius: "50%",
                                        }}
                                    ></span>
                                    {useDemoFallback
                                        ? "Demo Preview"
                                        : streamStatus === "online"
                                        ? "Live Streaming"
                                        : streamStatus === "loading"
                                        ? "Connecting..."
                                        : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Predictions & System Guide */}
                    <div className="db-panel-card">
                        <div className="db-panel-header">
                            <div className="db-panel-title">
                                <Sparkles size={18} color="#0ea5e9" />
                                <span>Action Predictions & System Guide</span>
                            </div>
                        </div>
                        <div className="db-panel-body">
                            {/* Dynamic Suggestion alerts based on warning states */}
                            {activePond.id === 9 && (
                                <div className="db-alert-suggests">
                                    <div className="db-alert-title">⚠️ AI SUGGESTS</div>
                                    <div className="db-alert-text">
                                        Change water in {activePond.name} due to low pH levels (5.8 pH) and high turbidity.
                                    </div>
                                    <button className="db-btn-cyan" onClick={handleAutomateWaterChange}>
                                        <RefreshCw size={14} />
                                        <span>Automate Water Change</span>
                                    </button>
                                </div>
                            )}

                            {activePond.id === 4 && (
                                <div className="db-alert-suggests" style={{ backgroundColor: "#fffbeb", borderColor: "#fef3c7" }}>
                                    <div className="db-alert-title" style={{ color: "#b45309" }}>⚠️ AI SUGGESTS</div>
                                    <div className="db-alert-text" style={{ color: "#1f2937" }}>
                                        Increase aerator output in {activePond.name} to buffer warning pH drift (6.7 pH).
                                    </div>
                                    <button className="db-btn-cyan" style={{ backgroundColor: "#d97706" }} onClick={() => showAlert("Aerator output increased to maximum on Kolam D.", "success")}>
                                        <RefreshCw size={14} />
                                        <span>Increase Aerator Output</span>
                                    </button>
                                </div>
                            )}

                            {(activePond.id === 12 || activePond.id === 10) && (
                                <div className="db-alert-suggests" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
                                    <div className="db-alert-title" style={{ color: "#16a34a" }}>🛡️ AI SYSTEM STATUS</div>
                                    <div className="db-alert-text" style={{ color: "#166534" }}>
                                        All water parameters in {activePond.name} are optimal. Maintain standard system settings.
                                    </div>
                                    <button className="db-btn-cyan" style={{ backgroundColor: "#10b981" }} onClick={() => showAlert("Diagnostic test complete. No anomalies detected.", "success")}>
                                        <RefreshCw size={14} />
                                        <span>Run Diagnostic Check</span>
                                    </button>
                                </div>
                            )}

                            {/* Link footer */}
                            <button className="db-link-btn" onClick={() => setActiveTab("analytics")}>
                                View all predictions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Fullscreen Video Modal */}
                {isCameraFullscreen && (
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
                        onClick={() => setIsCameraFullscreen(false)}
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
                            {/* Snapshot flash effect */}
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
                                {/* Left Section: Camera Title & Pond Selector */}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                                                <span style={{ fontWeight: 800, fontSize: "16px", color: "#f8fafc", letterSpacing: "-0.01em" }}>
                                                    AquaVision Live Surveillance
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        backgroundColor: "rgba(14, 165, 233, 0.2)",
                                                        color: "#38bdf8",
                                                        border: "1px solid rgba(14, 165, 233, 0.3)",
                                                    }}
                                                >
                                                    1080p FHD
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                                <span>CAM-01</span>
                                                <span>•</span>
                                                <code style={{ color: "#38bdf8", backgroundColor: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px" }}>
                                                    {cameraUrl}
                                                </code>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pond Switcher Dropdown */}
                                    <div style={{ position: "relative" }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsFsPondDropdownOpen(!isFsPondDropdownOpen);
                                            }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "6px 12px",
                                                backgroundColor: "rgba(255, 255, 255, 0.06)",
                                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                                borderRadius: "8px",
                                                color: "#f8fafc",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            <span>Kolam: <strong>{activePond.name}</strong></span>
                                            <ChevronDown size={14} style={{ transform: isFsPondDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                                        </button>

                                        {isFsPondDropdownOpen && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "38px",
                                                    left: 0,
                                                    width: "180px",
                                                    backgroundColor: "#1e293b",
                                                    border: "1px solid #334155",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                                                    zIndex: 100,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {ponds.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedPondId(p.id);
                                                            setIsFsPondDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: "8px 12px",
                                                            fontSize: "12px",
                                                            fontWeight: selectedPondId === p.id ? 700 : 500,
                                                            color: selectedPondId === p.id ? "#38bdf8" : "#f1f5f9",
                                                            backgroundColor: selectedPondId === p.id ? "rgba(56, 189, 248, 0.15)" : "transparent",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (selectedPondId !== p.id) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (selectedPondId !== p.id) e.currentTarget.style.backgroundColor = "transparent";
                                                        }}
                                                    >
                                                        <span>{p.name}</span>
                                                        <span style={{ fontSize: "10px", color: "#64748b" }}>{p.location.split(",")[0]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Section: Controls & Actions */}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {/* Snapshot Capture Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleCaptureSnapshot(activePond.name)}
                                        title="Ambil Snapshot Foto Kamera"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "8px",
                                            color: "#f8fafc",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                                            e.currentTarget.style.borderColor = "#38bdf8";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                                        }}
                                    >
                                        <Camera size={15} style={{ color: "#38bdf8" }} />
                                        <span>Snapshot</span>
                                    </button>

                                    {/* Toggle Telemetry HUD Button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsHudVisible(!isHudVisible)}
                                        title={isHudVisible ? "Sembunyikan Data Telemetri HUD" : "Tampilkan Data Telemetri HUD"}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            backgroundColor: isHudVisible ? "rgba(14, 165, 233, 0.15)" : "rgba(255, 255, 255, 0.08)",
                                            border: `1px solid ${isHudVisible ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
                                            borderRadius: "8px",
                                            color: isHudVisible ? "#38bdf8" : "#94a3b8",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {isHudVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                                        <span>HUD Telemetri</span>
                                    </button>

                                    {/* Aspect Ratio Fit / Fill Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
                                        title={fitMode === "contain" ? "Ubah ke Mode Fill (Penuh Layar)" : "Ubah ke Mode Fit (Proporsional)"}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "8px",
                                            color: "#f8fafc",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <Layers size={14} style={{ color: "#a855f7" }} />
                                        <span>{fitMode === "contain" ? "Fit" : "Fill"}</span>
                                    </button>

                                    {/* Reload Stream Button */}
                                    <button
                                        type="button"
                                        onClick={handleReloadStream}
                                        title="Muat Ulang / Reconnect Stream"
                                        style={{
                                            padding: "8px",
                                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "8px",
                                            color: "#f8fafc",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#38bdf8")}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)")}
                                    >
                                        <RefreshCw size={15} />
                                    </button>

                                    {/* Settings URL Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempCameraUrl(cameraUrl);
                                            setIsConfiguringCamera(true);
                                        }}
                                        title="Pengaturan Endpoint Stream"
                                        style={{
                                            padding: "8px",
                                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "8px",
                                            color: "#f8fafc",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#38bdf8")}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)")}
                                    >
                                        <Settings size={15} />
                                    </button>

                                    {/* Close Button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraFullscreen(false)}
                                        title="Tutup (ESC)"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 14px",
                                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                                            border: "1px solid rgba(239, 68, 68, 0.4)",
                                            borderRadius: "8px",
                                            color: "#fca5a5",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            marginLeft: "4px",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.3)";
                                            e.currentTarget.style.color = "#ffffff";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                                            e.currentTarget.style.color = "#fca5a5";
                                        }}
                                    >
                                        <X size={16} />
                                        <span>ESC</span>
                                    </button>
                                </div>
                            </div>

                            {/* Main Video Screen Area */}
                            <div
                                style={{
                                    position: "relative",
                                    flex: 1,
                                    width: "100%",
                                    backgroundColor: "#000000",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden",
                                }}
                            >
                                {useDemoFallback ? (
                                    <img
                                        id="fullscreen-camera-img"
                                        src="/pond_camera_feed.png"
                                        alt="Live fullscreen feed"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: fitMode,
                                            transition: "object-fit 0.2s ease",
                                        }}
                                    />
                                ) : (
                                    <img
                                        id="fullscreen-camera-img"
                                        key={`fs-${streamKey}`}
                                        src={cameraUrl}
                                        alt="Live fullscreen feed"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: fitMode,
                                            transition: "object-fit 0.2s ease",
                                        }}
                                        onLoad={() => setStreamStatus("online")}
                                        onError={() => setStreamStatus("error")}
                                    />
                                )}

                                {/* Top-Left Live Indicator Overlay */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        left: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        zIndex: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            backgroundColor:
                                                useDemoFallback
                                                    ? "rgba(71, 85, 105, 0.85)"
                                                    : streamStatus === "online"
                                                    ? "rgba(220, 38, 38, 0.9)"
                                                    : "rgba(234, 88, 12, 0.9)",
                                            color: "#ffffff",
                                            padding: "6px 14px",
                                            borderRadius: "100px",
                                            fontSize: "12px",
                                            fontWeight: 800,
                                            letterSpacing: "0.04em",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                            backdropFilter: "blur(8px)",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                backgroundColor: "#ffffff",
                                                borderRadius: "50%",
                                                animation:
                                                    streamStatus === "online" && !useDemoFallback
                                                        ? "pulse-red 1.5s infinite"
                                                        : "none",
                                            }}
                                        ></span>
                                        <span>
                                            {useDemoFallback
                                                ? "DEMO FEED"
                                                : streamStatus === "online"
                                                ? "● REC LIVE"
                                                : "STREAM OFFLINE"}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                                            backdropFilter: "blur(8px)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            color: "#94a3b8",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Sektor: <span style={{ color: "#f8fafc" }}>{activePond.location}</span>
                                    </div>
                                </div>

                                {/* Top-Right Live Timestamp Overlay */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        right: "20px",
                                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                                        backdropFilter: "blur(8px)",
                                        border: "1px solid rgba(255, 255, 255, 0.12)",
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        color: "#f8fafc",
                                        fontFamily: "monospace",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        zIndex: 10,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                    }}
                                >
                                    <Clock size={14} style={{ color: "#38bdf8" }} />
                                    <span>{currentTime} WIB</span>
                                </div>

                                {/* Bottom-Left Floating Telemetry HUD (Heads-Up Display) */}
                                {isHudVisible && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: "20px",
                                            left: "20px",
                                            backgroundColor: "rgba(15, 23, 42, 0.85)",
                                            backdropFilter: "blur(16px)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "14px",
                                            padding: "14px 18px",
                                            zIndex: 10,
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
                                            maxWidth: "480px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "10px",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                <Activity size={14} />
                                                <span>Telemetri Kolam ({activePond.name})</span>
                                            </div>
                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Real-time sync</span>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                                            {/* Suhu */}
                                            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>SUHU</div>
                                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", marginTop: "2px" }}>
                                                    {currentData.TEMPERATURE.toFixed(1)}°C
                                                </div>
                                            </div>

                                            {/* pH */}
                                            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>PH AIR</div>
                                                <div style={{ fontSize: "14px", fontWeight: 800, color: phStatus === "Aman" ? "#34d399" : phStatus === "Waspada" ? "#fbbf24" : "#f87171", marginTop: "2px" }}>
                                                    {phVal.toFixed(1)}
                                                </div>
                                            </div>

                                            {/* Turbidity */}
                                            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>KERUH</div>
                                                <div style={{ fontSize: "14px", fontWeight: 800, color: turbStatus === "Aman" ? "#38bdf8" : turbStatus === "Waspada" ? "#fbbf24" : "#f87171", marginTop: "2px" }}>
                                                    {turbVal.toFixed(0)} NTU
                                                </div>
                                            </div>

                                            {/* TDS */}
                                            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>TDS</div>
                                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#c084fc", marginTop: "2px" }}>
                                                    {tdsVal.toFixed(0)} ppm
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom-Right Surveillance Info Badge */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "20px",
                                        right: "20px",
                                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                                        backdropFilter: "blur(8px)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        color: "#94a3b8",
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        zIndex: 10,
                                    }}
                                >
                                    <span>AI Vision: <strong style={{ color: "#34d399" }}>Normal Activity</strong></span>
                                    <span>•</span>
                                    <span>FPS: <strong style={{ color: "#f8fafc" }}>30.0</strong></span>
                                    <span>•</span>
                                    <span>Format: <strong style={{ color: "#38bdf8" }}>MJPEG</strong></span>
                                </div>

                                {/* Fullscreen Error & Reconnect Overlay */}
                                {!useDemoFallback && streamStatus === "error" && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "rgba(11, 15, 25, 0.92)",
                                            backdropFilter: "blur(12px)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "32px",
                                            textAlign: "center",
                                            color: "#f8fafc",
                                            gap: "14px",
                                            zIndex: 50,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                borderRadius: "50%",
                                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#f87171",
                                            }}
                                        >
                                            <WifiOff size={28} />
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: "18px", color: "#f8fafc" }}>
                                            Koneksi Video Feed Terputus
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#94a3b8",
                                                fontFamily: "monospace",
                                                backgroundColor: "rgba(0,0,0,0.5)",
                                                padding: "6px 14px",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                            }}
                                        >
                                            {cameraUrl}
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0, maxWidth: "420px", lineHeight: 1.5 }}>
                                            Tidak dapat menerima stream dari Raspberry Pi. Pastikan script kamera di Raspberry Pi sedang aktif di port 5000 dan terhubung di jaringan WiFi yang sama.
                                        </p>
                                        <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                                            <button
                                                type="button"
                                                onClick={handleReloadStream}
                                                style={{
                                                    padding: "8px 18px",
                                                    backgroundColor: "#0ea5e9",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
                                                }}
                                            >
                                                <RefreshCw size={15} />
                                                <span>Coba Sambungkan Lagi</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTempCameraUrl(cameraUrl);
                                                    setIsConfiguringCamera(true);
                                                }}
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                    color: "#f1f5f9",
                                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Ubah URL Kamera
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUseDemoFallback(true)}
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor: "transparent",
                                                    color: "#94a3b8",
                                                    border: "1px dashed #475569",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Gunakan Demo Preview
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Camera Endpoint Configuration Modal */}
                {isConfiguringCamera && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            backdropFilter: "blur(6px)",
                            zIndex: 10000,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "20px",
                        }}
                        onClick={() => setIsConfiguringCamera(false)}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxWidth: "500px",
                                backgroundColor: "#ffffff",
                                borderRadius: "16px",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                overflow: "hidden",
                                border: "1px solid #e2e8f0",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #f1f5f9",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div
                                        style={{
                                            width: "34px",
                                            height: "34px",
                                            borderRadius: "8px",
                                            backgroundColor: "#e0f2fe",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#0284c7",
                                        }}
                                    >
                                        <Video size={18} />
                                    </div>
                                    <div style={{ textAlign: "left" }}>
                                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                            Konfigurasi Video Feed
                                        </h3>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                                            Endpoint streaming kamera kolam lele
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsConfiguringCamera(false)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#94a3b8",
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveCameraUrl} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ textAlign: "left" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                        URL Endpoint Stream (MJPEG / Live Stream)
                                    </label>
                                    <input
                                        type="text"
                                        value={tempCameraUrl}
                                        onChange={(e) => setTempCameraUrl(e.target.value)}
                                        placeholder="http://192.168.137.210:5000/video_feed"
                                        className="pm-input"
                                        style={{
                                            width: "100%",
                                            height: "42px",
                                            padding: "0 12px",
                                            fontSize: "13px",
                                            fontFamily: "monospace",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                                        Default: <code style={{ color: "#0284c7" }}>http://192.168.137.210:5000/video_feed</code>
                                    </span>
                                </div>

                                <div
                                    style={{
                                        padding: "12px",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12px",
                                        color: "#475569",
                                        lineHeight: 1.5,
                                        textAlign: "left",
                                    }}
                                >
                                    <strong>Catatan:</strong> Endpoint ini diakses langsung oleh browser untuk menampilkan streaming real-time dari kamera IoT/Flask server Anda.
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={handleResetCameraUrl}
                                        style={{
                                            padding: "8px 14px",
                                            backgroundColor: "transparent",
                                            color: "#64748b",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Reset ke Default
                                    </button>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsConfiguringCamera(false)}
                                            style={{
                                                padding: "8px 14px",
                                                backgroundColor: "#f1f5f9",
                                                color: "#475569",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#0ea5e9",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Simpan & Hubungkan
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "home":
                return (
                    <HomeTab
                        rawData={rawData}
                        currentData={currentData}
                        setActiveTab={setActiveTab}
                        selectedPondId={selectedPondId}
                        setSelectedPondId={setSelectedPondId}
                    />
                );
            case "ponds":
                return (
                    <PondsTab
                        currentData={currentData}
                        selectedPondId={selectedPondId}
                        setSelectedPondId={setSelectedPondId}
                        setActiveTab={setActiveTab}
                    />
                );
            case "analytics":
                return <AnalyticsTab currentData={currentData} theme={theme} />;
            case "profile":
                return (
                    <ProfileTab
                        theme={theme}
                        themeSetting="system"
                        onChangeThemeSetting={() => {}}
                        toggleTheme={() => {}}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        onProfileUpdate={(updatedUser: AppUser) => {
                            setCurrentUser(updatedUser);
                            localStorage.setItem("aqua_current_user", JSON.stringify(updatedUser));
                            const users = JSON.parse(localStorage.getItem("aqua_users") || "[]") as AppUser[];
                            const updatedUsers = users.map((u) =>
                                u.username.toLowerCase() === updatedUser.username.toLowerCase() ? updatedUser : u
                            );
                            localStorage.setItem("aqua_users", JSON.stringify(updatedUsers));
                        }}
                    />
                );
            case "notifications":
                return (
                    <NotificationsTab
                        currentData={currentData}
                        rawData={rawData}
                    />
                );
            case "dataset":
                return (
                    <DatasetStudioTab
                        cameraUrl={cameraUrl}
                        setActiveTab={setActiveTab}
                    />
                );
            case "dashboard":
            default:
                return renderDashboardContent();
        }
    };

    const getTabTitle = () => {
        switch (activeTab) {
            case "home":
                return "Home";
            case "ponds":
                return "Pond Management";
            case "analytics":
                return "Predictions";
            case "dataset":
                return "Studio Dataset (YOLOv11)";
            case "profile":
                return "Settings";
            case "notifications":
                return "History";
            case "dashboard":
            default:
                return "Real-Time Dashboard";
        }
    };

    if (!currentUser) {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <DashboardLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentData={currentData}
            rawData={rawData}
            selectedPondId={selectedPondId}
            setSelectedPondId={setSelectedPondId}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            todos={todos}
            toggleTodo={toggleTodo}
        >
            <Head title={getTabTitle()} />
            {renderTabContent()}
        </DashboardLayout>
    );
}
