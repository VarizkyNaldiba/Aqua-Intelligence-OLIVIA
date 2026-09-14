import { useState, useEffect } from "react";
import { LayoutGrid, TrendingUp, Fish, History, Settings, Database, Droplets, Users, Activity, Bell, LogOut } from "lucide-react";
import { router } from "@inertiajs/react";
import type { TabName, AppUser } from "../Types";

interface SidebarProps {
    activeTab: TabName;
    setActiveTab: (tab: TabName) => void;
    hasDanger?: boolean;
    currentUser?: AppUser | null;
    totalPonds?: number;
    isOnline?: boolean;
}

const Sidebar = ({
    activeTab,
    setActiveTab,
    hasDanger = true,
    currentUser,
    totalPonds: propTotalPonds,
    isOnline: propIsOnline,
}: SidebarProps) => {
    const userFromStorage: AppUser | null = (() => {
        try {
            const saved = localStorage.getItem("aqua_current_user");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    })();
    const user = currentUser || userFromStorage;
    const isAdmin = user?.role === "admin" || user?.username === "admin";
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Dynamic browser network online status
    const [isOnlineState, setIsOnlineState] = useState<boolean>(() => {
        if (typeof propIsOnline === "boolean") return propIsOnline;
        return typeof navigator !== "undefined" ? navigator.onLine : true;
    });

    useEffect(() => {
        if (typeof propIsOnline === "boolean") {
            setIsOnlineState(propIsOnline);
            return;
        }
        const handleOnline = () => setIsOnlineState(true);
        const handleOffline = () => setIsOnlineState(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [propIsOnline]);

    // Dynamic count of monitored ponds from localStorage
    const [pondCount, setPondCount] = useState<number>(() => {
        if (typeof propTotalPonds === "number") return propTotalPonds;
        try {
            const saved = localStorage.getItem("catfish_ponds_list");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
            }
        } catch {}
        return 4;
    });

    useEffect(() => {
        if (typeof propTotalPonds === "number") {
            setPondCount(propTotalPonds);
            return;
        }
        const updateCount = () => {
            try {
                const saved = localStorage.getItem("catfish_ponds_list");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setPondCount(parsed.length);
                        return;
                    }
                }
            } catch {}
        };
        updateCount();
        window.addEventListener("ponds_updated", updateCount);
        window.addEventListener("storage", updateCount);
        const interval = setInterval(updateCount, 1500);
        return () => {
            window.removeEventListener("ponds_updated", updateCount);
            window.removeEventListener("storage", updateCount);
            clearInterval(interval);
        };
    }, [propTotalPonds]);

    const menuItems = [
        { id: "dashboard",      icon: LayoutGrid, label: "Dashboard",        adminOnly: false },
        { id: "actuators",      icon: Droplets,   label: "Water Pump",       adminOnly: false },
        { id: "analytics",      icon: TrendingUp, label: "Predictions",      adminOnly: false },
        { id: "ponds",          icon: Fish,       label: "Pond Management",  adminOnly: false },
        { id: "dataset",        icon: Database,   label: "Studio Dataset",   adminOnly: false },
        { id: "history",        icon: History,    label: "History",          adminOnly: false },
        { id: "notifications",  icon: Bell,       label: "Notifications",    adminOnly: false },
        { id: "profile",        icon: Settings,   label: "Settings",         adminOnly: false },
        { id: "user_management",icon: Users,      label: "User Management",  adminOnly: true  },
        { id: "activity_logs",  icon: Activity,   label: "Log Activity Web", adminOnly: true  },
    ] as const;

    const handleItemClick = (id: TabName) => {
        if (window.location.pathname.startsWith("/esp")) {
            router.visit(`/dashboard?tab=${id}`);
        } else {
            setActiveTab(id);
        }
    };

    const handleLogout = () => {
        router.post("/logout");
    };

    const displayName = user?.name || user?.username || "Admin";
    const displayRole = isAdmin ? "Administrator System" : "User Operator";
    const initials = displayName.substring(0, 2).toUpperCase();

    return (
        <aside className="db-sidebar" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            {/* Logo block */}
            <div 
                style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "28px",
                    padding: "4px 0",
                }}
            >
                <div 
                    className="db-sidebar-logo-block" 
                    style={{ 
                        cursor: "pointer", 
                        display: "flex",
                        alignItems: "center",
                    }} 
                    onClick={() => handleItemClick("dashboard")}
                >
                    <div className="db-sidebar-logo-circle">
                        <Fish size={22} color="#ffffff" style={{ transform: "rotate(-30deg)" }} />
                    </div>
                    <div className="db-sidebar-logo-title-area">
                        <span className="db-sidebar-logo-title">CatfishCare</span>
                        <span className="db-sidebar-logo-sub">Pond Monitoring</span>
                    </div>
                </div>
            </div>

            {/* Menu List */}
            <nav className="db-sidebar-menu" style={{ flex: 1, overflowY: "auto" }}>
                {menuItems
                    .filter((item) => {
                        if (isAdmin) {
                            // Admin only accesses User Management, Log Activity Web, and Settings/Profile
                            return item.id === "user_management" || item.id === "activity_logs" || item.id === "profile";
                        }
                        // Normal user accesses operational monitoring tabs (exclude admin-only tools)
                        return !item.adminOnly;
                    })
                    .map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id;
                    const isDashboard = item.id === "dashboard";
                    return (
                        <div
                            key={item.id}
                            className={`db-sidebar-item ${isActive ? "active" : ""}`}
                            onClick={() => handleItemClick(item.id)}
                            style={{ position: "relative" }}
                        >
                            <div style={{ position: "relative", display: "inline-flex" }}>
                                <IconComponent size={20} />
                                {isDashboard && hasDanger && (
                                    <span
                                        className="db-sidebar-danger-dot"
                                        style={{
                                            position: "absolute",
                                            top: "-2px",
                                            right: "-2px",
                                            width: "8px",
                                            height: "8px",
                                            backgroundColor: "#ef4444",
                                            borderRadius: "50%",
                                            border: "1.5px solid #06152d",
                                            animation: "pulse-red 2s infinite",
                                        }}
                                        title="Pond warning active!"
                                    />
                                )}
                            </div>
                            <span>{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Controls Container */}
            <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Dynamic Status Card */}
                <div className="db-sidebar-status-card" style={{ marginBottom: "4px" }}>
                    <div className="db-sidebar-status-line" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span 
                            className="db-sidebar-status-dot"
                            style={{ 
                                backgroundColor: isOnlineState ? "#10b981" : "#ef4444",
                                width: "9px",
                                height: "9px",
                                borderRadius: "50%",
                                display: "inline-block",
                                boxShadow: isOnlineState ? "0 0 8px #10b981" : "0 0 8px #ef4444"
                            }}
                        ></span>
                        <span style={{ fontWeight: 600, fontSize: "12px", color: isOnlineState ? "#34d399" : "#f87171" }}>
                            {isOnlineState ? "All systems online" : "System Offline"}
                        </span>
                    </div>
                    <div className="db-sidebar-status-sub" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        {pondCount} {pondCount === 1 ? "pond" : "ponds"} actively monitored
                    </div>
                </div>

                {/* Quick Notification Bell Trigger above User Profile */}
                <div 
                    onClick={() => handleItemClick("notifications")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ position: "relative" }}>
                            <Bell size={18} style={{ color: "#38bdf8" }} />
                            <span
                                style={{
                                    position: "absolute",
                                    top: "-2px",
                                    right: "-2px",
                                    width: "7px",
                                    height: "7px",
                                    backgroundColor: "#ef4444",
                                    borderRadius: "50%",
                                }}
                            />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>Notifications</span>
                    </div>
                    <span style={{ fontSize: "10px", backgroundColor: "rgba(14, 165, 233, 0.2)", color: "#38bdf8", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>LIVE</span>
                </div>

                {/* User Profile Card at Bottom Left */}
                <div style={{ position: "relative" }}>
                    <div
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 12px",
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
                    >
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "#0284c7",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "14px",
                                flexShrink: 0,
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.4)",
                            }}
                        >
                            {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "13px", color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {displayName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {displayRole}
                            </div>
                        </div>
                        <LogOut size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
                    </div>

                    {/* Quick Logout Menu Dropdown */}
                    {showUserMenu && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "56px",
                                left: 0,
                                width: "100%",
                                backgroundColor: "#0f172a",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                borderRadius: "10px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                                zIndex: 100,
                                overflow: "hidden",
                                padding: "4px",
                            }}
                        >
                            <div
                                onClick={handleLogout}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#fca5a5",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <LogOut size={14} />
                                <span>Sign Out / Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
