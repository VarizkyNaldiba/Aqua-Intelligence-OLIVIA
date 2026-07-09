import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    ArrowUpRight,
    ArrowDownRight,
    Video,
    Sparkles,
    RefreshCw,
    Clock,
    Maximize2,
    Info,
    ChevronDown,
    X,
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
    
    const [selectedPondId, setSelectedPondId] = useState(9);
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
    } = useSensorData(selectedPondId);

    const [alert, setAlert] = useState({ message: "", type: "" });
    const [todos, setTodos] = useState<TodoItem[]>([
        { id: 1, text: "Kuras air kolam A", checked: false },
        { id: 2, text: "Beri pakan jam 10 malam", checked: false },
    ]);
    const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);

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

    const handleAutomateWaterChange = () => {
        showAlert("Automating water change in Pond A. Valves opening...", "success");
    };

    const handleDispenseFeedNow = () => {
        showAlert("Feeding sequence initiated. Dispensing 5kg of pellets...", "success");
    };

    const renderDashboardContent = () => {
        if (!currentData) {
            return (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h2>Memuat data IoT...</h2>
                </div>
            );
        }

        // Mapping ponds with warning priorities as defined in mockup
        const ponds = [
            { id: 9, name: "Pond 09", location: "Sektor Selatan, Blok 1", status: "Bahaya (Tidak Ideal)" },
            { id: 4, name: "Pond 04", location: "Sektor Selatan, Blok 2", status: "Waspada (Tidak Ideal)" },
            { id: 12, name: "Pond 12", location: "Sektor Utara, Blok 1", status: "Aman" },
            { id: 10, name: "Pond 10", location: "Sektor Utara, Blok 2", status: "Aman" },
        ];

        const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[0];

        // Get limited history array for sparkline plotting (last 15 entries)
        const sparklineHistory = latestRows.slice(-15);
        const phHistory = sparklineHistory.map((r) => r.pH);
        const turbidityHistory = sparklineHistory.map((r) => r.TURBIDITY);
        
        // Mock TDS and Water Height dynamic histories
        const tdsHistory = sparklineHistory.map((r) => r.pH * 130);
        const heightHistory = sparklineHistory.map((r) => 100 + r.TEMPERATURE * 0.2);

        // Helper to check parameter statuses
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
            if (height >= 95 && height <= 105) return "Aman";
            if (height >= 90 && height <= 110) return "Waspada";
            return "Bahaya";
        };

        const getCardStyle = (status: "Aman" | "Waspada" | "Bahaya") => {
            switch (status) {
                case "Aman":
                    return {
                        backgroundColor: "#f0fdf4",
                        borderColor: "#bbf7d0",
                        transition: "all 0.3s ease",
                    };
                case "Waspada":
                    return {
                        backgroundColor: "#fffbeb",
                        borderColor: "#fef3c7",
                        transition: "all 0.3s ease",
                    };
                case "Bahaya":
                    return {
                        backgroundColor: "#fef2f2",
                        borderColor: "#fee2e2",
                        transition: "all 0.3s ease",
                    };
            }
        };

        const phVal = currentData.pH;
        const turbVal = currentData.TURBIDITY;
        const tdsVal = currentData.pH * 130;
        const heightVal = 100 + currentData.TEMPERATURE * 0.2;

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
                    {/* Card 1: pH Air */}
                    <div className="db-metric-card" style={getCardStyle(phStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">PH Air</span>
                            <span className="db-metric-badge down">
                                <ArrowDownRight size={11} /> 1%
                            </span>
                        </div>
                        <div className="db-metric-value">{currentData.pH.toFixed(1)} pH</div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
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
                        <div className="db-metric-footer">vs. yesterday</div>
                    </div>

                    {/* Card 2: Turbidity */}
                    <div className="db-metric-card" style={getCardStyle(turbStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">Turbidity</span>
                            <span className="db-metric-badge up">
                                <ArrowUpRight size={11} /> 5%
                            </span>
                        </div>
                        <div className="db-metric-value">{currentData.TURBIDITY.toFixed(0)} NTU</div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
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
                        <div className="db-metric-footer">vs. yesterday</div>
                    </div>

                    {/* Card 3: TDS */}
                    <div className="db-metric-card" style={getCardStyle(tdsStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">TDS</span>
                            <span className="db-metric-badge up">
                                <ArrowUpRight size={11} /> 3%
                            </span>
                        </div>
                        <div className="db-metric-value">{(currentData.pH * 130).toFixed(0)} PPM</div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="tdsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
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
                        <div className="db-metric-footer">vs. yesterday</div>
                    </div>

                    {/* Card 4: Tinggi Air */}
                    <div className="db-metric-card" style={getCardStyle(heightStatus)}>
                        <div className="db-metric-card-header">
                            <span className="db-metric-label">Tinggi Air</span>
                            <span className="db-metric-badge down">
                                <ArrowDownRight size={11} /> 2%
                            </span>
                        </div>
                        <div className="db-metric-value">{(100 + currentData.TEMPERATURE * 0.2).toFixed(0)} cm</div>
                        <div className="db-metric-chart">
                            <svg viewBox="0 0 120 30" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                    <linearGradient id="heightGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`${getSparklinePoints(heightHistory)} L 120,30 L 0,30 Z`}
                                    fill="url(#heightGrad)"
                                />
                                <path
                                    d={getSparklinePoints(heightHistory)}
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="db-metric-footer">vs. yesterday</div>
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
                            <Maximize2 
                                size={16} 
                                style={{ color: "#94a3b8", cursor: "pointer" }} 
                                onClick={() => setIsCameraFullscreen(true)}
                            />
                        </div>
                        <div className="db-panel-body">
                            <div className="db-camera-container">
                                <img
                                    src="/pond_camera_feed.png"
                                    alt="Live pond camera feed"
                                    className="db-camera-feed"
                                />
                                <div className="db-camera-badge-live">
                                    <span
                                        style={{
                                            width: "6px",
                                            height: "6px",
                                            backgroundColor: "#ffffff",
                                            borderRadius: "50%",
                                            display: "inline-block",
                                            animation: "lp-pulse 2s infinite",
                                        }}
                                    ></span>
                                    LIVE
                                </div>
                                <div className="db-camera-time">{currentTime}</div>
                            </div>
                            <div className="db-camera-footer">
                                <span>Camera CAM-01 - 1080p</span>
                                <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }}></span>
                                    Streaming
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Predictions & Feeding Guide */}
                    <div className="db-panel-card">
                        <div className="db-panel-header">
                            <div className="db-panel-title">
                                <Sparkles size={18} color="#0ea5e9" />
                                <span>Action Predictions & Feeding Guide</span>
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
                                        All water parameters in {activePond.name} are optimal. Maintain standard feeding schedule.
                                    </div>
                                    <button className="db-btn-cyan" style={{ backgroundColor: "#10b981" }} onClick={() => showAlert("Diagnostic test complete. No anomalies detected.", "success")}>
                                        <RefreshCw size={14} />
                                        <span>Run Diagnostic Check</span>
                                    </button>
                                </div>
                            )}

                            {/* Feed schedule */}
                            <div className="db-schedule-card">
                                <div className="db-schedule-title">FEED SCHEDULE</div>
                                <div className="db-schedule-text">
                                    Next feeding at 10:00 AM — 5kg of pellets for {activePond.name}.
                                </div>
                                <button className="db-btn-outline-teal" onClick={handleDispenseFeedNow}>
                                    <span> Dispense Feed Now</span>
                                </button>
                            </div>

                            {/* Link footer */}
                            <button className="db-link-btn" onClick={() => setActiveTab("analytics")}>
                                View all predictions
                            </button>
                        </div>
                    </div>
                </div>

                {isCameraFullscreen && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            backdropFilter: "blur(12px)",
                            zIndex: 9999,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "24px",
                        }}
                        onClick={() => setIsCameraFullscreen(false)}
                    >
                        <div
                            style={{
                                width: "90%",
                                maxWidth: "960px",
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "16px",
                                overflow: "hidden",
                                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                                display: "flex",
                                flexDirection: "column",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #334155" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f8fafc" }}>
                                    <Video size={20} style={{ color: "#38bdf8" }} />
                                    <span style={{ fontWeight: 700, fontSize: "16px" }}>Pond Camera — {activePond.name} (Fullscreen)</span>
                                </div>
                                <button
                                    onClick={() => setIsCameraFullscreen(false)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#94a3b8",
                                        cursor: "pointer",
                                        padding: "6px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                                        e.currentTarget.style.color = "#ffffff";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#94a3b8";
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#000000" }}>
                                <img
                                    src="/pond_camera_feed.png"
                                    alt="Live fullscreen feed"
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                                <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#ef4444", color: "#ffffff", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                                    <span style={{ width: "6px", height: "6px", backgroundColor: "#ffffff", borderRadius: "50%", animation: "pulse-red 2s infinite" }}></span>
                                    <span>LIVE</span>
                                </div>
                                <div style={{ position: "absolute", bottom: "16px", right: "16px", color: "rgba(255, 255, 255, 0.7)", backgroundColor: "rgba(0, 0, 0, 0.5)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                                    {currentTime}
                                </div>
                            </div>
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
