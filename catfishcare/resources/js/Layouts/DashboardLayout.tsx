import { useState, type ReactNode } from "react";
import Sidebar from "@/Components/Sidebar";
import type { TabName, TodoItem, SensorRow } from "@/Types";
import { Bell, Menu, RotateCcw, Play, Pause, SkipForward } from "lucide-react";

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab: TabName;
    setActiveTab: (tab: TabName) => void;
    currentData: SensorRow | null;
    rawData: SensorRow[];
    selectedPondId: number;
    setSelectedPondId: (id: number) => void;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    todos: TodoItem[];
    toggleTodo: (id: number) => void;
}

export default function DashboardLayout({
    children,
    activeTab,
    setActiveTab,
    currentData,
    rawData,
    selectedPondId,
    setSelectedPondId,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
}: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const getTabBreadcrumbs = () => {
        switch (activeTab) {
            case "home":
                return "Home > Overview";
            case "ponds":
                return "Pond Management > List";
            case "analytics":
                return "Predictions > 24-Hour Forecast";
            case "profile":
                return "Settings > Notifications & Hardware";
            case "notifications":
                return "History > Data Reports";
            case "dataset":
                return "AI Studio > Pengumpulan Data Training Lele";
            case "dashboard":
            default:
                return "Dashboard > Real-Time";
        }
    };

    return (
        <div className="db-layout">
            {/* Sidebar Navigation */}
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isCollapsed={sidebarCollapsed} 
                toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            {/* Main Content Workspace */}
            <main className={`db-main ${sidebarCollapsed ? "collapsed" : ""}`}>
                {/* Top Header Bar */}
                <header className="db-topbar">
                    {/* Left: Breadcrumbs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div className="db-breadcrumbs">
                            <span>{getTabBreadcrumbs()}</span>
                        </div>
                    </div>

                    {/* Center/Right: Top Actions & Profile block */}
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>

                        {/* Top Right: Actions & User profile */}
                        <div className="db-topbar-actions">
                            {/* Notification bell */}
                            <button className="db-notif-btn">
                                <Bell size={20} />
                                <span className="db-notif-badge"></span>
                            </button>

                            {/* Profile Info */}
                            <div className="db-profile-block">
                                <img
                                    src="/avatar_ade_bassey.png"
                                    alt="Adé Bassey avatar"
                                    className="db-avatar"
                                />
                                <div className="db-profile-info">
                                    <div className="db-profile-name">Adé Bassey</div>
                                    <div className="db-profile-role">Farm Manager</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Pane */}
                <div key={activeTab} className="tab-entry-fade" style={{ width: "100%" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
