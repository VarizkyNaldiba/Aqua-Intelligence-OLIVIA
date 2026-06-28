import {
    Home,
    LayoutGrid,
    Folder,
    LineChart,
    User,
    Fish,
    Sun,
    Moon,
    Cpu,
} from "lucide-react";
import { Link } from "@inertiajs/react";
import type { TabName, Theme } from "../Types";

interface SidebarProps {
    activeTab: TabName;
    setActiveTab: (tab: TabName) => void;
    theme: Theme;
    toggleTheme: () => void;
}

const Sidebar = ({
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
}: SidebarProps) => {
    const menuItems: { id: TabName; icon: typeof Home; label: string }[] = [
        { id: "home", icon: Home, label: "Home" },
        { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
        { id: "ponds", icon: Folder, label: "Ponds" },
        { id: "analytics", icon: LineChart, label: "Analytics" },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Fish size={32} />
            </div>
            <nav className="sidebar-menu">
                {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <div
                            key={item.id}
                            className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => setActiveTab(item.id)}
                            title={item.label}
                        >
                            <IconComponent size={22} />
                        </div>
                    );
                })}

                <Link href="/esp" className="sidebar-item" title="ESP" as="div">
                    <Cpu size={22} />
                </Link>
            </nav>

            <div
                className="sidebar-theme-toggle"
                onClick={toggleTheme}
                title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
            >
                {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
            </div>

            <div className="sidebar-profile" title="Profile">
                <User size={22} onClick={() => setActiveTab("profile")} />
            </div>
        </aside>
    );
};

export default Sidebar;
