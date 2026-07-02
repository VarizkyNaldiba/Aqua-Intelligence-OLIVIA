import { useState, useEffect } from "react";
import Papa from "papaparse";
import Sidebar from "./Components/Sidebar";
import RightPanel from "./Components/RightPanel";
import MetricCharts from "./Components/MetricCharts";
import Timeline from "./Components/Timeline";
import HomeTab from "./Pages/Home";
import PondsTab from "./Pages/Ponds";
import AnalyticsTab from "./Pages/Analytics";
import ProfileTab from "./Pages/Profile";
import Auth from "./Pages/Login";
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    AlertTriangle,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
} from "lucide-react";

type ThemeSetting = "system" | "light" | "dark";
type TabName = "dashboard" | "home" | "ponds" | "analytics" | "profile";
type MetricType = "TEMPERATURE" | "pH" | "TURBIDITY";

type SensorRow = {
    created_at: string;
    entry_id: string;
    TEMPERATURE: number;
    TURBIDITY: number;
    pH: number;
    NITRATE: number;
    Population: number;
    Length: number;
    Weight: number;
};

type TodoItem = {
    id: number;
    text: string;
    checked: boolean;
};

type AppUser = {
    username: string;
    [key: string]: unknown;
};

type CsvRow = Record<string, string | number | null | undefined>;

type StatusInfo = {
    type: "success" | "warning" | "danger";
    title: string;
    text: string;
    actionList?: TodoItem[];
};

const parseValueFromRow = (row: CsvRow, keys: string[]): number => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== "") {
            const parsed = Number.parseFloat(String(value));
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }

    return 0;
};

const parseIntValueFromRow = (row: CsvRow, keys: string[]): number => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== "") {
            const parsed = Number.parseInt(String(value), 10);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }

    return 0;
};

const normalizeSensorRow = (row: CsvRow): SensorRow => ({
    created_at: String(row.created_at || ""),
    entry_id: String(row.entry_id || ""),
    TEMPERATURE: parseValueFromRow(row, ["TEMPERATURE", "Temperature (C)"]),
    TURBIDITY: parseValueFromRow(row, ["TURBIDITY", "Turbidity (NTU)"]),
    pH: parseValueFromRow(row, ["pH", "PH"]),
    NITRATE: parseValueFromRow(row, ["NITRATE", "Nitrate(g/ml)"]),
    Population: parseIntValueFromRow(row, ["Population"]),
    Length: parseValueFromRow(row, ["Length", "Fish_Length (cm)"]),
    Weight: parseValueFromRow(row, ["Weight", "Fish_Weight (g)"]),
});

const getInitialThemeSetting = (): ThemeSetting => {
    const storedSetting = localStorage.getItem("themeSetting");
    const storedTheme = localStorage.getItem("theme");

    if (
        storedSetting === "light" ||
        storedSetting === "dark" ||
        storedSetting === "system"
    ) {
        return storedSetting;
    }

    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return "system";
};

const handleCsvParseComplete = (
    results: { data: CsvRow[] },
    setRawData: React.Dispatch<React.SetStateAction<SensorRow[]>>,
) => {
    const cleanedData = results.data.map(normalizeSensorRow);
    setRawData(cleanedData);
};

