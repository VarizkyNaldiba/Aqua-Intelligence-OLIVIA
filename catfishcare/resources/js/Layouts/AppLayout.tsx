import { type ReactNode } from "react";
import Sidebar from "@/Components/Sidebar";
import { useTheme } from "@/Hooks/useTheme";
import type { TabName } from "@/Types";

interface AppLayoutProps {
    children: ReactNode;
    activeTab?: TabName;
}

export default function AppLayout({
    children,
    activeTab = "dashboard",
}: AppLayoutProps) {
    const { theme, toggleTheme } = useTheme();

    const noop = () => {};

    return (
        <div className="app-container">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={noop}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <main className="main-content full-width">{children}</main>
        </div>
    );
}
