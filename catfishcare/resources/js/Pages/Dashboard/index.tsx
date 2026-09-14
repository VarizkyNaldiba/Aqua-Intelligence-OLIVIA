import { useState, useEffect } from "react";
import { ChevronDown, Info } from "lucide-react";
import { usePage } from "@inertiajs/react";
import type { SensorRow, TabName, AppUser } from "@/Types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import MetricCardsGrid from "./MetricCardsGrid";
import TelemetryChartsSection from "./TelemetryChartsSection";
import CameraWidget from "./CameraWidget";
import FullscreenCameraModal from "./FullscreenCameraModal";
import AiRecommendationWidget from "./AiRecommendationWidget";

import DiagnosticModal from "./DiagnosticModal";

// Sub-page re-exports for modular menu routing
import PondsPage from "@/Pages/Ponds";
import ActuatorsPage from "@/Pages/Actuators";
import AnalyticsPage from "@/Pages/Analytics";
import DatasetStudioPage from "@/Pages/DatasetStudio";
import NotificationsPage from "@/Pages/Notifications";
import HistoryPage from "@/Pages/History/index";
import ProfilePage from "@/Pages/Profile";
import UserManagementPage from "@/Pages/UserManagement";
import ActivityLogsTabPage from "@/Pages/ActivityLogsTab";

const DEFAULT_CAMERA_URL = "http://192.168.1.100:8080/video";

interface DashboardProps {
    initialSensorData: SensorRow[];
    currentUser?: AppUser | null;
    initialTab?: TabName;
}