function App() {
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
    const [rawData, setRawData] = useState<SensorRow[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentMetricType, setCurrentMetricType] =
        useState<MetricType>("TEMPERATURE");
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [themeSetting, setThemeSetting] = useState<ThemeSetting>(
        getInitialThemeSetting,
    );

    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (themeSetting === "system") {
            return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return themeSetting;
    });

    const changeThemeSetting = (newSetting: ThemeSetting) => {
        setThemeSetting(newSetting);
        localStorage.setItem("themeSetting", newSetting);
    };

    const toggleTheme = () => {
        setThemeSetting(() => {
            const nextSetting = theme === "light" ? "dark" : "light";
            localStorage.setItem("themeSetting", nextSetting);
            return nextSetting;
        });
    };

    useEffect(() => {
        if (themeSetting === "system") {
            const mediaQuery = globalThis.matchMedia(
                "(prefers-color-scheme: dark)",
            );
            const handleChange = (e: MediaQueryListEvent) => {
                setTheme(e.matches ? "dark" : "light");
            };

            setTheme(mediaQuery.matches ? "dark" : "light");
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        } else {
            setTheme(themeSetting);
        }
    }, [themeSetting]);

    useEffect(() => {
        document.body.className =
            theme === "light" ? "light-theme" : "dark-theme";
    }, [theme]);

    // Load and parse the CSV data
    useEffect(() => {
        // Reset simulation index and playing state on pond change
        setCurrentIndex(0);
        setIsPlaying(false);

        fetch(`/datasets/IoTPond${selectedPondId}.csv`)
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: { data: CsvRow[] }) =>
                        handleCsvParseComplete(results, setRawData),
                });
            })
            .catch((error) => console.error("Error fetching CSV:", error));
    }, [selectedPondId]);

    const currentData = rawData[currentIndex] ?? null;

    // AI Decision Logic (Decision Support System based on AGENTS.md rules)
    const getPondStatus = (): StatusInfo => {
        if (!currentData)
            return {
                type: "success",
                text: "Mengambil data...",
                title: "SEDANG MEMUAT",
            };

        const tempVal = currentData.TEMPERATURE;
        const nitrateVal = currentData.NITRATE;
        const pHVal = currentData.pH;

        // Skenario A: Suhu kritis atau pH ekstrem atau Nitrate tinggi
        if (tempVal < 26 || pHVal < 5.5 || nitrateVal > 300) {
            return {
                type: "danger",
                title: "🔴 BAHAYA KRITIS",
                text: "Suhu terlalu rendah, pH terlalu asam, atau Nitrate beracun terdeteksi! Segera lakukan tindakan.",
                actionList: [
                    {
                        id: 1,
                        text: `Segera periksa kondisi air di Kolam ${selectedPondId}.`,
                        checked: false,
                    },
                    {
                        id: 2,
                        text: "Lakukan pergantian air (Sifon) dasar kolam sebesar 30%.",
                        checked: false,
                    },
                    {
                        id: 3,
                        text: "Taburkan kapur Dolomit untuk menstabilkan pH air.",
                        checked: false,
                    },
                ],
            };
        }

        // Skenario B: Suhu dingin/fluktuatif (potensi Upwelling) ATAU pH asam
        if (tempVal < 27.05 || pHVal < 6.05 || nitrateVal > 250) {
            return {
                type: "warning",
                title: "🟡 WASPADA UPWELLING",
                text: "Suhu dingin atau pH asam terdeteksi. Risiko kotoran naik dari dasar kolam.",
                actionList: [
                    {
                        id: 1,
                        text: "Periksa penumpukan lumpur organik di dasar kolam.",
                        checked: false,
                    },
                    {
                        id: 2,
                        text: "Taburkan kapur Dolomit secukupnya untuk menaikkan pH.",
                        checked: false,
                    },
                    {
                        id: 3,
                        text: "Pertimbangkan pemberian probiotik air untuk menstabilkan bakteri pengurai.",
                        checked: false,
                    },
                ],
            };
        }

        // Skenario C: Normal
        return {
            type: "success",
            title: "🟢 AMAN & OPTIMAL",
            text: "Seluruh parameter kualitas air dalam kondisi prima. Pertumbuhan berjalan normal.",
            actionList: [
                {
                    id: 1,
                    text: "Kondisi kolam sangat baik. Lanjutkan jadwal pakan standar.",
                    checked: false,
                },
            ],
        };
    };

    const statusInfo = getPondStatus();

    // Reset or initialize to-do items whenever the active data point status changes
    useEffect(() => {
        if (statusInfo.actionList) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTodos(statusInfo.actionList);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, statusInfo.type]);

    // Simulation loop
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (isPlaying && rawData.length > 0) {
            intervalId = setInterval(() => {
                setCurrentIndex((prevIndex) => {
                    if (prevIndex >= rawData.length - 1) {
                        setIsPlaying(false);
                        return prevIndex;
                    }
                    return prevIndex + 1;
                });
            }, 2000); // Step every 2 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, rawData.length]);

    const toggleTodo = (id: number) => {
        setTodos((prevTodos) =>
            prevTodos.map((todo) =>
                todo.id === id ? { ...todo, checked: !todo.checked } : todo,
            ),
        );
    };

    // Sliding window of exactly 15 elements to allow smooth chart transitions without squishing
    const latestRows = rawData.slice(
        Math.max(0, currentIndex - 14),
        Math.max(15, currentIndex + 1),
    );

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
                        themeSetting={themeSetting}
                        onChangeThemeSetting={changeThemeSetting}
                        toggleTheme={toggleTheme}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        onProfileUpdate={(updatedUser: AppUser) => {
                            setCurrentUser(updatedUser);
                            localStorage.setItem(
                                "aqua_current_user",
                                JSON.stringify(updatedUser),
                            );
                            // Update user info in the users list
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
                return currentData ? (
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
                            <div className="metric-mini-card">
                                <span className="label">Suhu Air</span>
                                <span
                                    className={`value ${currentData.TEMPERATURE < 27.05 ? "warning" : "success"}`}
                                >
                                    {currentData.TEMPERATURE.toFixed(2)}°C
                                </span>
                            </div>
                            <div className="metric-mini-card">
                                <span className="label">Keasaman (pH)</span>
                                <span
                                    className={`value ${currentData.pH < 6.05 ? "warning" : "success"}`}
                                >
                                    {currentData.pH.toFixed(2)}
                                </span>
                            </div>
                            <div className="metric-mini-card">
                                <span className="label">Kekeruhan (Turbidity)</span>
                                <span
                                    className={`value ${currentData.TURBIDITY > 50 ? "warning" : "success"}`}
                                >
                                    {currentData.TURBIDITY.toFixed(2)} NTU
                                </span>
                            </div>
                        </div>

                        {/* Grid layout */}
                        <div className="cards-grid">
                            {/* Card 1: Content builds trust / Info */}
                            <div className="card card-welcome">
                                <div>
                                    <h3>Performance Pertumbuhan</h3>
                                    <h2>FCR & Pertumbuhan Biometrik Ikan</h2>
                                    <p>
                                        Populasi kolam terpantau{" "}
                                        <strong>
                                            {currentData.Population} ekor
                                        </strong>{" "}
                                        lele. Saat ini, rata-rata panjang ikan
                                        mencapai{" "}
                                        <strong>{currentData.Length} cm</strong>{" "}
                                        dan berat mencapai{" "}
                                        <strong>{currentData.Weight} g</strong>.
                                    </p>
                                </div>
                                <button
                                    className="btn-action"
                                    onClick={() => setActiveTab("analytics")}
                                >
                                    <TrendingUp size={14} />
                                    <span>Lihat Proyeksi AI</span>
                                </button>
                            </div>

                            {/* Card 2 & 3: Donut & Line charts */}
                            <MetricCharts
                                currentMetricType={currentMetricType}
                                setCurrentMetricType={setCurrentMetricType}
                                latestRows={latestRows}
                                theme={theme}
                            />

                            {/* Card 4: Timeline / Gantt Chart */}
                            <Timeline />
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                        <h2>Memuat data IoT...</h2>
                    </div>
                );
        }
    };

    if (!currentUser) {
        return <Auth onLoginSuccess={handleLoginSuccess} theme={theme} />;
    }

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
                            <h1>Aqua-Intelligence OLIVIA</h1>
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

                {renderTabContent()}
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

export default App;
