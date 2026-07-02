import { useState, useEffect, type ReactNode } from "react";
import Sidebar from "@/Components/Sidebar";
import RightPanel from "@/Components/RightPanel";
import type { TabName, TodoItem, SensorRow } from "@/Types";
import { useTheme } from "@/Hooks/useTheme";
import { getPondStatus } from "@/Utils/statusLogic";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

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
    todos,
    toggleTodo,
}: DashboardLayoutProps) {
    const { theme, toggleTheme } = useTheme();
    const statusInfo = getPondStatus(currentData, selectedPondId);

    return (
        <div className="app-container">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <main
                className={`main-content ${activeTab === "dashboard" ? "" : "full-width"}`}
            >
                {activeTab === "dashboard" && (
                    <header className="dashboard-header">
                        <div className="dashboard-title">
                            <h1>CATFISHCARE</h1>
                            <p>
                                Sistem Deteksi Pencegahan Gagal Panen Lele -
                                Kolam {selectedPondId}
                            </p>
                        </div>

                        <div className="header-controls">
                            {/* Pond Selector */}
                            <div className="pond-select-bar">
                                <span>Pilih Kolam:</span>
                                <select
                                    value={selectedPondId}
                                    onChange={(e) =>
                                        setSelectedPondId(
                                            Number.parseInt(e.target.value, 10),
                                        )
                                    }
                                    className="pond-select-dropdown"
                                >
                                    {Array.from(
                                        { length: 12 },
                                        (_, i) => i + 1,
                                    ).map((id) => (
                                        <option key={id} value={id}>
                                            Kolam {id < 10 ? `0${id}` : id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Simulation Controls */}
                            {rawData.length > 0 && (
                                <div className="simulation-bar">
                                    <span>Simulasi IoT:</span>
                                    <button
                                        className="sim-btn"
                                        onClick={() => {
                                            setCurrentIndex(0);
                                            setIsPlaying(false);
                                        }}
                                        title="Reset ke awal"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                    <button
                                        className={`sim-btn ${isPlaying ? "active" : ""}`}
                                        onClick={() => setIsPlaying(!isPlaying)}
                                    >
                                        {isPlaying ? (
                                            <Pause size={14} />
                                        ) : (
                                            <Play size={14} />
                                        )}
                                    </button>
                                    <button
                                        className="sim-btn"
                                        onClick={() => {
                                            if (
                                                currentIndex <
                                                rawData.length - 1
                                            ) {
                                                setCurrentIndex(
                                                    currentIndex + 1,
                                                );
                                            }
                                        }}
                                        disabled={
                                            currentIndex >= rawData.length - 1
                                        }
                                    >
                                        <SkipForward size={14} />
                                    </button>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        Row: {currentIndex + 1} /{" "}
                                        {rawData.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>
                )}

                {children}
            </main>

            {activeTab === "dashboard" && (
                <RightPanel
                    currentData={currentData}
                    statusInfo={statusInfo}
                    todos={todos}
                    toggleTodo={toggleTodo}
                />
            )}
        </div>
    );
}
