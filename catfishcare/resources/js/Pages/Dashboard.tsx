import { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import MetricCharts from "@/Components/MetricCharts";
import Timeline from "@/Components/Timeline";
import MetricMiniCard from "@/Components/MetricMiniCard";
import { Button } from "@/Components/ui";
import HomeTab from "@/Pages/Home";
import PondsTab from "@/Pages/Ponds";
import AnalyticsTab from "@/Pages/Analytics";
import ProfileTab from "@/Pages/Profile";
import Auth from "@/Pages/Login";
import {
    AlertTriangle,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
} from "lucide-react";
import type { TabName, MetricType, AppUser, StatusInfo } from "@/Types";
import { useSensorData } from "@/Hooks/useSensorData";
import { useTheme } from "@/Hooks/useTheme";
import { getPondStatus } from "@/Utils/statusLogic";

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
    };

    const [activeTab, setActiveTab] = useState<TabName>("dashboard");
    const [selectedPondId, setSelectedPondId] = useState(12);
    const [currentMetricType, setCurrentMetricType] =
        useState<MetricType>("DO");

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

    const statusInfo = getPondStatus(currentData, selectedPondId);

    const getStatusIcon = (type: StatusInfo["type"]) => {
        switch (type) {
            case "danger":
                return <AlertCircle size={24} />;
            case "warning":
                return <AlertTriangle size={24} />;
            default:
                return <CheckCircle2 size={24} />;
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

        return (
            <>
                {/* Status Alert Banner */}
                <div className={`status-banner ${statusInfo.type}`}>
                    <div className="status-banner-content">
                        {getStatusIcon(statusInfo.type)}
                        <div>
                            <h4>{statusInfo.title}</h4>
                            <p>{statusInfo.text}</p>
                        </div>
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.8 }}>
                        Waktu Sensor: {currentData.created_at}
                    </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="metrics-summary">
                    <MetricMiniCard
                        label="DO (Oxygen)"
                        value={`${currentData.DO.toFixed(2)} mg/L`}
                        status={currentData.DO <= 2 ? "danger" : "success"}
                    />
                    <MetricMiniCard
                        label="Ammonia (NH3)"
                        value={currentData.AMMONIA.toFixed(5)}
                        status={
                            currentData.AMMONIA > 0.0005 ? "danger" : "success"
                        }
                    />
                    <MetricMiniCard
                        label="Suhu Air"
                        value={`${currentData.TEMPERATURE.toFixed(2)}°C`}
                        status={
                            currentData.TEMPERATURE < 27.05
                                ? "warning"
                                : "success"
                        }
                    />
                    <MetricMiniCard
                        label="Keasaman (pH)"
                        value={currentData.pH.toFixed(2)}
                        status={currentData.pH < 6.05 ? "warning" : "success"}
                    />
                </div>

                {/* Grid layout */}
                <div className="cards-grid">
                    {/* Card 1: Performance Info */}
                    <div className="card card-welcome">
                        <div>
                            <h3>Performance Pertumbuhan</h3>
                            <h2>FCR & Pertumbuhan Biometrik Ikan</h2>
                            <p>
                                Populasi kolam terpantau{" "}
                                <strong>{currentData.Population} ekor</strong>{" "}
                                lele. Saat ini, rata-rata panjang ikan mencapai{" "}
                                <strong>{currentData.Length} cm</strong> dan
                                berat mencapai{" "}
                                <strong>{currentData.Weight} g</strong>.
                            </p>
                        </div>
                        <Button
                            variant="action"
                            icon={<TrendingUp size={14} />}
                            onClick={() => setActiveTab("analytics")}
                        >
                            <span>Lihat Proyeksi AI</span>
                        </Button>
                    </div>

                    {/* Card 2 & 3: Charts */}
                    <MetricCharts
                        currentMetricType={currentMetricType}
                        setCurrentMetricType={setCurrentMetricType}
                        latestRows={latestRows}
                        theme={theme}
                    />

                    {/* Card 4: Timeline */}
                    <Timeline />
                </div>
            </>
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
                            localStorage.setItem(
                                "aqua_current_user",
                                JSON.stringify(updatedUser),
                            );
                            const users = JSON.parse(
                                localStorage.getItem("aqua_users") || "[]",
                            ) as AppUser[];
                            const updatedUsers = users.map((u) =>
                                u.username.toLowerCase() ===
                                updatedUser.username.toLowerCase()
                                    ? updatedUser
                                    : u,
                            );
                            localStorage.setItem(
                                "aqua_users",
                                JSON.stringify(updatedUsers),
                            );
                        }}
                    />
                );
            case "dashboard":
            default:
                return renderDashboardContent();
        }
    };

    if (!currentUser) {
        return <Auth onLoginSuccess={handleLoginSuccess} theme={theme} />;
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
        >
            {renderTabContent()}
        </DashboardLayout>
    );
}