export default function Dashboard({ initialSensorData = [], currentUser: propUser, initialTab = "dashboard" }: DashboardProps) {
    const pageProps = usePage<{ auth?: { user?: AppUser } }>().props;
    const userFromStorage: AppUser | null = (() => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem("aqua_current_user");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    })();
    const currentUser = propUser || pageProps.auth?.user || userFromStorage || null;

    const isAdmin = currentUser?.role === "admin" || currentUser?.username === "admin";

    const [activeTab, setActiveTab] = useState<TabName>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get("tab") as TabName;
            if (tabParam) return tabParam;
        }
        if (isAdmin) return "user_management";
        return initialTab;
    });

    const [sensorRows, setSensorRows] = useState<SensorRow[]>(initialSensorData);
    const [selectedPondId, setSelectedPondId] = useState<number>(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(true);

    const [alert, setAlert] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });
    const showAlert = (message: string, type: "success" | "error" = "success") => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: "", type: "success" }), 4000);
    };

    // Camera settings state
    const [cameraUrl, setCameraUrl] = useState<string>(() => {
        return localStorage.getItem("catfish_camera_url") || DEFAULT_CAMERA_URL;
    });
    const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
    const [isConfiguringCamera, setIsConfiguringCamera] = useState(false);
    const [tempCameraUrl, setTempCameraUrl] = useState(cameraUrl);

    // Dynamic ponds list from localStorage
    const [ponds, setPonds] = useState(() => {
        try {
            const saved = localStorage.getItem("catfish_ponds_list");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return [
            { id: 1, name: "Kolam TFS 1", location: "Riset IoT TFS", status: "Optimal" },
            { id: 2, name: "Kolam Bioflok 2", location: "Sektor Utara", status: "Optimal" },
            { id: 3, name: "Kolam Pembibitan 3", location: "Sektor Barat", status: "Optimal" },
            { id: 4, name: "Kolam Karantina 4", location: "Isolasi", status: "Waspada" },
        ];
    });

    useEffect(() => {
        const updatePonds = () => {
            try {
                const saved = localStorage.getItem("catfish_ponds_list");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) setPonds(parsed);
                }
            } catch {}
        };
        window.addEventListener("ponds_updated", updatePonds);
        return () => window.removeEventListener("ponds_updated", updatePonds);
    }, []);

    // Load historical data on mount & when pond changes
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/telemetry/history/${selectedPondId}`);
                if (res.ok) {
                    const data = await res.json();
                    // API returns { history: [...] } sorted newest-first; reverse for chart (oldest-first)
                    const rows = Array.isArray(data.history) ? [...data.history].reverse() : [];
                    if (rows.length > 0) {
                        setSensorRows(rows);
                    }
                }
            } catch {}
        };
        fetchHistory();
    }, [selectedPondId]);

    // Live Telemetry Polling (every 5 seconds)
    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                const res = await fetch(`/api/telemetry/latest/${selectedPondId}`);
                if (res.ok) {
                    const data = await res.json();
                    // API returns { telemetry: { suhu, ph, kekeruhan, tds, tinggi_air, updated_at } }
                    const raw = data.telemetry || data.data;
                    if (raw) {
                        const mapped: SensorRow = {
                            TEMPERATURE: parseFloat(raw.suhu ?? raw.TEMPERATURE ?? 27.5),
                            pH: parseFloat(raw.ph ?? raw.pH ?? 6.8),
                            TURBIDITY: parseFloat(raw.kekeruhan ?? raw.TURBIDITY ?? 12.0),
                            NITRATE: parseFloat(raw.tds ?? raw.NITRATE ?? 288),
                            Length: parseFloat(raw.tinggi_air ?? raw.Length ?? 46.4),
                            created_at: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
                        };
                        setSensorRows((prev) => [...prev.slice(-99), mapped]);
                        setIsLiveActive(true);
                    }
                }
            } catch {
                setIsLiveActive(false);
            }
        };
        const interval = setInterval(fetchTelemetry, 5000);
        return () => clearInterval(interval);
    }, [selectedPondId]);

    const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[0];
    const currentData = sensorRows[sensorRows.length - 1] || {
        id: 1,
        TEMPERATURE: 28.5,
        pH: 6.8,
        TURBIDITY: 12.0,
        NITRATE: 288,
        Length: 46.4,
        created_at: new Date().toISOString(),
    };

    const handleSaveCameraUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanUrl = tempCameraUrl.trim() || DEFAULT_CAMERA_URL;
        setCameraUrl(cleanUrl);
        localStorage.setItem("catfish_camera_url", cleanUrl);
        setIsConfiguringCamera(false);
        showAlert("Endpoint kamera berhasil diperbarui!", "success");
    };

    const renderMainTabContent = () => {
        switch (activeTab) {
            case "ponds":
                return <PondsPage />;
            case "actuators":
                return <ActuatorsPage currentData={currentData} rawData={sensorRows} />;
            case "analytics":
                return <AnalyticsPage currentData={currentData} rawData={sensorRows} />;
            case "dataset":
                return <DatasetStudioPage initialCameraUrl={cameraUrl} />;
            case "history":
                return <HistoryPage currentData={currentData} rawData={sensorRows} />;
            case "notifications":
                return <NotificationsPage currentData={currentData} rawData={sensorRows} />;
            case "profile":
                return <ProfilePage currentUser={currentUser} cameraUrl={cameraUrl} setCameraUrl={setCameraUrl} />;
            case "user_management":
                return <UserManagementPage currentUser={currentUser} />;
            case "activity_logs":
                return <ActivityLogsTabPage currentUser={currentUser} />;
            case "dashboard":
            default:
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {/* Heading Area with Pond Selection Dropdown & ESP32 Live Badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                            <div>
                                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                    Real-Time Dashboard
                                </h2>
                                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    Live catfish pond telemetry & automated control
                                </p>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Kolam:</span>
                                <div style={{ position: "relative" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        style={{
                                            padding: "8px 14px",
                                            backgroundColor: "#ffffff",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            fontWeight: 700,
                                            fontSize: "13px",
                                            color: "#0f172a",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <span>{activePond.name}</span>
                                        <ChevronDown size={16} style={{ color: "#64748b" }} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "42px",
                                                left: 0,
                                                width: "180px",
                                                backgroundColor: "#ffffff",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "8px",
                                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                                                zIndex: 1000,
                                                overflow: "hidden",
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
                                                    }}
                                                >
                                                    {p.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        backgroundColor: isLiveActive ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                                        color: isLiveActive ? "#10b981" : "#94a3b8",
                                        border: `1px solid ${isLiveActive ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.2)"}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: "7px",
                                            height: "7px",
                                            borderRadius: "50%",
                                            backgroundColor: isLiveActive ? "#10b981" : "#94a3b8",
                                            display: "inline-block",
                                        }}
                                    />
                                    {isLiveActive ? "ESP32 LIVE" : "ESP32 OFFLINE"}
                                </span>
                            </div>
                        </div>

                        {/* Alert notification banner if active */}
                        {alert.message && (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    backgroundColor: alert.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                    border: `1px solid ${alert.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                    color: alert.type === "success" ? "#047857" : "#b91c1c",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                }}
                            >
                                <Info size={18} />
                                <span>{alert.message}</span>
                            </div>
                        )}

                        {/* ROW 1: Left = Historical Chart (wider), Right = Vertical Parameter Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "20px", alignItems: "start" }}>
                            <TelemetryChartsSection rawData={sensorRows} />
                            <MetricCardsGrid currentData={currentData} />
                        </div>

                        {/* ROW 2: Left = Pond Camera (~55%), Right = Action Predictions & System Guide (~45%) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "stretch" }}>
                            {/* Left Column: Pond Camera Preview */}
                            <CameraWidget
                                cameraUrl={cameraUrl}
                                activePondName={activePond.name}
                                onOpenFullscreen={() => setIsCameraFullscreen(true)}
                                onOpenSettings={() => {
                                    setTempCameraUrl(cameraUrl);
                                    setIsConfiguringCamera(true);
                                }}
                            />

                            {/* Right Column: Action Predictions & System Guide */}
                            <AiRecommendationWidget
                                currentData={currentData}
                                selectedPondId={selectedPondId}
                                showAlert={showAlert}
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <DashboardLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentData={currentData}
            rawData={sensorRows}
            selectedPondId={selectedPondId}
            setSelectedPondId={setSelectedPondId}
            currentIndex={0}
            setCurrentIndex={() => {}}
            isPlaying={false}
            setIsPlaying={() => {}}
            todos={[]}
            toggleTodo={() => {}}
            currentUser={currentUser}
        >
            {renderMainTabContent()}

            {/* Fullscreen Video Modal */}
            <FullscreenCameraModal
                isOpen={isCameraFullscreen}
                onClose={() => setIsCameraFullscreen(false)}
                cameraUrl={cameraUrl}
                activePondName={activePond.name}
                currentData={currentData}
                onOpenSettings={() => {
                    setTempCameraUrl(cameraUrl);
                    setIsConfiguringCamera(true);
                }}
                showAlert={showAlert}
            />

            {/* Camera Endpoint Settings Modal */}
            {isConfiguringCamera && (
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
                    onClick={() => setIsConfiguringCamera(false)}
                >
                    <form
                        onSubmit={handleSaveCameraUrl}
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "480px",
                            padding: "24px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0" }}>
                            Pengaturan Endpoint Stream Kamera
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
                            Masukkan URL IP Camera / Raspberry Pi MJPEG stream
                        </p>

                        <input
                            type="text"
                            value={tempCameraUrl}
                            onChange={(e) => setTempCameraUrl(e.target.value)}
                            placeholder="http://192.168.1.100:8080/video"
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                marginBottom: "20px",
                            }}
                        />

                        <div style={{ display: "flex", justifyRight: "flex-end", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => setIsConfiguringCamera(false)}
                                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#0ea5e9", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                            >
                                Simpan Endpoint
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </DashboardLayout>
    );
}
