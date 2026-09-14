import { type ReactNode } from "react";
import Sidebar from "@/Components/Sidebar";
import type { TabName, TodoItem, SensorRow, AppUser } from "@/Types";

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
    currentUser?: AppUser | null;
}

export default function DashboardLayout({
    children,
    activeTab,
    setActiveTab,
    currentData: _currentData,
    rawData: _rawData,
    selectedPondId: _selectedPondId,
    setSelectedPondId: _setSelectedPondId,
    currentIndex: _currentIndex,
    setCurrentIndex: _setCurrentIndex,
    isPlaying: _isPlaying,
    setIsPlaying: _setIsPlaying,
    currentUser,
}: DashboardLayoutProps) {
    return (
        <div className="db-layout">
            {/* Sidebar Navigation */}
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                currentUser={currentUser}
            />

            {/* Main Content Workspace */}
            <main className="db-main" style={{ padding: "24px", overflowY: "auto", minHeight: "100vh", flex: 1 }}>
                {/* Main Content Pane */}
                <div key={activeTab} className="tab-entry-fade" style={{ width: "100%" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
