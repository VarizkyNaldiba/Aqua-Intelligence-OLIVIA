import { LayoutGrid, TrendingUp, Fish, History, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { router } from "@inertiajs/react";
import type { TabName } from "../Types";

interface SidebarProps {
    activeTab: TabName;
    setActiveTab: (tab: TabName) => void;
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
    hasDanger?: boolean;
}

const Sidebar = ({
    activeTab,
    setActiveTab,
    isCollapsed = false,
    toggleCollapse,
    hasDanger = true,
}: SidebarProps) => {
    const menuItems = [
        { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
        { id: "analytics", icon: TrendingUp, label: "Predictions" },
        { id: "ponds", icon: Fish, label: "Pond Management" },
        { id: "notifications", icon: History, label: "History" },
        { id: "profile", icon: Settings, label: "Settings" },
    ] as const;

    const handleItemClick = (id: TabName) => {
        if (window.location.pathname.startsWith("/esp")) {
            router.visit(`/dashboard?tab=${id}`);
        } else {
            setActiveTab(id);
        }
    };

    return (
        <aside className={`db-sidebar ${isCollapsed ? "collapsed" : ""}`}>
            {/* Collapsible toggle arrow button outside sidebar edge */}
            <button 
                onClick={toggleCollapse} 
                className="db-sidebar-toggle-btn"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            {/* Logo block */}
            <div 
                style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: isCollapsed ? "center" : "flex-start", 
                    marginBottom: "40px",
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
            <nav className="db-sidebar-menu">
                {menuItems.map((item) => {
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

            {/* Status card at the bottom */}
            <div className="db-sidebar-status-card">
                <div className="db-sidebar-status-line">
                    <span className="db-sidebar-status-dot"></span>
                    <span>All systems online</span>
                </div>
                <div className="db-sidebar-status-sub">
                    4 ponds actively monitored
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
